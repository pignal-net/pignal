import type { SourcePageProps } from '@pignal/templates';
import { Pagination } from '../../components/pagination';
import { JsonLd } from '../../components/json-ld';
import { buildSourceJsonLd, buildMetaTags, escapeHtmlAttr } from '../../lib/seo';
import { stripMarkdown } from '../../lib/markdown';
import { readingTime } from '../../lib/time';
import { CourseLayout } from './layout';

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

export function CourseSourcePage(props: SourcePageProps) {
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

  const sourceTitle = settings.source_title || 'My Course';
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

  return (
    <CourseLayout title={sourceTitle} head={headContent} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings}>
      <JsonLd data={jsonLd} />

      <div class="course-page">
        {/* Sidebar: module outline */}
        <aside class="course-sidebar">
          <div class="course-sidebar-search">
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

          {/* All lessons */}
          {(() => {
            const url = buildFilterUrl({ q: filters.q, sort: sortParam });
            return (
              <a href={url} class={`course-sidebar-all ${!filters.typeId && !filters.workspaceId ? 'active' : ''}`} {...hxProps(url)}>
                <span>All {vocabulary.itemPlural}</span>
                <span class="course-sidebar-count">{counts.total}</span>
              </a>
            );
          })()}

          {/* Modules (types) */}
          {typesWithItems.length > 0 && (
            <>
              <hr class="course-sidebar-divider" />
              <div class="course-sidebar-title">{vocabulary.typePlural}</div>
              {typesWithItems.map((type) => {
                const isActive = filters.typeId === type.id;
                const typeUrl = buildFilterUrl({ type: isActive ? undefined : type.id, workspace: filters.workspaceId, q: filters.q, sort: sortParam });
                return (
                  <details class="course-sidebar-module" open={isActive || undefined}>
                    <summary>
                      {type.icon && <span class="course-module-icon">{type.icon}</span>}
                      <span style="flex:1">{type.name}</span>
                      <span class="course-sidebar-count">{counts.byType[type.id] ?? 0}</span>
                    </summary>
                    <ul class="course-sidebar-list">
                      <li>
                        <a href={typeUrl} class={`course-sidebar-link ${isActive ? 'active' : ''}`} {...hxProps(typeUrl)}>
                          All {type.name}
                        </a>
                      </li>
                    </ul>
                  </details>
                );
              })}
            </>
          )}

          {/* Tracks (workspaces) */}
          {workspacesWithItems.length > 0 && (
            <>
              <hr class="course-sidebar-divider" />
              <div class="course-sidebar-title">{vocabulary.workspacePlural}</div>
              <ul class="course-sidebar-list">
                {workspacesWithItems.map((ws) => {
                  const wsUrl = buildFilterUrl({ workspace: filters.workspaceId === ws.id ? undefined : ws.id, type: filters.typeId, q: filters.q, sort: sortParam });
                  return (
                    <li>
                      <a href={wsUrl} class={`course-sidebar-link ${filters.workspaceId === ws.id ? 'active' : ''}`} {...hxProps(wsUrl)}>
                        <span>{ws.name}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </aside>

        {/* Main content */}
        <div>
          {filters.tag && (
            <div class="course-active-tag">
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

          <div class="course-header-bar">
            <span class="course-result-count">
              {pagination.total} {pagination.total === 1 ? vocabulary.item : vocabulary.itemPlural}
              {activeType && <> in {activeType.name}</>}
              {activeWorkspace && <> in {activeWorkspace.name}</>}
            </span>
            <div class="course-sort">
              <a href={newestUrl} class={`course-sort-tab ${filters.sort === 'newest' ? 'active' : ''}`} {...hxProps(newestUrl)}>
                Newest
              </a>
              <a href={oldestUrl} class={`course-sort-tab ${filters.sort === 'oldest' ? 'active' : ''}`} {...hxProps(oldestUrl)}>
                Sequence
              </a>
            </div>
          </div>

          <div id="source-loading" class="source-loading htmx-indicator">
            <span class="app-spinner" />
          </div>
          <div id="source-results">
            {items.length === 0 ? (
              <p class="course-empty">No {vocabulary.itemPlural} matching this filter.</p>
            ) : (
              <>
                <div class="course-lesson-list">
                  {items.map((item, idx) => {
                    const num = pagination.offset + idx + 1;
                    const desc = stripMarkdown(item.content).slice(0, 120);
                    return (
                      <div class="course-card">
                        <div class="course-card-num">{num}</div>
                        <div class="course-card-body">
                          <h3><a href={`/item/${item.slug}`}>{item.keySummary}</a></h3>
                          <div class="course-card-meta">
                            {item.typeName && <span class="course-module-badge">{item.typeName}</span>}
                            {item.workspaceName && <span class="course-track-badge">{item.workspaceName}</span>}
                            <span>{readingTime(item.content)}</span>
                          </div>
                          {desc && <div class="course-card-description">{desc}</div>}
                        </div>
                      </div>
                    );
                  })}
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
    </CourseLayout>
  );
}
