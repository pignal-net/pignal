import type { SourcePageProps } from '@pignal/templates';
import { Pagination } from '../../components/pagination';
import { JsonLd } from '../../components/json-ld';
import { EmptyState } from '../../components/empty-state';
import { buildSourceJsonLd, buildMetaTags, escapeHtmlAttr, resolveOgImage } from '../../lib/seo';
import { ShopLayout } from './layout';
import { ShopCard } from './shop-card';

/* HTMX constants -- every interactive filter element must use these */
const HX_TARGET = '#source-results';
const HX_INDICATOR = '#source-loading';
const HX_SWAP = 'innerHTML';

function buildFilterUrl(params: Record<string, string | undefined>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) qs.set(k, v);
  }
  const s = qs.toString();
  return s ? `/?${s}` : '/';
}

/** Shared HTMX props for all filter/sort/tag links */
function hxProps(url: string) {
  return {
    'hx-get': url,
    'hx-target': HX_TARGET,
    'hx-swap': HX_SWAP,
    'hx-push-url': 'true',
    'hx-indicator': HX_INDICATOR,
  };
}

export function ShopSourcePage(props: SourcePageProps) {
  const {
    items,
    types,
    workspaces,
    counts,
    settings,
    filters,
    pagination,
    paginationBase,
    sourceUrl,
    vocabulary,
    t,
  } = props;

  const sourceTitle = settings.source_title || `My ${vocabulary.itemPlural.charAt(0).toUpperCase() + vocabulary.itemPlural.slice(1)}`;
  const sourceDescription = settings.source_description || `Browse our ${vocabulary.workspacePlural}`;

  const activeType = filters.typeId ? types.find((t) => t.id === filters.typeId) : undefined;
  const activeWorkspace = filters.workspaceId ? workspaces.find((w) => w.id === filters.workspaceId) : undefined;

  let pageTitle = sourceTitle;
  if (activeType) pageTitle = `${activeType.name} | ${sourceTitle}`;
  else if (activeWorkspace) pageTitle = `${activeWorkspace.name} | ${sourceTitle}`;
  else if (filters.tag) pageTitle = `#${filters.tag} | ${sourceTitle}`;

  const ogImage = resolveOgImage(settings, sourceUrl);

  const jsonLd = buildSourceJsonLd(settings, sourceUrl, props.seo);
  const metaTags = buildMetaTags({
    title: pageTitle,
    description: sourceDescription,
    canonicalUrl: sourceUrl || '/',
    ogType: 'website',
    feedUrl: `${sourceUrl}/feed.xml`,
    imageUrl: ogImage,
  });

  const filterParams = new URLSearchParams();
  if (filters.typeId) filterParams.set('type', filters.typeId);
  if (filters.workspaceId) filterParams.set('workspace', filters.workspaceId);
  if (filters.tag) filterParams.set('tag', filters.tag);
  if (filters.q) filterParams.set('q', filters.q);
  if (filters.sort === 'oldest') filterParams.set('sort', 'oldest');
  const filterQs = filterParams.toString();

  const totalPages = Math.ceil(pagination.total / pagination.limit);
  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
  let relLinks = '';
  const safeSourceUrl = escapeHtmlAttr(sourceUrl);
  const baseUrlStr = filterQs ? `${safeSourceUrl}/?${escapeHtmlAttr(filterQs)}` : `${safeSourceUrl}/`;
  const sep = filterQs ? '&amp;' : '?';
  if (currentPage > 1) {
    relLinks += `\n    <link rel="prev" href="${baseUrlStr}${sep}offset=${(currentPage - 2) * pagination.limit}">`;
  }
  if (currentPage < totalPages) {
    relLinks += `\n    <link rel="next" href="${baseUrlStr}${sep}offset=${currentPage * pagination.limit}">`;
  }

  const headContent = `${metaTags}${relLinks}`;
  const sortParam = filters.sort === 'oldest' ? 'oldest' : undefined;

  // Build hx-vals for search input: preserves current filter state
  const hxValsObj: Record<string, string> = {};
  if (filters.sort === 'oldest') hxValsObj.sort = 'oldest';
  if (filters.typeId) hxValsObj.type = filters.typeId;
  if (filters.workspaceId) hxValsObj.workspace = filters.workspaceId;
  if (filters.tag) hxValsObj.tag = filters.tag;
  const hxVals = JSON.stringify(hxValsObj);

  // Filter types/workspaces that have items
  const typesWithItems = types.filter((t) => (counts.byType[t.id] ?? 0) > 0);
  const workspacesWithItems = workspaces.filter((w) => (counts.byWorkspace[w.id] ?? 0) > 0);

  // Pre-build URLs for sort tabs
  const newestUrl = buildFilterUrl({ type: filters.typeId, workspace: filters.workspaceId, tag: filters.tag, q: filters.q });
  const oldestUrl = buildFilterUrl({ type: filters.typeId, workspace: filters.workspaceId, tag: filters.tag, q: filters.q, sort: 'oldest' });

  return (
    <ShopLayout title={sourceTitle} head={headContent} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings}>
      <JsonLd data={jsonLd} />

      <div class="max-w-7xl mx-auto px-4 pt-8 pb-16 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8 items-start">
        {/* Sidebar: categories + collections */}
        <aside class="lg:sticky lg:top-6 text-sm max-lg:flex max-lg:gap-4 max-lg:flex-wrap max-lg:border-b max-lg:border-border-subtle max-lg:pb-4 lg:bg-surface lg:rounded-xl lg:border lg:border-border-subtle lg:shadow-card lg:p-4">
          {/* Search -- HTMX partial swap on input */}
          <div class="mb-4 max-lg:w-full">
            <input
              type="text"
              name="q"
              placeholder={`Search ${vocabulary.itemPlural}...`}
              value={filters.q || ''}
              class="w-full m-0 h-9 text-sm px-3 py-1 rounded-lg border border-border bg-surface text-text"
              hx-get="/"
              hx-target={HX_TARGET}
              hx-swap={HX_SWAP}
              hx-trigger="input changed delay:300ms, keyup[key=='Enter']"
              hx-push-url="true"
              hx-indicator={HX_INDICATOR}
              hx-vals={hxVals}
            />
          </div>

          {/* Categories (types) */}
          {typesWithItems.length > 0 && (
            <div class="mb-6 max-lg:mb-0">
              <div class="text-[0.7rem] font-bold uppercase tracking-wider text-muted mb-2">{vocabulary.typePlural}</div>
              <ul class="list-none p-0 m-0 max-lg:flex max-lg:gap-1 max-lg:flex-wrap">
                <li>
                  {(() => {
                    const url = buildFilterUrl({ workspace: filters.workspaceId, q: filters.q, sort: sortParam });
                    return (
                      <a href={url} class={`flex justify-between items-center px-2.5 py-1.5 rounded-lg no-underline text-sm transition-colors ${!filters.typeId ? 'bg-primary/10 text-primary font-semibold' : 'text-text hover:bg-primary/5 hover:text-primary'}`} {...hxProps(url)}>
                        <span>All</span>
                        <span class={`text-xs min-w-[1.2em] text-right ${!filters.typeId ? 'text-primary/60' : 'text-muted'}`}>{counts.total}</span>
                      </a>
                    );
                  })()}
                </li>
                {typesWithItems.map((type) => {
                  const url = buildFilterUrl({ type: type.id, workspace: filters.workspaceId, q: filters.q, sort: sortParam });
                  return (
                    <li>
                      <a href={url} class={`flex justify-between items-center px-2.5 py-1.5 rounded-lg no-underline text-sm transition-colors ${filters.typeId === type.id ? 'bg-primary/10 text-primary font-semibold' : 'text-text hover:bg-primary/5 hover:text-primary'}`} {...hxProps(url)}>
                        <span>{type.icon ? `${type.icon} ` : ''}{type.name}</span>
                        <span class={`text-xs min-w-[1.2em] text-right ${filters.typeId === type.id ? 'text-primary/60' : 'text-muted'}`}>{counts.byType[type.id] ?? 0}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Collections (workspaces) */}
          {workspacesWithItems.length > 0 && (
            <div class="mb-6 max-lg:mb-0">
              <div class="text-[0.7rem] font-bold uppercase tracking-wider text-muted mb-2">{vocabulary.workspacePlural}</div>
              <ul class="list-none p-0 m-0 max-lg:flex max-lg:gap-1 max-lg:flex-wrap">
                {workspacesWithItems.map((ws) => {
                  const url = buildFilterUrl({ workspace: filters.workspaceId === ws.id ? undefined : ws.id, type: filters.typeId, q: filters.q, sort: sortParam });
                  return (
                    <li>
                      <a href={url} class={`flex justify-between items-center px-2.5 py-1.5 rounded-lg no-underline text-sm transition-colors ${filters.workspaceId === ws.id ? 'bg-primary/10 text-primary font-semibold' : 'text-text hover:bg-primary/5 hover:text-primary'}`} {...hxProps(url)}>
                        <span>{ws.name}</span>
                        <span class={`text-xs min-w-[1.2em] text-right ${filters.workspaceId === ws.id ? 'text-primary/60' : 'text-muted'}`}>{counts.byWorkspace[ws.id] ?? 0}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </aside>

        {/* Main content area */}
        <div>
          {/* Active tag filter */}
          {filters.tag && (
            <div class="mb-3">
              {(() => {
                const url = buildFilterUrl({ type: filters.typeId, workspace: filters.workspaceId, q: filters.q, sort: sortParam });
                return (
                  <a href={url} title="Clear tag filter" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium no-underline bg-primary text-primary-inverse" {...hxProps(url)}>
                    #{filters.tag} &times;
                  </a>
                );
              })()}
            </div>
          )}

          {/* Header bar */}
          <div class="flex items-center justify-between mb-4 pb-3 border-b border-border-subtle">
            <span class="text-sm text-muted">
              {pagination.total} {pagination.total === 1 ? vocabulary.item : vocabulary.itemPlural}
              {activeType && <> in {activeType.name}</>}
              {activeWorkspace && <> in {activeWorkspace.name}</>}
            </span>
            <div class="flex">
              <a href={newestUrl} class={`text-[0.82rem] px-3 py-1 no-underline transition-colors ${filters.sort === 'newest' ? 'text-primary font-semibold' : 'text-muted hover:text-text'}`} {...hxProps(newestUrl)}>
                Newest
              </a>
              <a href={oldestUrl} class={`text-[0.82rem] px-3 py-1 no-underline transition-colors ${filters.sort === 'oldest' ? 'text-primary font-semibold' : 'text-muted hover:text-text'}`} {...hxProps(oldestUrl)}>
                Oldest
              </a>
            </div>
          </div>

          <div id="source-loading" class="source-loading htmx-indicator">
            <span class="app-spinner" />
          </div>
          <div id="source-results">
            {items.length === 0 ? (
              <EmptyState
                icon="search"
                title={`No ${vocabulary.itemPlural} found`}
                description="Try adjusting your filters or search terms."
              />
            ) : (
              <>
                <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {items.map((item) => (
                    <ShopCard item={item} vocabulary={vocabulary} />
                  ))}
                </div>
                <Pagination
                  total={pagination.total}
                  limit={pagination.limit}
                  offset={pagination.offset}
                  baseUrl={paginationBase}
                  htmxTarget={HX_TARGET}
                  t={t}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </ShopLayout>
  );
}
