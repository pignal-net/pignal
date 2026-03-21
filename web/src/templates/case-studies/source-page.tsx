import type { SourcePageProps, Item } from '@pignal/templates';
import { FilterBar } from '../../components/type-sidebar';
import { Pagination } from '../../components/pagination';
import { JsonLd } from '../../components/json-ld';
import { buildSourceJsonLd, buildMetaTags, escapeHtmlAttr } from '../../lib/seo';
import { stripMarkdown } from '../../lib/markdown';
import { formatDate, readingTime } from '../../lib/time';
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

/**
 * Extract key outcome metrics from the content. Looks for patterns like:
 * - "XX% improvement/reduction/increase"
 * - "Xh to Yh" (time reduction)
 * - numbers followed by "x" (multiplier)
 * Returns up to 3 metrics for display.
 */
function extractMetrics(content: string): { value: string; label: string }[] {
  const metrics: { value: string; label: string }[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    if (metrics.length >= 3) break;

    // Match percentage patterns: "40% cost reduction", "reduced by 70%"
    const pctMatch = line.match(/(\d+(?:\.\d+)?%)\s+([\w\s]{3,20})/i);
    if (pctMatch && metrics.length < 3) {
      metrics.push({ value: pctMatch[1], label: pctMatch[2].trim().slice(0, 20) });
      continue;
    }

    // Match multiplier patterns: "3x faster", "10x throughput"
    const multMatch = line.match(/(\d+(?:\.\d+)?x)\s+([\w\s]{3,20})/i);
    if (multMatch && metrics.length < 3) {
      metrics.push({ value: multMatch[1], label: multMatch[2].trim().slice(0, 20) });
      continue;
    }

    // Match dollar/currency patterns: "$2M savings", "$500K revenue"
    const dollarMatch = line.match(/(\$[\d.]+[KMB]?)\s+([\w\s]{3,20})/i);
    if (dollarMatch && metrics.length < 3) {
      metrics.push({ value: dollarMatch[1], label: dollarMatch[2].trim().slice(0, 20) });
    }
  }

  return metrics;
}

/** Extract a client/org attribution from the keySummary (text before the first verb/action word). */
function extractClient(keySummary: string): string {
  // Look for common patterns: "Company Name reduced...", "Series B startup..."
  const match = keySummary.match(/^(.+?)\s+(?:reduced|increased|improved|cut|automated|achieved|boosted|saved|delivered|launched|migrated|scaled)/i);
  return match ? match[1] : '';
}

function MetricsBar({ metrics }: { metrics: { value: string; label: string }[] }) {
  if (metrics.length === 0) return null;
  return (
    <div class="case-studies-metrics">
      {metrics.map((m) => (
        <div class="case-studies-metric">
          <span class="case-studies-metric-value">{m.value}</span>
          <span class="case-studies-metric-label">{m.label}</span>
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
    <div class="case-studies-hero">
      <div class="case-studies-hero-body">
        <a href={`/?type=${item.typeId}`} class="case-studies-industry-badge" {...hxProps(`/?type=${item.typeId}`)}>
          {item.typeName}
        </a>
        <h2>
          <a href={itemUrl} {...hxProps(itemUrl)}>{item.keySummary}</a>
        </h2>
        {excerpt && <p class="case-studies-hero-excerpt">{excerpt}</p>}
        <div class="case-studies-hero-meta">
          {client && (
            <>
              <span class="case-studies-client">{client}</span>
              <span class="case-studies-meta-sep">/</span>
            </>
          )}
          <time datetime={dateStr}>{formatDate(dateStr)}</time>
          <span class="case-studies-meta-sep">/</span>
          <span>{readingTime(item.content)}</span>
          {item.workspaceName && (
            <>
              <span class="case-studies-meta-sep">/</span>
              <a href={`/?workspace=${item.workspaceId}`} {...hxProps(`/?workspace=${item.workspaceId}`)}>{item.workspaceName}</a>
            </>
          )}
        </div>
      </div>
      <MetricsBar metrics={metrics} />
    </div>
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
    <div class="case-studies-card">
      <div class="case-studies-card-header">
        <a href={typeUrl} class="case-studies-industry-badge" {...hxProps(typeUrl)}>{item.typeName}</a>
        {client && <span class="case-studies-client">{client}</span>}
      </div>
      <div class="case-studies-card-body">
        <h3>
          <a href={itemUrl} {...hxProps(itemUrl)}>{item.keySummary}</a>
        </h3>
        {excerpt && <p class="case-studies-card-excerpt">{excerpt}</p>}
        <div class="case-studies-card-meta">
          <time datetime={dateStr}>{formatDate(dateStr)}</time>
          <span class="case-studies-meta-sep">/</span>
          <span>{readingTime(item.content)}</span>
        </div>
        {item.tags && item.tags.length > 0 && (
          <div class="case-studies-card-tags">
            {item.tags.slice(0, 3).map((t) => (
              <a href={`/?tag=${encodeURIComponent(t)}`} class="case-studies-tag" {...hxProps(`/?tag=${encodeURIComponent(t)}`)}>#{t}</a>
            ))}
          </div>
        )}
      </div>
      {metrics.length > 0 && (
        <div class="case-studies-card-metrics">
          {metrics.map((m) => (
            <div class="case-studies-metric">
              <span class="case-studies-metric-value">{m.value}</span>
              <span class="case-studies-metric-label">{m.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
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
  } = props;

  const sourceTitle = settings.source_title || 'My Case Studies';
  const sourceDescription = settings.source_description || `Client outcomes and transformation ${vocabulary.itemPlural}`;

  const activeType = filters.typeId ? types.find((t) => t.id === filters.typeId) : undefined;
  const activeWorkspace = filters.workspaceId ? workspaces.find((w) => w.id === filters.workspaceId) : undefined;

  let pageTitle = sourceTitle;
  if (activeType) pageTitle = `${activeType.name} | ${sourceTitle}`;
  else if (activeWorkspace) pageTitle = `${activeWorkspace.name} | ${sourceTitle}`;
  else if (filters.tag) pageTitle = `#${filters.tag} | ${sourceTitle}`;

  const githubUrl = settings.source_social_github || '';
  const githubUsername = githubUrl.replace(/\/$/, '').split('/').pop() || '';
  const ogImage = githubUsername
    ? `https://avatars.githubusercontent.com/${githubUsername}?s=400`
    : `${sourceUrl}/og-image.png`;

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
    <CaseStudiesLayout title={sourceTitle} head={headContent} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings}>
      <JsonLd data={jsonLd} />

      <div class="source-page source-page--feed">
        <FilterBar types={types} activeTypeId={filters.typeId} workspaces={workspaces} activeWorkspaceId={filters.workspaceId} activeTag={filters.tag} sort={filters.sort} counts={counts} query={filters.q} />

        {/* Active tag filter chip */}
        {filters.tag && (
          <div class="case-studies-active-tag">
            {(() => {
              const url = buildFilterUrl({ type: filters.typeId, workspace: filters.workspaceId, q: filters.q, sort: sortParam });
              return (
                <a href={url} title="Clear tag filter" {...hxProps(url)}>
                  #{filters.tag} &times;
                </a>
              );
            })()}
          </div>
        )}

        {/* Header bar with count and sort */}
        <div class="case-studies-header-bar">
          <span class="case-studies-result-count">
            {pagination.total} {pagination.total === 1 ? vocabulary.item : vocabulary.itemPlural}
            {activeType && <> in {activeType.name}</>}
            {activeWorkspace && <> in {activeWorkspace.name}</>}
          </span>
          <div class="case-studies-sort">
            <a href={newestUrl} class={`case-studies-sort-tab ${filters.sort === 'newest' ? 'active' : ''}`} {...hxProps(newestUrl)}>
              Newest
            </a>
            <a href={oldestUrl} class={`case-studies-sort-tab ${filters.sort === 'oldest' ? 'active' : ''}`} {...hxProps(oldestUrl)}>
              Oldest
            </a>
          </div>
        </div>

        <div id="source-loading" class="source-loading htmx-indicator">
          <span class="app-spinner" />
        </div>
        <div id="source-results">
          {items.length === 0 ? (
            <p class="case-studies-empty">No {vocabulary.itemPlural} matching this filter.</p>
          ) : (
            <>
              {/* Hero: first case study */}
              {heroItem && <CaseStudiesHeroCard item={heroItem} />}

              {/* Grid: remaining case studies */}
              {gridItems.length > 0 && (
                <div class="case-studies-grid">
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
              />
            </>
          )}
        </div>
      </div>
    </CaseStudiesLayout>
  );
}
