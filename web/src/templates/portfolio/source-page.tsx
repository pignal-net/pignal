import type { SourcePageProps, Item } from '@pignal/templates';
import type { TemplateVocabulary } from '@pignal/templates';
import { FilterBar } from '../../components/type-sidebar';
import { Pagination } from '../../components/pagination';
import { TypeBadge } from '../../components/type-badge';
import { JsonLd } from '../../components/json-ld';
import { buildSourceJsonLd, buildMetaTags, escapeHtmlAttr, resolveOgImage } from '../../lib/seo';
import { stripMarkdown } from '../../lib/markdown';
import { formatDate } from '../../lib/time';
import { PortfolioLayout } from './layout';

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

function PortfolioCard({ item, vocabulary }: { item: Item; vocabulary: TemplateVocabulary }) {
  const detailUrl = `/item/${item.slug}`;
  const preview = stripMarkdown(item.content).slice(0, 120);
  const icon = item.typeName ? item.typeName.charAt(0).toUpperCase() : '?';

  return (
    <article class="bg-surface rounded-xl border border-border-subtle shadow-card overflow-hidden flex flex-col transition-all duration-300 hover:shadow-card-hover">
      <div class="aspect-[4/3] bg-gradient-to-br from-primary/5 to-primary/15 flex items-center justify-center text-4xl text-primary opacity-50 relative overflow-hidden">
        <span>{icon}</span>
        <div class="absolute top-2.5 left-2.5 z-10">
          <TypeBadge typeName={item.typeName} />
        </div>
        <div class="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-surface" />
      </div>
      <div class="px-4 pt-3 pb-4 flex-1 flex flex-col">
        <h3 class="m-0 mb-1 text-base font-semibold leading-snug">
          <a href={detailUrl} class="no-underline text-text hover:text-primary transition-colors">{item.keySummary}</a>
        </h3>
        <p class="text-[0.82rem] text-muted leading-relaxed m-0 mb-2 line-clamp-2 flex-1">{preview}{item.content.length > 120 ? '...' : ''}</p>
        {item.tags && item.tags.length > 0 && (
          <div class="flex gap-1 flex-wrap mt-auto pt-2">
            {item.tags.slice(0, 3).map((t) => {
              const tagUrl = `/?tag=${encodeURIComponent(t)}`;
              return (
                <a href={tagUrl} class="item-tag text-[0.7rem] px-1.5 py-0.5" {...hxProps(tagUrl)}>#{t}</a>
              );
            })}
          </div>
        )}
      </div>
      <div class="flex items-center justify-between px-4 py-2 border-t border-border-subtle text-xs text-muted">
        <time datetime={item.vouchedAt || item.createdAt}>
          {formatDate(item.vouchedAt || item.createdAt)}
        </time>
        <a href={detailUrl} class="text-primary no-underline font-semibold text-[0.8rem] hover:underline">View {vocabulary.item} &rarr;</a>
      </div>
    </article>
  );
}

export function PortfolioSourcePage(props: SourcePageProps) {
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
  } = props;

  const sourceTitle = settings.source_title || `My ${vocabulary.itemPlural.charAt(0).toUpperCase() + vocabulary.itemPlural.slice(1)}`;
  const sourceDescription = settings.source_description || `Browse ${vocabulary.itemPlural}`;

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

  // Pre-build URLs for sort tabs
  const newestUrl = buildFilterUrl({ type: filters.typeId, workspace: filters.workspaceId, tag: filters.tag, q: filters.q });
  const oldestUrl = buildFilterUrl({ type: filters.typeId, workspace: filters.workspaceId, tag: filters.tag, q: filters.q, sort: 'oldest' });

  return (
    <PortfolioLayout title={sourceTitle} head={headContent} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings}>
      <JsonLd data={jsonLd} />

      <div class="max-w-7xl mx-auto px-4 pt-8 pb-16">
        {/* Horizontal filter chips (FilterBar renders as chips, no sidebar) */}
        <FilterBar types={types} activeTypeId={filters.typeId} workspaces={workspaces} activeWorkspaceId={filters.workspaceId} activeTag={filters.tag} sort={filters.sort} counts={counts} query={filters.q} />

        {/* Active tag filter */}
        {filters.tag && (
          <div class="mb-3">
            {(() => {
              const url = buildFilterUrl({ type: filters.typeId, workspace: filters.workspaceId, q: filters.q, sort: sortParam });
              return (
                <a href={url} title="Clear tag filter" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium no-underline bg-primary text-white" {...hxProps(url)}>
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
            <div class="empty-state">
              <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
              <p>{`No ${vocabulary.itemPlural} found.`}</p>
            </div>
          ) : (
            <>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item) => (
                  <PortfolioCard item={item} vocabulary={vocabulary} />
                ))}
              </div>
              <Pagination
                total={pagination.total}
                limit={pagination.limit}
                offset={pagination.offset}
                baseUrl={paginationBase}
                htmxTarget={HX_TARGET}
              />
            </>
          )}
        </div>
      </div>
    </PortfolioLayout>
  );
}
