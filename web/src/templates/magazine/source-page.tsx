import type { SourcePageProps, Item } from '@pignal/templates';
import { FilterBar } from '../../components/type-sidebar';
import { Pagination } from '../../components/pagination';
import { EmptyState } from '../../components/empty-state';
import { JsonLd } from '../../components/json-ld';
import { buildSourceJsonLd, buildMetaTags, escapeHtmlAttr, resolveOgImage } from '../../lib/seo';
import { stripMarkdown } from '../../lib/markdown';
import { relativeTime, readingTime } from '../../lib/time';
import { MagazineLayout } from './layout';

const HX_TARGET = '#source-results';
const HX_INDICATOR = '#source-loading';

function hxProps(url: string) {
  return {
    'hx-get': url,
    'hx-target': HX_TARGET,
    'hx-swap': 'innerHTML',
    'hx-push-url': 'true',
    'hx-indicator': HX_INDICATOR,
  };
}

function buildFilterUrl(params: Record<string, string | undefined>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) qs.set(k, v);
  }
  const s = qs.toString();
  return s ? `/?${s}` : '/';
}

function MagazineHeroCard({ item }: { item: Item }) {
  const excerpt = stripMarkdown(item.content).slice(0, 220);
  const dateStr = item.vouchedAt || item.createdAt;
  const itemUrl = `/item/${item.slug}`;

  return (
    <div class="relative bg-surface rounded-2xl border border-border-subtle shadow-card overflow-hidden mb-8 card-hover">
      <div class="w-full h-56 sm:h-72 bg-gradient-to-br from-primary/10 to-primary/25 flex items-center justify-center">
        <span class="inline-block px-5 py-2 rounded-full text-base font-semibold uppercase tracking-wide text-primary-inverse bg-primary no-underline">{item.typeName}</span>
      </div>
      <div class="p-6 sm:px-8 sm:pb-8">
        <h2 class="m-0 mb-3 text-[clamp(1.25rem,3vw+0.5rem,1.75rem)] leading-tight tracking-tight">
          <a href={itemUrl} class="no-underline text-text hover:text-primary" {...hxProps(itemUrl)}>{item.keySummary}</a>
        </h2>
        {excerpt && <p class="text-base text-muted leading-relaxed m-0 mb-4 line-clamp-3">{excerpt}</p>}
        <div class="flex items-center gap-3 flex-wrap text-sm text-muted">
          <span class="whitespace-nowrap">{relativeTime(dateStr)}</span>
          <span class="opacity-40">/</span>
          <span class="whitespace-nowrap">{readingTime(item.content)}</span>
          {item.workspaceName && (
            <>
              <span class="opacity-40">/</span>
              <a href={`/?workspace=${item.workspaceId}`} class="text-muted hover:text-primary no-underline" {...hxProps(`/?workspace=${item.workspaceId}`)}>{item.workspaceName}</a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MagazineCard({ item }: { item: Item }) {
  const excerpt = stripMarkdown(item.content).slice(0, 140);
  const dateStr = item.vouchedAt || item.createdAt;
  const itemUrl = `/item/${item.slug}`;
  const typeUrl = `/?type=${item.typeId}`;

  return (
    <div class="bg-surface rounded-xl border border-border-subtle shadow-card overflow-hidden flex flex-col card-hover">
      <div class="w-full h-28 bg-gradient-to-br from-primary/10 to-primary/25 flex items-center justify-start pl-4">
        <a href={typeUrl} class="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide text-primary-inverse bg-primary no-underline hover:opacity-90" {...hxProps(typeUrl)}>{item.typeName}</a>
      </div>
      <div class="p-4 flex-1 flex flex-col">
        <h3 class="m-0 mb-2 text-base leading-snug font-semibold">
          <a href={itemUrl} class="no-underline text-text hover:text-primary" {...hxProps(itemUrl)}>{item.keySummary}</a>
        </h3>
        {excerpt && <p class="text-sm text-muted m-0 mb-3 leading-relaxed line-clamp-2 flex-1">{excerpt}</p>}
        <div class="flex items-center gap-2 flex-wrap text-xs text-muted mt-auto">
          <span class="whitespace-nowrap tabular-nums">{relativeTime(dateStr)}</span>
          <span class="opacity-40">/</span>
          <span class="whitespace-nowrap">{readingTime(item.content)}</span>
        </div>
        {item.tags && item.tags.length > 0 && (
          <div class="flex flex-wrap gap-1.5 mt-2">
            {item.tags.slice(0, 3).map((t) => (
              <a href={`/?tag=${encodeURIComponent(t)}`} class="text-[0.72rem] px-2 py-0.5 rounded-full bg-muted/8 border border-border-subtle text-muted no-underline hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-colors" {...hxProps(`/?tag=${encodeURIComponent(t)}`)}>#{t}</a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function MagazineSourcePage(props: SourcePageProps) {
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

  const sourceTitle = settings.source_title || 'My Magazine';
  const sourceDescription = settings.source_description || `News, features, and in-depth ${vocabulary.itemPlural}`;

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
  const baseUrl = filterQs ? `${safeSourceUrl}/?${escapeHtmlAttr(filterQs)}` : `${safeSourceUrl}/`;
  const sep = filterQs ? '&amp;' : '?';
  if (currentPage > 1) {
    relLinks += `\n    <link rel="prev" href="${baseUrl}${sep}offset=${(currentPage - 2) * pagination.limit}">`;
  }
  if (currentPage < totalPages) {
    relLinks += `\n    <link rel="next" href="${baseUrl}${sep}offset=${currentPage * pagination.limit}">`;
  }

  const headContent = `${metaTags}${relLinks}`;

  const sortParam = filters.sort === 'oldest' ? 'oldest' : undefined;
  const newestUrl = buildFilterUrl({ type: filters.typeId, workspace: filters.workspaceId, tag: filters.tag, q: filters.q });
  const oldestUrl = buildFilterUrl({ type: filters.typeId, workspace: filters.workspaceId, tag: filters.tag, q: filters.q, sort: 'oldest' });

  const [heroItem, ...gridItems] = items;

  return (
    <MagazineLayout title={sourceTitle} head={headContent} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings}>
      <JsonLd data={jsonLd} />

      <div class="source-page source-page--feed">
        <FilterBar types={types} activeTypeId={filters.typeId} workspaces={workspaces} activeWorkspaceId={filters.workspaceId} activeTag={filters.tag} sort={filters.sort} counts={counts} query={filters.q} t={t} />

        {/* Active tag filter chip */}
        {filters.tag && (
          <div class="mb-4">
            {(() => {
              const url = buildFilterUrl({ type: filters.typeId, workspace: filters.workspaceId, q: filters.q, sort: sortParam });
              return (
                <a href={url} title="Clear tag filter" class="inline-block px-3 py-1 rounded-full bg-primary text-primary-inverse no-underline text-sm hover:opacity-85" {...hxProps(url)}>
                  #{filters.tag} &times;
                </a>
              );
            })()}
          </div>
        )}

        {/* Header bar with count and sort */}
        <div class="flex items-center justify-between flex-wrap gap-3 mb-6">
          <span class="text-sm text-muted">
            {pagination.total} {pagination.total === 1 ? vocabulary.item : vocabulary.itemPlural}
            {activeType && <> in {activeType.name}</>}
            {activeWorkspace && <> in {activeWorkspace.name}</>}
          </span>
          <div class="flex gap-1">
            <a href={newestUrl} class={`px-3 py-1 rounded text-[0.8rem] no-underline transition-colors ${filters.sort === 'newest' ? 'bg-primary text-primary-inverse' : 'text-muted hover:bg-border/50 hover:text-text'}`} {...hxProps(newestUrl)}>
              Newest
            </a>
            <a href={oldestUrl} class={`px-3 py-1 rounded text-[0.8rem] no-underline transition-colors ${filters.sort === 'oldest' ? 'bg-primary text-primary-inverse' : 'text-muted hover:bg-border/50 hover:text-text'}`} {...hxProps(oldestUrl)}>
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
              icon="inbox"
              title={`No ${vocabulary.itemPlural} found`}
              description={`No ${vocabulary.itemPlural} matching this filter.`}
            />
          ) : (
            <>
              {/* Hero: first item */}
              {heroItem && <MagazineHeroCard item={heroItem} />}

              {/* Grid: remaining items */}
              {gridItems.length > 0 && (
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {gridItems.map((item) => (
                    <MagazineCard item={item} />
                  ))}
                </div>
              )}

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
    </MagazineLayout>
  );
}
