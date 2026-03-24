import { Hono } from 'hono';
import type { Item } from '@pignal/core';
import type { ItemWithMeta, ItemStoreRpc } from '@pignal/db';

import type { WebEnv, WebRouteConfig } from './types';
import type { ApiKeyStore } from '@pignal/core/store/api-keys';

// Middleware
import { securityHeaders } from './middleware/headers';
import { sessionMiddleware } from './middleware/session';
import { csrfMiddleware } from './middleware/csrf';
import { analyticsMiddleware } from './middleware/analytics';
import { rateLimit } from '@pignal/core/middleware/rate-limit';
import { clearSessionCookie } from './lib/cookie';

// Static assets (imported as raw text)
import tailwindCSS from './static/tailwind.css';
import htmxJS from './static/htmx.min.js';
import appJS from './static/app.js';
import { logoSVG } from './lib/static-versions';
import logoPng from './static/logo.png';

// Pages
import { loginPage, loginHandler } from './pages/login';
import { dashboardPage } from './pages/dashboard';
import {
  itemsPage,
  editItemFormHandler,
  editItemHandler,
  deleteItemHandler,
  toggleArchiveHandler,
  togglePinHandler,
  vouchItemHandler,
  bulkArchiveItemsHandler,
  bulkUnarchiveItemsHandler,
  bulkVouchItemsHandler,
  bulkDeleteItemsHandler,
} from './pages/items';
import {
  itemDetailPage,
  validateHandler,
  archiveHandler,
  unarchiveHandler,
  pinHandler,
  unpinHandler,
  visibilityHandler,
} from './pages/item-detail';
import {
  typesPage,
  addTypeFormHandler,
  createTypeHandler,
  editTypeFormHandler,
  editTypeHandler,
  deleteTypeHandler,
  bulkDeleteTypesHandler,
} from './pages/types';
import {
  workspacesPage,
  addWorkspaceFormHandler,
  createWorkspaceHandler,
  editWorkspaceFormHandler,
  editWorkspaceHandler,
  toggleVisibilityHandler,
  deleteWorkspaceHandler,
  bulkDeleteWorkspacesHandler,
} from './pages/workspaces';
import { settingsPage, updateSettingHandler, batchUpdateSettingsHandler } from './pages/settings';
import {
  apiKeysPage,
  addApiKeyFormHandler,
  createApiKeyHandler,
  deleteApiKeyHandler,
  bulkRevokeApiKeysHandler,
} from './pages/api-keys';
import {
  actionsPage,
  addActionFormHandler,
  createActionHandler,
  editActionFormHandler,
  editActionHandler,
  deleteActionHandler,
  toggleActionStatusHandler,
  exportActionSubmissionsHandler,
  bulkPauseActionsHandler,
  bulkActivateActionsHandler,
  bulkDeleteActionsHandler,
} from './pages/actions';
import {
  submissionsPage,
  updateSubmissionHandler,
  deleteSubmissionHandler,
  bulkReadSubmissionsHandler,
  bulkArchiveSubmissionsHandler,
  bulkSpamSubmissionsHandler,
  bulkDeleteSubmissionsHandler,
} from './pages/submissions';
import { sourcePageFeed } from './pages/source-page';
import { itemPostPage } from './pages/item-post';
import { sharedPage } from './pages/shared';

// Lib
import { generateRobotsTxt, generateSitemap, generateSitemapIndex, generateLlmsTxt, generateLlmsFullTxt, SITEMAP_PAGE_SIZE } from './lib/geo';
import { generateAtomFeed } from './lib/rss';
import { formatDate, readingTime } from './lib/time';
import { getTemplateConfig } from '@pignal/templates';

function toItem(row: ItemWithMeta): Item {
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
    pinnedAt: row.pinnedAt,
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
  const router = new Hono<{ Bindings: WebEnv; Variables: { store: ItemStoreRpc; apiKeyStore?: ApiKeyStore; templateName: string } }>();

  // Security headers on ALL responses
  router.use('*', securityHeaders);

  // Inject store + template name into context for all routes
  router.use('*', async (c, next) => {
    c.set('store', config.getStore(c));
    c.set('templateName', config.getTemplateName(c));
    if (config.getApiKeyStore) {
      c.set('apiKeyStore', config.getApiKeyStore(c));
    }
    await next();
  });

  // Static assets (no auth, immutable cache)
  router.get('/static/tailwind.css', (c) => {
    c.header('Content-Type', 'text/css');
    c.header('Cache-Control', 'public, max-age=31536000, immutable');
    return c.body(tailwindCSS);
  });
  router.get('/static/htmx.min.js', (c) => {
    c.header('Content-Type', 'application/javascript');
    c.header('Cache-Control', 'public, max-age=31536000, immutable');
    return c.body(htmxJS);
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
  router.get('/favicon.svg', (c) => {
    c.header('Content-Type', 'image/svg+xml');
    c.header('Cache-Control', 'public, max-age=86400');
    return c.body(logoSVG);
  });
  router.get('/favicon.ico', (c) => {
    c.header('Content-Type', 'image/png');
    c.header('Cache-Control', 'public, max-age=86400');
    return c.body(logoPng);
  });
  router.get('/og-image.png', (c) => {
    c.header('Content-Type', 'image/png');
    c.header('Cache-Control', 'public, max-age=86400');
    return c.body(logoPng);
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
      const items = result.items.map(toItem);
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
    const items = result.items.map(toItem);
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
    const templateConfig = getTemplateConfig(c.get('templateName'));
    c.header('Content-Type', 'text/plain; charset=utf-8');
    c.header('Cache-Control', 'public, max-age=3600');
    return c.body(generateLlmsTxt(settings, types, result.total, sourceUrl, templateConfig.vocabulary));
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
    const templateConfig = getTemplateConfig(c.get('templateName'));
    c.header('Content-Type', 'text/plain; charset=utf-8');
    c.header('Cache-Control', 'public, max-age=3600');
    return c.body(generateLlmsFullTxt(metadata, result.total, sourceUrl, templateConfig.vocabulary));
  });

  // Analytics tracking on public pages (fire-and-forget via waitUntil)
  router.use('/', analyticsMiddleware);
  router.use('/item/:slug', analyticsMiddleware);

  // Public source page at root (no auth, no CSRF, no HTMX -- pure SSR for crawlability)
  router.get('/', sourcePageFeed);

  router.get('/feed.xml', async (c) => {
    const store = c.get('store');
    const sourceUrl = new URL(c.req.url).origin;
    const [settings, result] = await Promise.all([
      store.getSettings(),
      store.listPublic({ limit: 50 }),
    ]);
    const items = result.items.map(toItem);
    const templateConfig = getTemplateConfig(c.get('templateName'));
    c.header('Content-Type', 'application/atom+xml; charset=utf-8');
    c.header('Cache-Control', 'public, max-age=3600');
    return c.body(generateAtomFeed(settings, items, sourceUrl, templateConfig.vocabulary));
  });
  // Source post: serves HTML or raw markdown based on .md suffix
  router.get('/item/:slug', async (c) => {
    const slugParam = c.req.param('slug') ?? '';

    // Raw markdown endpoint: /item/:slug.md
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

      const item = toItem(row);
      const domain = new URL(c.req.url).hostname;
      const sourceAuthor = settings.owner_name || settings.source_title || domain;
      const githubUrl = settings.source_social_github || '';
      const authorMd = githubUrl ? `[${sourceAuthor}](${githubUrl})` : sourceAuthor;

      // Build metadata line: "March 10, 2026 · 1 min read"
      const date = formatDate(item.vouchedAt || item.createdAt);
      const reading = readingTime(item.content);
      const metaParts: string[] = [date, reading];

      // Validation badge: "Accurate by [author](github)"
      if (item.validationActionLabel) {
        metaParts.push(`${item.validationActionLabel} by ${authorMd}`);
      }

      // AI source: "AI-assisted via Claude"
      if (item.sourceAi) {
        const aiName = item.sourceAi === 'mcp-self-hosted'
          ? 'MCP'
          : item.sourceAi.includes(':')
            ? item.sourceAi.split(':')[1]
            : item.sourceAi;
        if (aiName) metaParts.push(`AI-assisted via ${aiName}`);
      }

      const metaLine = `*${metaParts.join(' · ')}*`;

      // Tags footer
      const tagsLine = item.tags && item.tags.length > 0
        ? `\n\n---\n\n${item.tags.map((t) => `#${t}`).join(' ')}`
        : '';

      c.header('Content-Type', 'text/markdown; charset=utf-8');
      c.header('Cache-Control', 'public, max-age=60');
      return c.body(`# ${item.keySummary}\n\n${metaLine}\n\n---\n\n${item.content}${tagsLine}`);
    }

    // HTML source post
    return itemPostPage(c);
  });
  router.get('/s/:token', sharedPage);

  // Admin login (no session required, but CSRF-protected + rate-limited)
  // GET: csrfMiddleware sets the initial CSRF cookie for the form
  // POST: CSRF validated manually in loginHandler (not via middleware, to avoid
  //       the middleware's post-next() hook overwriting the regenerated CSRF cookie)
  router.get('/pignal/login', csrfMiddleware, loginPage);
  router.post('/pignal/login', rateLimit('login'), loginHandler);

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
  router.get('/pignal/items', itemsPage);

  // Item bulk actions (must be before :id routes to avoid matching "bulk" as :id)
  router.post('/pignal/items/bulk/archive', bulkArchiveItemsHandler);
  router.post('/pignal/items/bulk/unarchive', bulkUnarchiveItemsHandler);
  router.post('/pignal/items/bulk/vouch', bulkVouchItemsHandler);
  router.post('/pignal/items/bulk/delete', bulkDeleteItemsHandler);

  // Item detail + actions
  router.get('/pignal/items/:id', itemDetailPage);
  router.get('/pignal/items/:id/edit-form', editItemFormHandler);
  router.post('/pignal/items/:id/edit', editItemHandler);
  router.post('/pignal/items/:id/delete', deleteItemHandler);
  router.post('/pignal/items/:id/toggle-archive', toggleArchiveHandler);
  router.post('/pignal/items/:id/toggle-pin', togglePinHandler);
  router.post('/pignal/items/:id/vouch', vouchItemHandler);
  router.post('/pignal/items/:id/validate', validateHandler);
  router.post('/pignal/items/:id/archive', archiveHandler);
  router.post('/pignal/items/:id/unarchive', unarchiveHandler);
  router.post('/pignal/items/:id/pin', pinHandler);
  router.post('/pignal/items/:id/unpin', unpinHandler);
  router.post('/pignal/items/:id/visibility', visibilityHandler);

  // Types CRUD
  router.get('/pignal/types', typesPage);
  router.get('/pignal/types/add-form', addTypeFormHandler);
  router.post('/pignal/types', createTypeHandler);
  router.post('/pignal/types/bulk/delete', bulkDeleteTypesHandler);
  router.get('/pignal/types/:id/edit-form', editTypeFormHandler);
  router.post('/pignal/types/:id/edit', editTypeHandler);
  router.post('/pignal/types/:id/delete', deleteTypeHandler);

  // Workspaces CRUD
  router.get('/pignal/workspaces', workspacesPage);
  router.get('/pignal/workspaces/add-form', addWorkspaceFormHandler);
  router.post('/pignal/workspaces', createWorkspaceHandler);
  router.post('/pignal/workspaces/bulk/delete', bulkDeleteWorkspacesHandler);
  router.get('/pignal/workspaces/:id/edit-form', editWorkspaceFormHandler);
  router.post('/pignal/workspaces/:id/edit', editWorkspaceHandler);
  router.post('/pignal/workspaces/:id/toggle-visibility', toggleVisibilityHandler);
  router.post('/pignal/workspaces/:id/delete', deleteWorkspaceHandler);

  // Settings
  router.get('/pignal/settings', settingsPage);
  router.post('/pignal/settings/batch', batchUpdateSettingsHandler);
  router.post('/pignal/settings/:key', updateSettingHandler);

  // API Keys
  router.get('/pignal/api-keys', apiKeysPage);
  router.get('/pignal/api-keys/add-form', addApiKeyFormHandler);
  router.post('/pignal/api-keys', createApiKeyHandler);
  router.post('/pignal/api-keys/bulk-revoke', bulkRevokeApiKeysHandler);
  router.post('/pignal/api-keys/:id/delete', deleteApiKeyHandler);

  // Site Actions
  router.get('/pignal/actions', actionsPage);
  router.get('/pignal/actions/add-form', addActionFormHandler);
  router.post('/pignal/actions', createActionHandler);
  router.post('/pignal/actions/bulk-pause', bulkPauseActionsHandler);
  router.post('/pignal/actions/bulk-activate', bulkActivateActionsHandler);
  router.post('/pignal/actions/bulk-delete', bulkDeleteActionsHandler);
  router.get('/pignal/actions/:id/edit-form', editActionFormHandler);
  router.post('/pignal/actions/:id/update', editActionHandler);
  router.post('/pignal/actions/:id/delete', deleteActionHandler);
  router.post('/pignal/actions/:id/toggle-status', toggleActionStatusHandler);
  router.get('/pignal/actions/:id/export', exportActionSubmissionsHandler);

  // Submissions
  router.get('/pignal/submissions', submissionsPage);
  router.post('/pignal/submissions/bulk-read', bulkReadSubmissionsHandler);
  router.post('/pignal/submissions/bulk-archive', bulkArchiveSubmissionsHandler);
  router.post('/pignal/submissions/bulk-spam', bulkSpamSubmissionsHandler);
  router.post('/pignal/submissions/bulk-delete', bulkDeleteSubmissionsHandler);
  router.post('/pignal/submissions/:id/status', updateSubmissionHandler);
  router.post('/pignal/submissions/:id/delete', deleteSubmissionHandler);

  return router;
}

export type { WebEnv, WebRouteConfig } from './types';
