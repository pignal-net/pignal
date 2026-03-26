import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

import { drizzle } from 'drizzle-orm/d1';

import {
  createItemRoutes,
  createTypeRoutes,
  createWorkspaceRoutes,
  createStatsRoutes,
  createSettingsRoutes,
  createPublicRoutes,
  createActionRoutes,
  createSubmissionRoutes,
  createFormRoutes,
} from '@pignal/core/routes';
import { ApiKeyStore } from '@pignal/core/store/api-keys';
import { getDefaultToolManifest } from '@pignal/core/mcp/manifest';
import { getTemplateConfig } from '@pignal/templates';
import { createWebRoutes } from '@pignal/web';

import { SelfHostedMcpAgent } from './mcp/agent';
import { tokenAuth } from './middleware/token-auth';
import { requirePermission, requireByMethod, resolveItemPermission, mcpPermissionCheck, enforceWorkspaceRestriction } from './middleware/permission-auth';
import { corsMiddleware } from './middleware/cors';
import { rateLimit } from './middleware/rate-limit';
import { storeMiddleware } from './middleware/store';
import { visitorAuth } from './middleware/visitor-auth';
import type { Env, Variables } from './types';

// Re-export MCP agent class for Cloudflare Workers to instantiate
export { SelfHostedMcpAgent };

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Store middleware — creates ItemStore from D1 for every request
app.use('*', storeMiddleware);

// Visitor authentication (hub SSO — managed sites only, skips if no VISITOR_SITE_SECRET)
app.use('*', visitorAuth);

// CORS for REST API routes (controlled by CORS_ORIGIN env var)
app.use('/api/*', corsMiddleware());

// Health check (no auth)
app.get('/health', (c) => {
  return c.json({
    name: 'pignal-server',
    version: '1.0.0',
    status: 'healthy',
  });
});

// Federation discovery (no auth)
app.get('/.well-known/pignal', async (c) => {
  const store = c.get('store');
  const types = await store.listTypes();
  const recentPublic = await store.listPublic({ limit: 1 });
  const lastItemAt = recentPublic.items[0]?.vouchedAt ?? null;
  const settings = await store.getSettings();

  // Extract GitHub username from GitHub URL (e.g. "https://github.com/octocat" → "octocat")
  let githubLogin = '';
  const githubUrl = settings.source_social_github ?? '';
  if (githubUrl) {
    try {
      const parsed = new URL(githubUrl);
      if (parsed.hostname === 'github.com' || parsed.hostname === 'www.github.com') {
        githubLogin = parsed.pathname.split('/').filter(Boolean)[0] ?? '';
      }
    } catch { /* invalid URL, leave empty */ }
  }

  const templateConfig = getTemplateConfig(c.env.TEMPLATE || 'blog');
  const { profile } = templateConfig;

  c.header('Cache-Control', 'public, max-age=300');
  return c.json({
    version: '1.2.0',
    api_version: 'v1',
    owner: {
      github_login: githubLogin,
      name: settings.owner_name ?? '',
    },
    capabilities: {
      items: true,
      mcp: true,
      web_ui: true,
      federation: true,
    },
    stats: {
      public_item_count: recentPublic.total,
      item_type_count: types.length,
      last_item_at: lastItemAt,
    },
    endpoints: {
      api: '/api',
      mcp: '/mcp',
      public_items: '/api/public/items',
    },
    language: {
      preferred: settings.source_locale || 'en',
      supported: ['en', 'vi', 'zh'],
    },
    template: {
      id: profile.id,
      displayName: profile.displayName,
      domain: profile.domain,
      contentType: profile.contentType,
      layout: profile.layout,
      tagline: profile.tagline,
    },
    tools: getDefaultToolManifest(templateConfig.mcp),
  });
});

// Rate limiting for API routes (method-aware: read vs write tiers)
const apiWriteLimit = rateLimit('apiWrite');
const apiReadLimit = rateLimit('apiRead');
app.use('/api/*', async (c, next) => {
  const method = c.req.method.toUpperCase();
  const isWrite = method === 'POST' || method === 'PATCH' || method === 'DELETE';
  return isWrite ? apiWriteLimit(c, next) : apiReadLimit(c, next);
});

// Public REST API (no auth) — mount before authenticated routes
// to avoid stats middleware at /api catching /api/public/*
app.route('/api/public', createPublicRoutes({
  getStore: (c) => c.get('store'),
}));

// Permission enforcement for authenticated API routes
// Applied after tokenAuth (which sets authPermissions on context)
app.use('/api/items', tokenAuth, resolveItemPermission, enforceWorkspaceRestriction);
app.use('/api/items/*', tokenAuth, resolveItemPermission, enforceWorkspaceRestriction);
app.use('/api/types', tokenAuth, requireByMethod('get_metadata', 'manage_types'));
app.use('/api/types/*', tokenAuth, requireByMethod('get_metadata', 'manage_types'));
app.use('/api/workspaces', tokenAuth, requireByMethod('get_metadata', 'manage_workspaces'));
app.use('/api/workspaces/*', tokenAuth, requireByMethod('get_metadata', 'manage_workspaces'));
app.use('/api/settings', tokenAuth, requireByMethod('get_metadata', 'manage_settings'));
app.use('/api/settings/*', tokenAuth, requireByMethod('get_metadata', 'manage_settings'));
app.use('/api/stats', tokenAuth, requirePermission('get_metadata'));
app.use('/api/metadata', tokenAuth, requirePermission('get_metadata'));

// Site Actions + Submissions (authenticated)
app.use('/api/actions', tokenAuth, requireByMethod('get_metadata', 'manage_actions'));
app.use('/api/actions/*', tokenAuth, requireByMethod('get_metadata', 'manage_actions'));
app.use('/api/submissions', tokenAuth, requirePermission('manage_actions'));
app.use('/api/submissions/*', tokenAuth, requirePermission('manage_actions'));

// Mount REST API routes (authenticated — tokenAuth already applied above via use())
const noAuthConfig = {
  getStore: (c: { get: (key: 'store') => Variables['store'] }) => c.get('store'),
};
app.route('/api/items', createItemRoutes(noAuthConfig));
app.route('/api/types', createTypeRoutes(noAuthConfig));
app.route('/api/workspaces', createWorkspaceRoutes(noAuthConfig));
app.route('/api/settings', createSettingsRoutes(noAuthConfig));
app.route('/api', createStatsRoutes(noAuthConfig));

// Action store config
const actionConfig = {
  getActionStore: (c: { get: (key: 'actionStore') => Variables['actionStore'] }) => c.get('actionStore'),
};
app.route('/api/actions', createActionRoutes(actionConfig));
app.route('/api/submissions', createSubmissionRoutes(actionConfig));

// Public form routes (no auth, rate-limited)
app.route('/form', createFormRoutes(actionConfig));

// MCP endpoint — uses SDK's serveSSE() to bridge HTTP/SSE <-> DO WebSocket
// MCP keeps origin: '*' because MCP clients connect from various origins and
// all requests require a valid Bearer token (tokenAuth + mcpPermissionCheck below).
const mcpHandler = SelfHostedMcpAgent.serveSSE('/mcp', {
  binding: 'MCP_AGENT',
  corsOptions: {
    origin: '*',
    headers: 'Content-Type, Authorization',
  },
});

// Permission enforcement for MCP: tokenAuth sets authPermissions, mcpPermissionCheck
// parses JSON-RPC body and blocks tool calls that exceed the token's permissions.
app.all('/mcp', rateLimit('mcp'), tokenAuth, mcpPermissionCheck, (c) => {
  return mcpHandler.fetch(c.req.raw, c.env, c.executionCtx);
});
app.all('/mcp/*', rateLimit('mcp'), tokenAuth, mcpPermissionCheck, (c) => {
  return mcpHandler.fetch(c.req.raw, c.env, c.executionCtx);
});

// Web UI (mounted last -- catches all remaining routes)
app.route('/', createWebRoutes({
  getStore: (c) => c.get('store'),
  getApiKeyStore: (c) => new ApiKeyStore(drizzle(c.env.DB)),
  getTemplateName: (c) => c.env.TEMPLATE || 'blog',
}));

// Global error handler
app.onError((err, c) => {
  console.error('Error:', err);

  if (err instanceof HTTPException) {
    return c.json(
      {
        error: err.message,
        status: err.status,
      },
      err.status
    );
  }

  return c.json(
    {
      error: 'Internal server error',
      status: 500,
    },
    500
  );
});

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      error: 'Not found',
      status: 404,
    },
    404
  );
});

export default app;
