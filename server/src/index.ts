import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';

import { drizzle } from 'drizzle-orm/d1';

import {
  createSignalRoutes,
  createTypeRoutes,
  createWorkspaceRoutes,
  createStatsRoutes,
  createSettingsRoutes,
  createPublicRoutes,
} from '@pignal/core/routes';
import { ApiKeyStore } from '@pignal/core/store/api-keys';
import { getDefaultToolManifest } from '@pignal/core/mcp/manifest';
import { createWebRoutes } from '@pignal/web';

import { SelfHostedMcpAgent } from './mcp/agent';
import { tokenAuth } from './middleware/token-auth';
import { requirePermission, requireByMethod, resolveSignalPermission, mcpPermissionCheck, enforceWorkspaceRestriction } from './middleware/permission-auth';
import { storeMiddleware } from './middleware/store';
import type { Env, Variables } from './types';

// Re-export MCP agent class for Cloudflare Workers to instantiate
export { SelfHostedMcpAgent };

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Store middleware — creates SignalStore from D1 for every request
app.use('*', storeMiddleware);

// CORS for REST API routes
app.use('/api/*', cors());

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
  const lastSignalAt = recentPublic.items[0]?.vouchedAt ?? null;
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

  c.header('Cache-Control', 'public, max-age=300');
  return c.json({
    version: '1.1.0',
    api_version: 'v1',
    owner: {
      github_login: githubLogin,
      name: settings.owner_name ?? '',
    },
    capabilities: {
      signals: true,
      mcp: true,
      web_ui: true,
      federation: true,
    },
    stats: {
      public_signal_count: recentPublic.total,
      signal_type_count: types.length,
      last_signal_at: lastSignalAt,
    },
    endpoints: {
      api: '/api',
      mcp: '/mcp',
      public_signals: '/api/public/signals',
    },
    tools: getDefaultToolManifest(),
  });
});

// Public REST API (no auth) — mount before authenticated routes
// to avoid stats middleware at /api catching /api/public/*
app.route('/api/public', createPublicRoutes({
  getStore: (c) => c.get('store'),
}));

// Permission enforcement for authenticated API routes
// Applied after tokenAuth (which sets authPermissions on context)
app.use('/api/signals', tokenAuth, resolveSignalPermission, enforceWorkspaceRestriction);
app.use('/api/signals/*', tokenAuth, resolveSignalPermission, enforceWorkspaceRestriction);
app.use('/api/types', tokenAuth, requireByMethod('get_metadata', 'manage_types'));
app.use('/api/types/*', tokenAuth, requireByMethod('get_metadata', 'manage_types'));
app.use('/api/workspaces', tokenAuth, requireByMethod('get_metadata', 'manage_workspaces'));
app.use('/api/workspaces/*', tokenAuth, requireByMethod('get_metadata', 'manage_workspaces'));
app.use('/api/settings', tokenAuth, requireByMethod('get_metadata', 'manage_settings'));
app.use('/api/settings/*', tokenAuth, requireByMethod('get_metadata', 'manage_settings'));
app.use('/api/stats', tokenAuth, requirePermission('get_metadata'));
app.use('/api/metadata', tokenAuth, requirePermission('get_metadata'));

// Mount REST API routes (authenticated — tokenAuth already applied above via use())
const noAuthConfig = {
  getStore: (c: { get: (key: 'store') => Variables['store'] }) => c.get('store'),
};
app.route('/api/signals', createSignalRoutes(noAuthConfig));
app.route('/api/types', createTypeRoutes(noAuthConfig));
app.route('/api/workspaces', createWorkspaceRoutes(noAuthConfig));
app.route('/api/settings', createSettingsRoutes(noAuthConfig));
app.route('/api', createStatsRoutes(noAuthConfig));

// MCP endpoint — uses SDK's serveSSE() to bridge HTTP/SSE <-> DO WebSocket
const mcpHandler = SelfHostedMcpAgent.serveSSE('/mcp', {
  binding: 'MCP_AGENT',
  corsOptions: {
    origin: '*',
    headers: 'Content-Type, Authorization',
  },
});

// Permission enforcement for MCP: tokenAuth sets authPermissions, mcpPermissionCheck
// parses JSON-RPC body and blocks tool calls that exceed the token's permissions.
app.all('/mcp', tokenAuth, mcpPermissionCheck, (c) => {
  return mcpHandler.fetch(c.req.raw, c.env, c.executionCtx);
});
app.all('/mcp/*', tokenAuth, mcpPermissionCheck, (c) => {
  return mcpHandler.fetch(c.req.raw, c.env, c.executionCtx);
});

// Web UI (mounted last -- catches all remaining routes)
app.route('/', createWebRoutes({
  getStore: (c) => c.get('store'),
  getApiKeyStore: (c) => new ApiKeyStore(drizzle(c.env.DB)),
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
