import type { Context } from 'hono';
import type { Signal } from '@pignal/core';
import type { SignalWithMeta, SignalStoreRpc } from '@pignal/db';
import type { WebEnv } from '../types';
import { PublicLayout } from '../components/public-layout';
import { FilterBar } from '../components/type-sidebar';
import { FeedResults } from '../components/signal-feed';
import { JsonLd } from '../components/json-ld';
import { buildSourceJsonLd, buildMetaTags, escapeHtmlAttr } from '../lib/seo';
import { isHtmxRequest } from '../lib/htmx';

type WebVars = { store: SignalStoreRpc };

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

export async function sourcePageFeed(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const store = c.get('store');
  const isHtmx = isHtmxRequest(c);

  // Vary on HX-Request so browser caches full page and HTMX partial separately
  c.header('Vary', 'HX-Request');

  const settings = await store.getSettings();
  const showReadingTime = settings.source_show_reading_time !== 'false';
  const cardStyle = settings.source_card_style;

  const postsPerPage = parseInt(settings.source_posts_per_page || '20', 10) || 20;
  const limit = Math.min(parseInt(c.req.query('limit') ?? String(postsPerPage), 10) || postsPerPage, 100);
  const offset = parseInt(c.req.query('offset') ?? '0', 10) || 0;
  const typeId = c.req.query('type') || undefined;
  const workspaceId = c.req.query('workspace') || undefined;
  const tag = c.req.query('tag') || undefined;
  const q = c.req.query('q') || undefined;
  const filterMode = c.req.query('mode') === 'categories' || typeId ? 'categories' : 'workspaces';
  const sort = c.req.query('sort') === 'oldest' ? 'oldest' as const : 'newest' as const;

  // Build filter query string for pagination
  const filterParams = new URLSearchParams();
  if (typeId) filterParams.set('type', typeId);
  if (workspaceId) filterParams.set('workspace', workspaceId);
  if (tag) filterParams.set('tag', tag);
  if (q) filterParams.set('q', q);
  if (filterMode === 'categories' && !typeId) filterParams.set('mode', 'categories');
  if (sort === 'oldest') filterParams.set('sort', 'oldest');
  const filterQs = filterParams.toString();
  const paginationBase = filterQs ? `/?${filterQs}` : '/';

  // HTMX partial: return only results
  if (isHtmx) {
    const result = await store.listPublic({ typeId, workspaceId, tag, q, limit, offset, sort });
    const items = result.items.map(toSignal);

    return c.html(
      <FeedResults
        items={items}
        total={result.total}
        limit={limit}
        offset={offset}
        paginationBase={paginationBase}
        sort={sort}
        basePath="/signal"
        tagBasePath="/"
        showReadingTime={showReadingTime}
        emptyMessage="No vouched signals matching this filter."
      />
    );
  }

  // Full page render
  const sourceUrl = new URL(c.req.url).origin;
  const sourceTitle = settings.source_title || 'My Signals';
  const sourceDescription = settings.source_description || 'Insights captured from AI conversations';

  const [result, types, allWorkspaces, counts] = await Promise.all([
    store.listPublic({ typeId, workspaceId, tag, q, limit, offset, sort }),
    store.listTypes(),
    store.listWorkspaces(),
    store.listPublicCounts({ tag, q }),
  ]);
  const items = result.items.map(toSignal);
  const publicWorkspaces = allWorkspaces.filter((w) => w.visibility === 'public');

  const activeType = typeId ? types.find((t) => t.id === typeId) : undefined;
  const activeWorkspace = workspaceId ? publicWorkspaces.find((w) => w.id === workspaceId) : undefined;

  // Build page title
  let pageTitle = sourceTitle;
  if (activeType) pageTitle = `${activeType.name} | ${sourceTitle}`;
  else if (activeWorkspace) pageTitle = `${activeWorkspace.name} | ${sourceTitle}`;
  else if (tag) pageTitle = `#${tag} | ${sourceTitle}`;

  // Derive OG image: prefer GitHub avatar (direct URL, no redirect), fall back to branded PNG
  const githubUrl = settings.source_social_github || '';
  const githubUsername = githubUrl.replace(/\/$/, '').split('/').pop() || '';
  const ogImage = githubUsername
    ? `https://avatars.githubusercontent.com/${githubUsername}?s=400`
    : `${sourceUrl}/og-image.png`;

  const jsonLd = buildSourceJsonLd(settings, sourceUrl);
  const metaTags = buildMetaTags({
    title: pageTitle,
    description: sourceDescription,
    canonicalUrl: sourceUrl || '/',
    ogType: 'website',
    feedUrl: `${sourceUrl}/feed.xml`,
    imageUrl: ogImage,
  });

  const totalPages = Math.ceil(result.total / limit);
  const currentPage = Math.floor(offset / limit) + 1;
  let relLinks = '';
  const safeSourceUrl = escapeHtmlAttr(sourceUrl);
  const baseUrl = filterQs ? `${safeSourceUrl}/?${escapeHtmlAttr(filterQs)}` : `${safeSourceUrl}/`;
  const sep = filterQs ? '&amp;' : '?';
  if (currentPage > 1) {
    relLinks += `\n    <link rel="prev" href="${baseUrl}${sep}offset=${(currentPage - 2) * limit}">`;
  }
  if (currentPage < totalPages) {
    relLinks += `\n    <link rel="next" href="${baseUrl}${sep}offset=${currentPage * limit}">`;
  }

  const headContent = `${metaTags}${relLinks}`;

  c.header('Cache-Control', 'public, max-age=60');

  return c.html(
    <PublicLayout title={sourceTitle} head={headContent} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings}>
      <JsonLd data={jsonLd} />

      <div class={`source-page source-page--feed${cardStyle === 'grid' ? ' source-page--grid-cards' : ''}`}>
        <FilterBar types={types} activeTypeId={typeId} workspaces={publicWorkspaces} activeWorkspaceId={workspaceId} activeTag={tag} mode={filterMode} sort={sort} counts={counts} query={q} />

        <div id="source-loading" class="source-loading htmx-indicator">
          <span class="app-spinner" />
        </div>
        <div id="source-results">
          <FeedResults
            items={items}
            total={result.total}
            limit={limit}
            offset={offset}
            paginationBase={paginationBase}
            sort={sort}
            basePath="/signal"
            tagBasePath="/"
            showReadingTime={showReadingTime}
            emptyMessage="No vouched signals matching this filter."
          />
        </div>
      </div>
    </PublicLayout>
  );
}
