import type { SourcePageProps, Item } from '@pignal/templates';
import { FilterBar } from '../../components/type-sidebar';
import { Pagination } from '../../components/pagination';
import { JsonLd } from '../../components/json-ld';
import { buildSourceJsonLd, buildMetaTags, escapeHtmlAttr } from '../../lib/seo';
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
    <div class="magazine-hero">
      <div class="magazine-hero-image">
        <span class="magazine-section-badge">{item.typeName}</span>
      </div>
      <div class="magazine-hero-body">
        <h2>
          <a href={itemUrl} {...hxProps(itemUrl)}>{item.keySummary}</a>
        </h2>
        {excerpt && <p class="magazine-hero-excerpt">{excerpt}</p>}
        <div class="magazine-hero-meta">
          <span class="magazine-time">{relativeTime(dateStr)}</span>
          <span class="magazine-meta-sep">/</span>
          <span class="magazine-reading-time">{readingTime(item.content)}</span>
          {item.workspaceName && (
            <>
              <span class="magazine-meta-sep">/</span>
              <a href={`/?workspace=${item.workspaceId}`} {...hxProps(`/?workspace=${item.workspaceId}`)}>{item.workspaceName}</a>
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
    <div class="magazine-card">
      <div class="magazine-card-image">
        <a href={typeUrl} class="magazine-section-badge" {...hxProps(typeUrl)}>{item.typeName}</a>
      </div>
      <div class="magazine-card-body">
        <h3>
          <a href={itemUrl} {...hxProps(itemUrl)}>{item.keySummary}</a>
        </h3>
        {excerpt && <p class="magazine-card-excerpt">{excerpt}</p>}
        <div class="magazine-card-meta">
          <span class="magazine-time">{relativeTime(dateStr)}</span>
          <span class="magazine-meta-sep">/</span>
          <span class="magazine-reading-time">{readingTime(item.content)}</span>
        </div>
        {item.tags && item.tags.length > 0 && (
          <div class="magazine-card-tags">
            {item.tags.slice(0, 3).map((t) => (
              <a href={`/?tag=${encodeURIComponent(t)}`} class="magazine-tag" {...hxProps(`/?tag=${encodeURIComponent(t)}`)}>#{t}</a>
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
  } = props;

  const sourceTitle = settings.source_title || 'My Magazine';
  const sourceDescription = settings.source_description || `News, features, and in-depth ${vocabulary.itemPlural}`;

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
    <MagazineLayout title={sourceTitle} head={headContent} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings}>
      <JsonLd data={jsonLd} />

      <div class="source-page source-page--feed">
        <FilterBar types={types} activeTypeId={filters.typeId} workspaces={workspaces} activeWorkspaceId={filters.workspaceId} activeTag={filters.tag} sort={filters.sort} counts={counts} query={filters.q} />

        {/* Active tag filter chip */}
        {filters.tag && (
          <div class="magazine-active-tag">
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
        <div class="magazine-header-bar">
          <span class="magazine-result-count">
            {pagination.total} {pagination.total === 1 ? vocabulary.item : vocabulary.itemPlural}
            {activeType && <> in {activeType.name}</>}
            {activeWorkspace && <> in {activeWorkspace.name}</>}
          </span>
          <div class="magazine-sort">
            <a href={newestUrl} class={`magazine-sort-tab ${filters.sort === 'newest' ? 'active' : ''}`} {...hxProps(newestUrl)}>
              Newest
            </a>
            <a href={oldestUrl} class={`magazine-sort-tab ${filters.sort === 'oldest' ? 'active' : ''}`} {...hxProps(oldestUrl)}>
              Oldest
            </a>
          </div>
        </div>

        <div id="source-loading" class="source-loading htmx-indicator">
          <span class="app-spinner" />
        </div>
        <div id="source-results">
          {items.length === 0 ? (
            <p class="magazine-empty">No {vocabulary.itemPlural} matching this filter.</p>
          ) : (
            <>
              {/* Hero: first item */}
              {heroItem && <MagazineHeroCard item={heroItem} />}

              {/* Grid: remaining items */}
              {gridItems.length > 0 && (
                <div class="magazine-grid">
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
              />
            </>
          )}
        </div>
      </div>
    </MagazineLayout>
  );
}
