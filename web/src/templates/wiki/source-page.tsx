import type { SourcePageProps } from '@pignal/templates';
import { Pagination } from '../../components/pagination';
import { JsonLd } from '../../components/json-ld';
import { buildSourceJsonLd, buildMetaTags, escapeHtmlAttr } from '../../lib/seo';
import { stripMarkdown } from '../../lib/markdown';
import { WikiLayout } from './layout';

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

export function WikiSourcePage(props: SourcePageProps) {
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

  const sourceTitle = settings.source_title || 'My Knowledge Base';
  const sourceDescription = settings.source_description || '';

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

  // Build hx-vals for search input
  const hxValsObj: Record<string, string> = {};
  if (filters.sort === 'oldest') hxValsObj.sort = 'oldest';
  if (filters.typeId) hxValsObj.type = filters.typeId;
  if (filters.workspaceId) hxValsObj.workspace = filters.workspaceId;
  if (filters.tag) hxValsObj.tag = filters.tag;
  const hxVals = JSON.stringify(hxValsObj);

  const typesWithItems = types.filter((t) => (counts.byType[t.id] ?? 0) > 0);
  const workspacesWithItems = workspaces.filter((w) => (counts.byWorkspace[w.id] ?? 0) > 0);

  const newestUrl = buildFilterUrl({ type: filters.typeId, workspace: filters.workspaceId, tag: filters.tag, q: filters.q });
  const oldestUrl = buildFilterUrl({ type: filters.typeId, workspace: filters.workspaceId, tag: filters.tag, q: filters.q, sort: 'oldest' });

  // Group items alphabetically
  const grouped: Record<string, typeof items> = {};
  for (const item of items) {
    const letter = (item.keySummary[0] || '#').toUpperCase();
    const key = /[A-Z]/.test(letter) ? letter : '#';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  }
  const sortedLetters = Object.keys(grouped).sort();

  return (
    <WikiLayout title={sourceTitle} head={headContent} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings}>
      <JsonLd data={jsonLd} />

      <div class="wiki-page">
        {/* Tree sidebar */}
        <aside class="wiki-sidebar">
          <div class="wiki-sidebar-search">
            <input
              type="text"
              name="q"
              placeholder={`Search ${vocabulary.itemPlural}...`}
              value={filters.q || ''}
              hx-get="/"
              hx-target={HX_TARGET}
              hx-swap={HX_SWAP}
              hx-trigger="input changed delay:300ms, keyup[key=='Enter']"
              hx-push-url="true"
              hx-indicator={HX_INDICATOR}
              hx-vals={hxVals}
            />
          </div>

          {/* All articles link */}
          {(() => {
            const url = buildFilterUrl({ q: filters.q, sort: sortParam });
            return (
              <a href={url} class={`wiki-sidebar-all ${!filters.typeId && !filters.workspaceId ? 'active' : ''}`} {...hxProps(url)}>
                <span>All {vocabulary.itemPlural}</span>
                <span class="wiki-sidebar-count">{counts.total}</span>
              </a>
            );
          })()}

          {/* Sections (workspaces) as collapsible tree nodes */}
          {workspacesWithItems.length > 0 && (
            <>
              <hr class="wiki-sidebar-divider" />
              {workspacesWithItems.map((ws) => {
                const isActive = filters.workspaceId === ws.id;
                const wsUrl = buildFilterUrl({ workspace: isActive ? undefined : ws.id, q: filters.q, sort: sortParam });
                // Get types within this workspace
                const wsTypes = typesWithItems.filter((t) => (counts.byWorkspaceType[ws.id]?.[t.id] ?? 0) > 0);
                return (
                  <details class="wiki-sidebar-section" open={isActive || undefined}>
                    <summary>
                      <span>{ws.name}</span>
                      <span class="wiki-sidebar-count">{counts.byWorkspace[ws.id] ?? 0}</span>
                    </summary>
                    <ul class="wiki-sidebar-list">
                      <li>
                        <a href={wsUrl} class={`wiki-sidebar-link ${isActive && !filters.typeId ? 'active' : ''}`} {...hxProps(wsUrl)}>
                          All in {ws.name}
                        </a>
                      </li>
                      {wsTypes.map((type) => {
                        const typeUrl = buildFilterUrl({ workspace: ws.id, type: type.id, q: filters.q, sort: sortParam });
                        return (
                          <li>
                            <a href={typeUrl} class={`wiki-sidebar-link ${filters.workspaceId === ws.id && filters.typeId === type.id ? 'active' : ''}`} {...hxProps(typeUrl)}>
                              {type.icon ? `${type.icon} ` : ''}{type.name}
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  </details>
                );
              })}
            </>
          )}

          {/* Topics (types) standalone section */}
          {typesWithItems.length > 0 && (
            <>
              <hr class="wiki-sidebar-divider" />
              <details class="wiki-sidebar-section" open>
                <summary>
                  <span>By {vocabulary.type}</span>
                </summary>
                <ul class="wiki-sidebar-list">
                  {typesWithItems.map((type) => {
                    const typeUrl = buildFilterUrl({ type: filters.typeId === type.id ? undefined : type.id, workspace: filters.workspaceId, q: filters.q, sort: sortParam });
                    return (
                      <li>
                        <a href={typeUrl} class={`wiki-sidebar-link ${filters.typeId === type.id && !filters.workspaceId ? 'active' : ''}`} {...hxProps(typeUrl)}>
                          <span>{type.icon ? `${type.icon} ` : ''}{type.name}</span>
                          <span class="wiki-sidebar-count">{counts.byType[type.id] ?? 0}</span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </details>
            </>
          )}
        </aside>

        {/* Main content */}
        <div>
          {/* Active tag pill */}
          {filters.tag && (
            <div class="wiki-active-tag">
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
          <div class="wiki-header-bar">
            <span class="wiki-result-count">
              {pagination.total} {pagination.total === 1 ? vocabulary.item : vocabulary.itemPlural}
              {activeType && <> in {activeType.name}</>}
              {activeWorkspace && <> in {activeWorkspace.name}</>}
            </span>
            <div class="wiki-sort">
              <a href={newestUrl} class={`wiki-sort-tab ${filters.sort === 'newest' ? 'active' : ''}`} {...hxProps(newestUrl)}>
                Newest
              </a>
              <a href={oldestUrl} class={`wiki-sort-tab ${filters.sort === 'oldest' ? 'active' : ''}`} {...hxProps(oldestUrl)}>
                A-Z
              </a>
            </div>
          </div>

          <div id="source-loading" class="source-loading htmx-indicator">
            <span class="app-spinner" />
          </div>
          <div id="source-results">
            {items.length === 0 ? (
              <p class="wiki-empty">No {vocabulary.itemPlural} matching this filter.</p>
            ) : (
              <>
                <div class="wiki-article-list">
                  {sortedLetters.map((letter) => (
                    <>
                      <div class="wiki-letter-header">{letter}</div>
                      {grouped[letter].map((item) => {
                        const desc = stripMarkdown(item.content).slice(0, 100);
                        return (
                          <div class="wiki-article-row">
                            <div class="wiki-article-title">
                              <a href={`/item/${item.slug}`}>{item.keySummary}</a>
                              {desc && <div class="wiki-article-description">{desc}</div>}
                            </div>
                            <div class="wiki-article-meta">
                              {item.typeName && <span class="wiki-article-topic">{item.typeName}</span>}
                              {item.workspaceName && <span>{item.workspaceName}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </>
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
      </div>
    </WikiLayout>
  );
}
