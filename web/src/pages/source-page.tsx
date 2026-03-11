import type { Context } from 'hono';
import type { Signal } from '@pignal/core';
import type { SignalWithMeta, SignalStoreRpc } from '@pignal/db';
import type { WebEnv } from '../types';
import { PublicLayout } from '../components/public-layout';
import { TypeBadge } from '../components/type-badge';
import { FilterBar } from '../components/type-sidebar';
import { Pagination } from '../components/pagination';
import { JsonLd } from '../components/json-ld';
import { buildSourceJsonLd, buildMetaTags, escapeHtmlAttr } from '../lib/seo';
import { formatDate, readingTime } from '../lib/time';
import { stripMarkdown } from '../lib/markdown';

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
  const settings = await store.getSettings();
  const sourceUrl = new URL(c.req.url).origin;
  const sourceTitle = settings.source_title || 'My Signals';
  const sourceDescription = settings.source_description || 'Insights captured from AI conversations';
  const showReadingTime = settings.source_show_reading_time !== 'false';
  const cardStyle = settings.source_card_style;

  const postsPerPage = parseInt(settings.source_posts_per_page || '20', 10) || 20;
  const limit = Math.min(parseInt(c.req.query('limit') ?? String(postsPerPage), 10) || postsPerPage, 100);
  const offset = parseInt(c.req.query('offset') ?? '0', 10) || 0;
  const typeId = c.req.query('type') || undefined;
  const workspaceId = c.req.query('workspace') || undefined;
  const tag = c.req.query('tag') || undefined;
  const filterMode = c.req.query('mode') === 'workspaces' || workspaceId ? 'workspaces' : 'categories';
  const sort = c.req.query('sort') === 'oldest' ? 'oldest' as const : 'newest' as const;

  const [result, types, allWorkspaces] = await Promise.all([
    store.listPublic({ typeId, workspaceId, tag, limit, offset, sort }),
    store.listTypes(),
    store.listWorkspaces(),
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

  const jsonLd = buildSourceJsonLd(settings, sourceUrl);
  const metaTags = buildMetaTags({
    title: pageTitle,
    description: sourceDescription,
    canonicalUrl: sourceUrl || '/',
    ogType: 'website',
    feedUrl: `${sourceUrl}/feed.xml`,
  });

  // Build filter query string for pagination/rel links
  const filterParams = new URLSearchParams();
  if (typeId) filterParams.set('type', typeId);
  if (workspaceId) filterParams.set('workspace', workspaceId);
  if (tag) filterParams.set('tag', tag);
  if (filterMode === 'workspaces' && !workspaceId) filterParams.set('mode', 'workspaces');
  if (sort === 'oldest') filterParams.set('sort', 'oldest');
  const filterQs = filterParams.toString();

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
  const paginationBase = filterQs ? `/?${filterQs}` : '/';

  c.header('Cache-Control', 'public, max-age=60');

  return c.html(
    <PublicLayout title={sourceTitle} head={headContent} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings}>
      <JsonLd data={jsonLd} />

      <div class={`source-page source-page--feed${cardStyle === 'grid' ? ' source-page--grid-cards' : ''}`}>
        <FilterBar types={types} activeTypeId={typeId} workspaces={publicWorkspaces} activeWorkspaceId={workspaceId} activeTag={tag} mode={filterMode} sort={sort} />

        <div id="source-loading" class="source-loading" hidden>
          <span class="app-spinner" />
        </div>
        <div id="source-main" class="source-main">
          {items.length === 0 ? (
            <p class="empty-state">
              {typeId || workspaceId || tag ? 'No vouched signals matching this filter.' : 'No vouched signals yet.'}
            </p>
          ) : (
            items.map((item) => (
              <article class="source-card">
                <div class="source-card-header">
                  <TypeBadge typeName={item.typeName} />
                  {item.workspaceName && (
                    <a href={`/?workspace=${item.workspaceId}`} class="workspace-badge">{item.workspaceName}</a>
                  )}
                  <time datetime={item.vouchedAt || item.createdAt}>
                    {formatDate(item.vouchedAt || item.createdAt)}
                  </time>
                  {item.validationActionLabel && (
                    <span class="validation-badge">{item.validationActionLabel}</span>
                  )}
                </div>
                <h2><a href={`/signal/${item.slug}`}>{item.keySummary}</a></h2>
                <p class="source-card-preview">
                  {stripMarkdown(item.content).slice(0, 200)}{item.content.length > 200 ? '...' : ''}
                </p>
                {item.tags && item.tags.length > 0 && (
                  <div class="signal-tags">
                    {item.tags.map((t) => (
                      <a href={`/?tag=${encodeURIComponent(t)}`} class="signal-tag">#{t}</a>
                    ))}
                  </div>
                )}
                <div class="source-card-footer">
                  {showReadingTime && <span>{readingTime(item.content)}</span>}
                  <a href={`/signal/${item.slug}`}>Read more &rarr;</a>
                </div>
              </article>
            ))
          )}

          <Pagination
            total={result.total}
            limit={limit}
            offset={offset}
            baseUrl={paginationBase}
          />
        </div>
      </div>
    </PublicLayout>
  );
}
