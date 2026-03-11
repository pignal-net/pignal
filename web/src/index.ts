import { Hono } from 'hono';
import type { Signal } from '@pignal/core';
import type { SignalWithMeta, SignalStoreRpc } from '@pignal/db';

import type { WebEnv, WebRouteConfig } from './types';
import type { ApiKeyStore } from '@pignal/core/store/api-keys';

// Middleware
import { securityHeaders } from './middleware/headers';
import { sessionMiddleware } from './middleware/session';
import { csrfMiddleware } from './middleware/csrf';
import { clearSessionCookie } from './lib/cookie';

// Static assets (imported as raw text)
import picoCSS from './static/pico.min.css';
import htmxJS from './static/htmx.min.js';
import appCSS from './static/app.css';
import appJS from './static/app.js';
import { logoSVG } from './lib/static-versions';

// Pages
import { loginPage, loginHandler } from './pages/login';
import { dashboardPage } from './pages/dashboard';
import { signalsPage, signalListPartial } from './pages/signals';
import {
  signalDetailPage,
  validateHandler,
  archiveHandler,
  unarchiveHandler,
  visibilityHandler,
} from './pages/signal-detail';
import { typesPage, createTypeHandler, updateTypeHandler, deleteTypeHandler } from './pages/types';
import {
  workspacesPage,
  createWorkspaceHandler,
  batchUpdateWorkspacesHandler,
  deleteWorkspaceHandler,
} from './pages/workspaces';
import { settingsPage, updateSettingHandler, batchUpdateSettingsHandler } from './pages/settings';
import { apiKeysPage, createApiKeyHandler, deleteApiKeyHandler } from './pages/api-keys';
import { sourcePageFeed } from './pages/source-page';
import { signalPostPage } from './pages/signal-post';
import { sharedPage } from './pages/shared';

// Lib
import { generateRobotsTxt, generateSitemap, generateSitemapIndex, generateLlmsTxt, generateLlmsFullTxt, SITEMAP_PAGE_SIZE } from './lib/geo';
import { generateAtomFeed } from './lib/rss';
import { formatDate, readingTime } from './lib/time';

function toSignal(row: SignalWithMeta): Signal {
  return {
    id: row.id,
    keySummary: row.keySummary,
    content: row.content,
    typeId: row.typeId,
    typeName: row.typeName,
    workspaceId: row.workspaceId,
    workspaceName: row.workspaceName,
    sourceAi: row.sourceAi,
    validationActionId: row.validationActionId,
    validationActionLabel: row.validationActionLabel,
    tags: row.tags,
    isArchived: row.isArchived === 1,
    visibility: row.visibility ?? 'private',
    slug: row.slug,
    shareToken: row.shareToken,
    vouchedAt: row.vouchedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function createWebRoutes(config: WebRouteConfig) {
  const router = new Hono<{ Bindings: WebEnv; Variables: { store: SignalStoreRpc; apiKeyStore?: ApiKeyStore } }>();

  // Security headers on ALL responses
  router.use('*', securityHeaders);

  // Inject store into context for all routes
  router.use('*', async (c, next) => {
    c.set('store', config.getStore(c));
    if (config.getApiKeyStore) {
      c.set('apiKeyStore', config.getApiKeyStore(c));
    }
    await next();
  });

  // Static assets (no auth, immutable cache)
  router.get('/static/pico.min.css', (c) => {
    c.header('Content-Type', 'text/css');
    c.header('Cache-Control', 'public, max-age=31536000, immutable');
    return c.body(picoCSS);
  });
  router.get('/static/htmx.min.js', (c) => {
    c.header('Content-Type', 'application/javascript');
    c.header('Cache-Control', 'public, max-age=31536000, immutable');
    return c.body(htmxJS);
  });
  router.get('/static/app.css', (c) => {
    c.header('Content-Type', 'text/css');
    c.header('Cache-Control', 'public, max-age=31536000, immutable');
    return c.body(appCSS);
  });
  router.get('/static/app.js', (c) => {
    c.header('Content-Type', 'application/javascript');
    c.header('Cache-Control', 'public, max-age=31536000, immutable');
    return c.body(appJS);
  });
  router.get('/static/logo.svg', (c) => {
    c.header('Content-Type', 'image/svg+xml');
    c.header('Cache-Control', 'public, max-age=31536000, immutable');
    return c.body(logoSVG);
  });
  router.get('/favicon.ico', (c) => {
    c.header('Content-Type', 'image/svg+xml');
    c.header('Cache-Control', 'public, max-age=86400');
    return c.body(logoSVG);
  });

  // SEO/metadata endpoints (no auth, cached)
  router.get('/robots.txt', (c) => {
    const sourceUrl = new URL(c.req.url).origin;
    c.header('Content-Type', 'text/plain');
    c.header('Cache-Control', 'public, max-age=86400');
    return c.body(generateRobotsTxt(sourceUrl));
  });

  router.get('/sitemap.xml', async (c) => {
    const store = c.get('store');
    const sourceUrl = new URL(c.req.url).origin;
    const result = await store.listPublic({ limit: SITEMAP_PAGE_SIZE, offset: 0 });
    c.header('Content-Type', 'application/xml');
    c.header('Cache-Control', 'public, max-age=3600');
    if (result.total <= SITEMAP_PAGE_SIZE) {
      const items = result.items.map(toSignal);
      return c.body(generateSitemap(sourceUrl, items));
    }
    return c.body(generateSitemapIndex(sourceUrl, result.total));
  });

  router.get('/sitemap-:page', async (c) => {
    const page = parseInt(c.req.param('page') ?? '', 10);
    const store = c.get('store');
    const sourceUrl = new URL(c.req.url).origin;
    const { total } = await store.listPublic({ limit: 1, offset: 0 });
    const maxPage = Math.ceil(total / SITEMAP_PAGE_SIZE);
    if (isNaN(page) || page < 1 || page > maxPage) {
      return c.notFound();
    }
    const offset = (page - 1) * SITEMAP_PAGE_SIZE;
    const result = await store.listPublic({ limit: SITEMAP_PAGE_SIZE, offset });
    const items = result.items.map(toSignal);
    c.header('Content-Type', 'application/xml');
    c.header('Cache-Control', 'public, max-age=3600');
    return c.body(generateSitemap(sourceUrl, items, page === 1));
  });

  router.get('/llms.txt', async (c) => {
    const store = c.get('store');
    const sourceUrl = new URL(c.req.url).origin;
    const [settings, types, result] = await Promise.all([
      store.getSettings(),
      store.listTypes(),
      store.listPublic({ limit: 1, offset: 0 }),
    ]);
    c.header('Content-Type', 'text/plain; charset=utf-8');
    c.header('Cache-Control', 'public, max-age=3600');
    return c.body(generateLlmsTxt(settings, types, result.total, sourceUrl));
  });

  router.get('/llms-full.txt', async (c) => {
    const store = c.get('store');
    const sourceUrl = new URL(c.req.url).origin;
    const [metadata, result] = await Promise.all([
      store.getMetadata(),
      store.listPublic({ limit: 1, offset: 0 }),
    ]);
    // Only expose public workspaces on public endpoints
    metadata.workspaces = metadata.workspaces.filter((w) => w.visibility === 'public');
    c.header('Content-Type', 'text/plain; charset=utf-8');
    c.header('Cache-Control', 'public, max-age=3600');
    return c.body(generateLlmsFullTxt(metadata, result.total, sourceUrl));
  });

  // Public source page at root (no auth, no CSRF, no HTMX -- pure SSR for crawlability)
  router.get('/', sourcePageFeed);

  router.get('/feed.xml', async (c) => {
    const store = c.get('store');
    const sourceUrl = new URL(c.req.url).origin;
    const [settings, result] = await Promise.all([
      store.getSettings(),
      store.listPublic({ limit: 50 }),
    ]);
    const items = result.items.map(toSignal);
    c.header('Content-Type', 'application/atom+xml; charset=utf-8');
    c.header('Cache-Control', 'public, max-age=3600');
    return c.body(generateAtomFeed(settings, items, sourceUrl));
  });
  // Source post: serves HTML or raw markdown based on .md suffix
  router.get('/signal/:slug', async (c) => {
    const slugParam = c.req.param('slug') ?? '';

    // Raw markdown endpoint: /signal/:slug.md
    if (slugParam.endsWith('.md')) {
      const slug = slugParam.slice(0, -3);
      const store = c.get('store');
      const [row, settings] = await Promise.all([
        store.getBySlug(slug),
        store.getSettings(),
      ]);
      if (!row) {
        c.status(404);
        return c.text('Not found');
      }

      const signal = toSignal(row);
      const domain = new URL(c.req.url).hostname;
      const sourceAuthor = settings.owner_name || settings.source_title || domain;
      const githubUrl = settings.source_social_github || '';
      const authorMd = githubUrl ? `[${sourceAuthor}](${githubUrl})` : sourceAuthor;

      // Build metadata line: "March 10, 2026 · 1 min read"
      const date = formatDate(signal.vouchedAt || signal.createdAt);
      const reading = readingTime(signal.content);
      const metaParts: string[] = [date, reading];

      // Validation badge: "Accurate by [author](github)"
      if (signal.validationActionLabel) {
        metaParts.push(`${signal.validationActionLabel} by ${authorMd}`);
      }

      // AI source: "AI-assisted via Claude"
      if (signal.sourceAi) {
        const aiName = signal.sourceAi === 'mcp-self-hosted'
          ? 'MCP'
          : signal.sourceAi.includes(':')
            ? signal.sourceAi.split(':')[1]
            : signal.sourceAi;
        if (aiName) metaParts.push(`AI-assisted via ${aiName}`);
      }

      const metaLine = `*${metaParts.join(' · ')}*`;

      // Tags footer
      const tagsLine = signal.tags && signal.tags.length > 0
        ? `\n\n---\n\n${signal.tags.map((t) => `#${t}`).join(' ')}`
        : '';

      c.header('Content-Type', 'text/markdown; charset=utf-8');
      c.header('Cache-Control', 'public, max-age=60');
      return c.body(`# ${signal.keySummary}\n\n${metaLine}\n\n---\n\n${signal.content}${tagsLine}`);
    }

    // HTML source post
    return signalPostPage(c);
  });
  router.get('/s/:token', sharedPage);

  // Admin login (no session required)
  router.get('/pignal/login', loginPage);
  router.post('/pignal/login', loginHandler);

  // All /pignal routes below require session + CSRF
  router.use('/pignal/*', sessionMiddleware);
  router.use('/pignal/*', csrfMiddleware);

  // Logout
  router.get('/pignal/logout', (c) => {
    c.header('Set-Cookie', clearSessionCookie());
    return c.redirect('/pignal/login');
  });

  // Admin pages
  router.get('/pignal', dashboardPage);
  router.get('/pignal/signals', signalsPage);
  router.get('/pignal/signals/list', signalListPartial);
  router.get('/pignal/signals/:id', signalDetailPage);

  // Signal actions (HTMX partial + form POST fallback)
  router.post('/pignal/signals/:id/validate', validateHandler);
  router.post('/pignal/signals/:id/archive', archiveHandler);
  router.post('/pignal/signals/:id/unarchive', unarchiveHandler);
  router.post('/pignal/signals/:id/visibility', visibilityHandler);

  // Types CRUD
  router.get('/pignal/types', typesPage);
  router.post('/pignal/types', createTypeHandler);
  router.post('/pignal/types/:id/update', updateTypeHandler);
  router.post('/pignal/types/:id/delete', deleteTypeHandler);

  // Workspaces CRUD
  router.get('/pignal/workspaces', workspacesPage);
  router.post('/pignal/workspaces', createWorkspaceHandler);
  router.post('/pignal/workspaces/batch', batchUpdateWorkspacesHandler);
  router.post('/pignal/workspaces/:id/delete', deleteWorkspaceHandler);

  // Settings
  router.get('/pignal/settings', settingsPage);
  router.post('/pignal/settings/batch', batchUpdateSettingsHandler);
  router.post('/pignal/settings/:key', updateSettingHandler);

  // API Keys
  router.get('/pignal/api-keys', apiKeysPage);
  router.post('/pignal/api-keys', createApiKeyHandler);
  router.post('/pignal/api-keys/:id/delete', deleteApiKeyHandler);

  return router;
}

export type { WebEnv, WebRouteConfig } from './types';
