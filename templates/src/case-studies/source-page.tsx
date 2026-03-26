/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */
import type { SourcePageProps, Item } from '../types';
import { FilterBar } from '@pignal/render/components/type-sidebar';
import { Pagination } from '@pignal/render/components/pagination';
import { EmptyState } from '@pignal/render/components/empty-state';
import { JsonLd } from '@pignal/render/components/json-ld';
import { buildSourceJsonLd, buildMetaTags, escapeHtmlAttr, resolveOgImage } from '@pignal/render/lib/seo';
import { stripMarkdown } from '@pignal/render/lib/markdown';
import { formatDate, readingTime } from '@pignal/render/lib/time';
import { CaseStudiesLayout } from './layout';

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

function extractMetrics(content: string): { value: string; label: string }[] {
  const metrics: { value: string; label: string }[] = [];
  const lines = content.split('\n');
  for (const line of lines) {
    if (metrics.length >= 3) break;
    const pctMatch = line.match(/(\d+(?:\.\d+)?%)\s+([\w\s]{3,20})/i);
    if (pctMatch && metrics.length < 3) { metrics.push({ value: pctMatch[1], label: pctMatch[2].trim().slice(0, 20) }); continue; }
    const multMatch = line.match(/(\d+(?:\.\d+)?x)\s+([\w\s]{3,20})/i);
    if (multMatch && metrics.length < 3) { metrics.push({ value: multMatch[1], label: multMatch[2].trim().slice(0, 20) }); continue; }
    const dollarMatch = line.match(/(\$[\d.]+[KMB]?)\s+([\w\s]{3,20})/i);
    if (dollarMatch && metrics.length < 3) { metrics.push({ value: dollarMatch[1], label: dollarMatch[2].trim().slice(0, 20) }); }
  }
  return metrics;
}

function extractClient(keySummary: string): string {
  const match = keySummary.match(/^(.+?)\s+(?:reduced|increased|improved|cut|automated|achieved|boosted|saved|delivered|launched|migrated|scaled)/i);
  return match ? match[1] : '';
}

function MetricsBar({ metrics, large }: { metrics: { value: string; label: string }[]; large?: boolean }) {
  if (metrics.length === 0) return null;
  return (
    <div class="flex max-sm:flex-col border-t border-border-subtle" role="list" aria-label="Key metrics">
      {metrics.map((m, i) => (
        <div class={`flex-1 px-4 py-3 max-sm:py-2 text-center max-sm:text-left max-sm:flex max-sm:items-center max-sm:gap-2 bg-surface ${i > 0 ? 'border-l max-sm:border-l-0 max-sm:border-t border-border' : ''}`} role="listitem">
          <span class={`block max-sm:inline max-sm:min-w-[4rem] font-bold text-primary leading-tight mb-0.5 ${large ? 'text-2xl max-sm:text-xl' : 'text-lg max-sm:text-base'}`}>{m.value}</span>
          <span class="block max-sm:inline text-[0.72rem] text-muted uppercase tracking-wide">{m.label}</span>
        </div>
      ))}
    </div>
  );
}

function CaseStudiesHeroCard({ item }: { item: Item }) {
  const excerpt = stripMarkdown(item.content).slice(0, 220);
  const dateStr = item.vouchedAt || item.createdAt;
  const itemUrl = `/item/${item.slug}`;
  const metrics = extractMetrics(item.content);
  const client = extractClient(item.keySummary);

  return (
    <article class="relative border border-border-subtle shadow-card rounded-xl overflow-hidden bg-surface mb-8 card-hover">
      <div class="px-6 max-sm:px-5 pt-7 pb-6 max-sm:pt-4 max-sm:pb-4">
        <a href={`/?type=${item.typeId}`} class="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide text-primary-inverse bg-primary no-underline hover:opacity-90 mb-4 transition-opacity" {...hxProps(`/?type=${item.typeId}`)}>
          {item.typeName}
        </a>
        <h2 class="m-0 mb-3 text-2xl max-sm:text-lg leading-snug tracking-tight">
          <a href={itemUrl} class="no-underline text-text hover:text-primary transition-colors" {...hxProps(itemUrl)}>{item.keySummary}</a>
        </h2>
        {excerpt && <p class="text-[0.95rem] max-sm:text-sm text-muted leading-relaxed m-0 mb-4 line-clamp-3">{excerpt}</p>}
        <div class="flex items-center gap-3 flex-wrap text-sm text-muted">
          {client && (
            <>
              <span class="text-sm text-muted italic">{client}</span>
              <span class="text-muted opacity-40">/</span>
            </>
          )}
          <time datetime={dateStr}>{formatDate(dateStr)}</time>
          <span class="text-muted opacity-40">/</span>
          <span>{readingTime(item.content)}</span>
          {item.workspaceName && (
            <>
              <span class="text-muted opacity-40">/</span>
              <a href={`/?workspace=${item.workspaceId}`} class="no-underline text-muted hover:text-primary transition-colors" {...hxProps(`/?workspace=${item.workspaceId}`)}>{item.workspaceName}</a>
            </>
          )}
        </div>
      </div>
      <MetricsBar metrics={metrics} large />
    </article>
  );
}

function CaseStudiesCard({ item }: { item: Item }) {
  const excerpt = stripMarkdown(item.content).slice(0, 140);
  const dateStr = item.vouchedAt || item.createdAt;
  const itemUrl = `/item/${item.slug}`;
  const typeUrl = `/?type=${item.typeId}`;
  const metrics = extractMetrics(item.content).slice(0, 2);
  const client = extractClient(item.keySummary);

  return (
    <article class="border border-border-subtle shadow-card rounded-xl overflow-hidden bg-surface flex flex-col card-hover">
      <div class="px-4 pt-4 flex items-center justify-between gap-2">
        <a href={typeUrl} class="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide text-primary-inverse bg-primary no-underline hover:opacity-90 transition-opacity" {...hxProps(typeUrl)}>{item.typeName}</a>
        {client && <span class="text-sm text-muted italic">{client}</span>}
      </div>
      <div class="px-4 pt-3 pb-4 flex-1 flex flex-col">
        <h3 class="m-0 mb-2 text-base leading-snug font-semibold">
          <a href={itemUrl} class="no-underline text-text hover:text-primary transition-colors" {...hxProps(itemUrl)}>{item.keySummary}</a>
        </h3>
        {excerpt && <p class="text-sm text-muted m-0 mb-3 leading-relaxed line-clamp-2 flex-1">{excerpt}</p>}
        <div class="flex items-center gap-2 flex-wrap text-xs text-muted mt-auto">
          <time datetime={dateStr}>{formatDate(dateStr)}</time>
          <span class="text-muted opacity-40">/</span>
          <span>{readingTime(item.content)}</span>
        </div>
        {item.tags && item.tags.length > 0 && (
          <div class="flex flex-wrap gap-1.5 mt-2">
            {item.tags.slice(0, 3).map((t) => (
              <a href={`/?tag=${encodeURIComponent(t)}`} class="text-[0.72rem] px-2 py-0.5 rounded-full bg-muted/8 border border-border-subtle text-muted no-underline hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-colors" {...hxProps(`/?tag=${encodeURIComponent(t)}`)}>#{t}</a>
            ))}
          </div>
        )}
      </div>
      <MetricsBar metrics={metrics} />
    </article>
  );
}

export function CaseStudiesSourcePage(props: SourcePageProps) {
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

  const sourceTitle = settings.source_title || 'My Case Studies';
  const sourceDescription = settings.source_description || `Client outcomes and transformation ${vocabulary.itemPlural}`;

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
    <CaseStudiesLayout title={sourceTitle} head={headContent} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings} t={props.t} locale={props.locale} defaultLocale={props.defaultLocale} visitor={props.visitor}>
      <JsonLd data={jsonLd} />

      <div class="source-page source-page--feed fade-in-page">
        <FilterBar types={types} activeTypeId={filters.typeId} workspaces={workspaces} activeWorkspaceId={filters.workspaceId} activeTag={filters.tag} sort={filters.sort} counts={counts} query={filters.q} t={t} />

        {/* Active tag filter chip */}
        {filters.tag && (
          <div class="mb-4">
            {(() => {
              const url = buildFilterUrl({ type: filters.typeId, workspace: filters.workspaceId, q: filters.q, sort: sortParam });
              return (
                <a href={url} class="inline-block px-3 py-1 rounded-full bg-primary text-primary-inverse no-underline text-sm hover:opacity-85" title="Clear tag filter" {...hxProps(url)}>
                  #{filters.tag} &times;
                </a>
              );
            })()}
          </div>
        )}

        {/* Header bar with count and sort */}
        <div class="flex items-center max-sm:flex-col max-sm:items-start justify-between flex-wrap gap-3 mb-6">
          <span class="text-[0.9rem] text-muted">
            {pagination.total} {pagination.total === 1 ? vocabulary.item : vocabulary.itemPlural}
            {activeType && <> in {activeType.name}</>}
            {activeWorkspace && <> in {activeWorkspace.name}</>}
          </span>
          <div class="flex gap-1">
            <a href={newestUrl} class={`px-3 py-1.5 rounded text-[0.8rem] no-underline transition-colors ${filters.sort !== 'oldest' ? 'bg-primary text-primary-inverse' : 'text-muted hover:bg-border hover:text-text'}`} {...hxProps(newestUrl)}>
              Newest
            </a>
            <a href={oldestUrl} class={`px-3 py-1.5 rounded text-[0.8rem] no-underline transition-colors ${filters.sort === 'oldest' ? 'bg-primary text-primary-inverse' : 'text-muted hover:bg-border hover:text-text'}`} {...hxProps(oldestUrl)}>
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
              description="Try adjusting your filters or search query."
            />
          ) : (
            <>
              {/* Hero: first case study */}
              {heroItem && <CaseStudiesHeroCard item={heroItem} />}

              {/* Grid: remaining case studies */}
              {gridItems.length > 0 && (
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {gridItems.map((item) => (
                    <CaseStudiesCard item={item} />
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
    </CaseStudiesLayout>
  );
}
