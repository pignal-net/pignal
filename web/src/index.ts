import { Hono } from 'hono';
import { languageDetector } from 'hono/language';
import { trimTrailingSlash } from 'hono/trailing-slash';
import type { Item } from '@pignal/core';
import type { ItemWithMeta } from '@pignal/db';

import type { WebEnv, WebRouteConfig, WebVars } from './types';

// i18n — registers shared translations at import time
import '@pignal/render/i18n';
import { SUPPORTED_LOCALES } from '@pignal/render/i18n/types';

// Middleware
import { securityHeaders } from './middleware/headers';
import { i18nMiddleware } from './middleware/locale';
import { sessionMiddleware } from './middleware/session';
import { csrfMiddleware } from './middleware/csrf';
import { analyticsMiddleware } from './middleware/analytics';
import { visitorMiddleware } from './middleware/visitor';
import { rateLimit } from '@pignal/core/middleware/rate-limit';
import { clearSessionCookie } from './lib/cookie';

// Static assets (imported as raw text)
import tailwindCSS from '@pignal/render/static/tailwind.css';
import htmxJS from '@pignal/render/static/htmx.min.js';
import appJS from '@pignal/render/static/app.js';
import { logoSVG } from '@pignal/render/lib/static-versions';
import logoPng from '@pignal/render/static/logo.png';

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
import { generateRobotsTxt, generateSitemap, generateSitemapIndex, generateLlmsTxt, generateLlmsFullTxt, SITEMAP_PAGE_SIZE } from '@pignal/render/lib/geo';
import { generateAtomFeed } from '@pignal/render/lib/rss';
import { formatDate, readingTime } from '@pignal/render/lib/time';
import { resolvedConfig } from '@pignal/templates/resolved';

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
  const router = new Hono<{ Bindings: WebEnv; Variables: WebVars }>();

  // Normalize trailing slashes (redirects /vi/ → /vi) — must run before route matching
  router.use(trimTrailingSlash());

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

  // Visitor authentication (hub SSO — managed sites only)
  // Must run before sessionMiddleware so c.get('visitor') is available for admin role check
  router.use('*', visitorMiddleware);

  // Language detection: path > query > cookie > Accept-Language header
  router.use('*', languageDetector({
    supportedLanguages: [...SUPPORTED_LOCALES],
    fallbackLanguage: 'en',
    order: ['path', 'querystring', 'cookie', 'header'],
    lookupFromPathIndex: 0,
    lookupQueryString: 'lang',
    lookupCookie: 'language',
    caches: ['cookie'],
    cookieOptions: {
      sameSite: 'Lax',
      secure: true,
      maxAge: 365 * 24 * 60 * 60,
      httpOnly: true,
    },
  }));

  // i18n context: resolves locale, creates t(), registers template translations
  router.use('*', i18nMiddleware);

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

  // Visitor sign-out — clears SSO cookies locally (hub session stays intact)
  router.get('/visitor-logout', (c) => {
    c.header('Set-Cookie', 'pignal_visitor=; HttpOnly; Secure; SameSite=Lax; Domain=.pignal.net; Path=/; Max-Age=0', { append: true });
    c.header('Set-Cookie', 'pignal_site=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0', { append: true });
    const returnTo = c.req.query('return_to') || '/';
    return c.redirect(returnTo);
  });

  router.get('/llms.txt', async (c) => {
    const store = c.get('store');
    const sourceUrl = new URL(c.req.url).origin;
    const [settings, types, result] = await Promise.all([
      store.getSettings(),
      store.listTypes(),
      store.listPublic({ limit: 1, offset: 0 }),
    ]);
    const templateConfig = resolvedConfig;
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
    const templateConfig = resolvedConfig;
    c.header('Content-Type', 'text/plain; charset=utf-8');
    c.header('Cache-Control', 'public, max-age=3600');
    return c.body(generateLlmsFullTxt(metadata, result.total, sourceUrl, templateConfig.vocabulary));
  });

  // ── Locale-aware content & admin routes ──
  // Extracted into a sub-app so it can be mounted at both / and /:locale/
  const contentRoutes = new Hono<{ Bindings: WebEnv; Variables: WebVars }>();

  // Analytics tracking on public pages (fire-and-forget via waitUntil)
  contentRoutes.use('/', analyticsMiddleware);
  contentRoutes.use('/item/:slug', analyticsMiddleware);

  // Public source page at root (no auth, no CSRF, no HTMX -- pure SSR for crawlability)
  contentRoutes.get('/', sourcePageFeed);

  contentRoutes.get('/feed.xml', async (c) => {
    const store = c.get('store');
    const sourceUrl = new URL(c.req.url).origin;
    const [settings, result] = await Promise.all([
      store.getSettings(),
      store.listPublic({ limit: 50 }),
    ]);
    const items = result.items.map(toItem);
    const templateConfig = resolvedConfig;
    c.header('Content-Type', 'application/atom+xml; charset=utf-8');
    c.header('Cache-Control', 'public, max-age=3600');
    return c.body(generateAtomFeed(settings, items, sourceUrl, templateConfig.vocabulary));
  });
  // Source post: serves HTML or raw markdown based on .md suffix
  contentRoutes.get('/item/:slug', async (c) => {
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
  contentRoutes.get('/s/:token', sharedPage);

  // Admin login (no session required, but CSRF-protected + rate-limited)
  // GET: csrfMiddleware sets the initial CSRF cookie for the form
  // POST: CSRF validated manually in loginHandler (not via middleware, to avoid
  //       the middleware's post-next() hook overwriting the regenerated CSRF cookie)
  contentRoutes.get('/pignal/login', csrfMiddleware, loginPage);
  contentRoutes.post('/pignal/login', rateLimit('login'), loginHandler);

  // All /pignal routes below require session + CSRF
  contentRoutes.use('/pignal/*', sessionMiddleware);
  contentRoutes.use('/pignal/*', csrfMiddleware);

  // Logout
  contentRoutes.get('/pignal/logout', (c) => {
    c.header('Set-Cookie', clearSessionCookie());
    return c.redirect('/pignal/login');
  });

  // Admin pages
  contentRoutes.get('/pignal', dashboardPage);
  contentRoutes.get('/pignal/items', itemsPage);

  // Item bulk actions (must be before :id routes to avoid matching "bulk" as :id)
  contentRoutes.post('/pignal/items/bulk/archive', bulkArchiveItemsHandler);
  contentRoutes.post('/pignal/items/bulk/unarchive', bulkUnarchiveItemsHandler);
  contentRoutes.post('/pignal/items/bulk/vouch', bulkVouchItemsHandler);
  contentRoutes.post('/pignal/items/bulk/delete', bulkDeleteItemsHandler);

  // Item detail + actions
  contentRoutes.get('/pignal/items/:id', itemDetailPage);
  contentRoutes.get('/pignal/items/:id/edit-form', editItemFormHandler);
  contentRoutes.post('/pignal/items/:id/edit', editItemHandler);
  contentRoutes.post('/pignal/items/:id/delete', deleteItemHandler);
  contentRoutes.post('/pignal/items/:id/toggle-archive', toggleArchiveHandler);
  contentRoutes.post('/pignal/items/:id/toggle-pin', togglePinHandler);
  contentRoutes.post('/pignal/items/:id/vouch', vouchItemHandler);
  contentRoutes.post('/pignal/items/:id/validate', validateHandler);
  contentRoutes.post('/pignal/items/:id/archive', archiveHandler);
  contentRoutes.post('/pignal/items/:id/unarchive', unarchiveHandler);
  contentRoutes.post('/pignal/items/:id/pin', pinHandler);
  contentRoutes.post('/pignal/items/:id/unpin', unpinHandler);
  contentRoutes.post('/pignal/items/:id/visibility', visibilityHandler);

  // Types CRUD
  contentRoutes.get('/pignal/types', typesPage);
  contentRoutes.get('/pignal/types/add-form', addTypeFormHandler);
  contentRoutes.post('/pignal/types', createTypeHandler);
  contentRoutes.post('/pignal/types/bulk/delete', bulkDeleteTypesHandler);
  contentRoutes.get('/pignal/types/:id/edit-form', editTypeFormHandler);
  contentRoutes.post('/pignal/types/:id/edit', editTypeHandler);
  contentRoutes.post('/pignal/types/:id/delete', deleteTypeHandler);

  // Workspaces CRUD
  contentRoutes.get('/pignal/workspaces', workspacesPage);
  contentRoutes.get('/pignal/workspaces/add-form', addWorkspaceFormHandler);
  contentRoutes.post('/pignal/workspaces', createWorkspaceHandler);
  contentRoutes.post('/pignal/workspaces/bulk/delete', bulkDeleteWorkspacesHandler);
  contentRoutes.get('/pignal/workspaces/:id/edit-form', editWorkspaceFormHandler);
  contentRoutes.post('/pignal/workspaces/:id/edit', editWorkspaceHandler);
  contentRoutes.post('/pignal/workspaces/:id/toggle-visibility', toggleVisibilityHandler);
  contentRoutes.post('/pignal/workspaces/:id/delete', deleteWorkspaceHandler);

  // Settings
  contentRoutes.get('/pignal/settings', settingsPage);
  contentRoutes.post('/pignal/settings/batch', batchUpdateSettingsHandler);
  contentRoutes.post('/pignal/settings/:key', updateSettingHandler);

  // API Keys
  contentRoutes.get('/pignal/api-keys', apiKeysPage);
  contentRoutes.get('/pignal/api-keys/add-form', addApiKeyFormHandler);
  contentRoutes.post('/pignal/api-keys', createApiKeyHandler);
  contentRoutes.post('/pignal/api-keys/bulk-revoke', bulkRevokeApiKeysHandler);
  contentRoutes.post('/pignal/api-keys/:id/delete', deleteApiKeyHandler);

  // Site Actions
  contentRoutes.get('/pignal/actions', actionsPage);
  contentRoutes.get('/pignal/actions/add-form', addActionFormHandler);
  contentRoutes.post('/pignal/actions', createActionHandler);
  contentRoutes.post('/pignal/actions/bulk-pause', bulkPauseActionsHandler);
  contentRoutes.post('/pignal/actions/bulk-activate', bulkActivateActionsHandler);
  contentRoutes.post('/pignal/actions/bulk-delete', bulkDeleteActionsHandler);
  contentRoutes.get('/pignal/actions/:id/edit-form', editActionFormHandler);
  contentRoutes.post('/pignal/actions/:id/update', editActionHandler);
  contentRoutes.post('/pignal/actions/:id/delete', deleteActionHandler);
  contentRoutes.post('/pignal/actions/:id/toggle-status', toggleActionStatusHandler);
  contentRoutes.get('/pignal/actions/:id/export', exportActionSubmissionsHandler);

  // Submissions
  contentRoutes.get('/pignal/submissions', submissionsPage);
  contentRoutes.post('/pignal/submissions/bulk-read', bulkReadSubmissionsHandler);
  contentRoutes.post('/pignal/submissions/bulk-archive', bulkArchiveSubmissionsHandler);
  contentRoutes.post('/pignal/submissions/bulk-spam', bulkSpamSubmissionsHandler);
  contentRoutes.post('/pignal/submissions/bulk-delete', bulkDeleteSubmissionsHandler);
  contentRoutes.post('/pignal/submissions/:id/status', updateSubmissionHandler);
  contentRoutes.post('/pignal/submissions/:id/delete', deleteSubmissionHandler);

  // Mount content routes at root (default locale, no prefix)
  router.route('/', contentRoutes);

  // Mount content routes at each locale prefix (e.g., /vi/..., /zh/...)
  for (const locale of SUPPORTED_LOCALES) {
    router.route(`/${locale}`, contentRoutes);
  }

  return router;
}

export type { WebEnv, WebRouteConfig, WebVars } from './types';
