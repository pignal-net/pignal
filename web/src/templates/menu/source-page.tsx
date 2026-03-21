import type { SourcePageProps } from '@pignal/templates';
import { Pagination } from '../../components/pagination';
import { JsonLd } from '../../components/json-ld';
import { buildSourceJsonLd, buildMetaTags, escapeHtmlAttr } from '../../lib/seo';
import { stripMarkdown } from '../../lib/markdown';
import { MenuLayout } from './layout';

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

function hxProps(url: string) {
  return {
    'hx-get': url,
    'hx-target': HX_TARGET,
    'hx-swap': HX_SWAP,
    'hx-push-url': 'true',
    'hx-indicator': HX_INDICATOR,
  };
}

/** Extract a price-like string from the first line of content (e.g., "$12.99" or "12.50") */
function extractPrice(content: string): string | null {
  const firstLine = content.split('\n')[0].trim();
  const priceMatch = firstLine.match(/\$[\d,.]+/);
  if (priceMatch) return priceMatch[0];
  return null;
}

/** Get a short description from item content, skipping the first line if it looks like a price */
function getDescription(content: string, maxLen: number): string {
  const plain = stripMarkdown(content);
  return plain.length > maxLen ? plain.slice(0, maxLen) + '...' : plain;
}

export function MenuSourcePage(props: SourcePageProps) {
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

  const sourceTitle = settings.source_title || 'My Menu';
  const sourceDescription = settings.source_description || `Browse our ${vocabulary.itemPlural}`;

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

  // Workspace (menu) tabs — only those with items
  const workspacesWithItems = workspaces.filter((w) => (counts.byWorkspace[w.id] ?? 0) > 0);

  // Group items by type (section) for table rendering
  // When a specific type filter is active, no grouping needed — just show one section
  const typeOrder = types.filter((t) => !filters.typeId || t.id === filters.typeId);

  const itemsByType: Record<string, typeof items> = {};
  for (const item of items) {
    const key = item.typeId;
    if (!itemsByType[key]) itemsByType[key] = [];
    itemsByType[key].push(item);
  }

  return (
    <MenuLayout title={sourceTitle} head={headContent} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings}>
      <JsonLd data={jsonLd} />

      <div class="menu-page">
        {/* Menu (workspace) tabs */}
        {workspacesWithItems.length > 0 && (
          <nav class="menu-tabs">
            {(() => {
              const url = buildFilterUrl({ type: filters.typeId, q: filters.q, sort: sortParam });
              return (
                <a href={url} class={`menu-tab ${!filters.workspaceId ? 'active' : ''}`} {...hxProps(url)}>
                  All
                </a>
              );
            })()}
            {workspacesWithItems.map((ws) => {
              const url = buildFilterUrl({
                workspace: filters.workspaceId === ws.id ? undefined : ws.id,
                type: filters.typeId,
                q: filters.q,
                sort: sortParam,
              });
              return (
                <a href={url} class={`menu-tab ${filters.workspaceId === ws.id ? 'active' : ''}`} {...hxProps(url)}>
                  {ws.name}
                </a>
              );
            })}
          </nav>
        )}

        {/* Active tag filter */}
        {filters.tag && (
          <div class="menu-active-tag">
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

        {/* Header bar */}
        <div class="menu-header-bar">
          <span class="menu-result-count">
            {pagination.total} {pagination.total === 1 ? vocabulary.item : vocabulary.itemPlural}
            {activeType && <> in {activeType.name}</>}
            {activeWorkspace && <> &middot; {activeWorkspace.name}</>}
          </span>
        </div>

        <div id="source-loading" class="source-loading htmx-indicator">
          <span class="app-spinner" />
        </div>
        <div id="source-results">
          {items.length === 0 ? (
            <p class="menu-empty">No {vocabulary.itemPlural} found.</p>
          ) : (
            <>
              <div class="menu-table-container">
                {typeOrder
                  .filter((t) => itemsByType[t.id] && itemsByType[t.id].length > 0)
                  .map((type) => (
                    <div class="menu-section">
                      <div class="menu-section-header">
                        <span class="menu-section-name">{type.icon ? `${type.icon} ` : ''}{type.name}</span>
                        {type.description && <span class="menu-section-desc">{type.description}</span>}
                      </div>
                      <div class="menu-items">
                        {itemsByType[type.id].map((item) => {
                          const price = extractPrice(item.content);
                          const desc = getDescription(item.content, 80);
                          return (
                            <a href={`/item/${item.slug}`} class="menu-row" {...hxProps(`/item/${item.slug}`)}>
                              <div class="menu-row-left">
                                <span class="menu-item-name">{item.keySummary}</span>
                                <span class="menu-item-dots" />
                                {price && <span class="menu-item-price">{price}</span>}
                              </div>
                              {desc && <div class="menu-item-desc">{desc}</div>}
                              {item.tags && item.tags.length > 0 && (
                                <div class="menu-item-tags">
                                  {item.tags.map((t) => (
                                    <span class="menu-item-tag">{t}</span>
                                  ))}
                                </div>
                              )}
                            </a>
                          );
                        })}
                      </div>
                    </div>
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
    </MenuLayout>
  );
}
