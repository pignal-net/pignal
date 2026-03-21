import type { SourcePageProps } from '@pignal/templates';
import { Pagination } from '../../components/pagination';
import { JsonLd } from '../../components/json-ld';
import { buildSourceJsonLd, buildMetaTags, escapeHtmlAttr } from '../../lib/seo';
import { RunbookLayout } from './layout';

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

export function RunbookSourcePage(props: SourcePageProps) {
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

  const sourceTitle = settings.source_title || 'My Runbook';
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

  // Group procedures by playbook (workspace)
  const grouped: Record<string, typeof items> = {};
  const ungrouped: typeof items = [];
  for (const item of items) {
    if (item.workspaceName) {
      if (!grouped[item.workspaceName]) grouped[item.workspaceName] = [];
      grouped[item.workspaceName].push(item);
    } else {
      ungrouped.push(item);
    }
  }
  const groupNames = Object.keys(grouped).sort();

  return (
    <RunbookLayout title={sourceTitle} head={headContent} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings}>
      <JsonLd data={jsonLd} />

      <div class="runbook-page">
        {/* System sidebar */}
        <aside class="runbook-sidebar">
          <div class="runbook-sidebar-search">
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

          {/* Systems (types) */}
          {typesWithItems.length > 0 && (
            <>
              <div class="runbook-sidebar-title">{vocabulary.typePlural}</div>
              <ul class="runbook-sidebar-list">
                <li>
                  {(() => {
                    const url = buildFilterUrl({ workspace: filters.workspaceId, q: filters.q, sort: sortParam });
                    return (
                      <a href={url} class={`runbook-sidebar-link ${!filters.typeId ? 'active' : ''}`} {...hxProps(url)}>
                        <span>All</span>
                        <span class="runbook-sidebar-count">{counts.total}</span>
                      </a>
                    );
                  })()}
                </li>
                {typesWithItems.map((type) => {
                  const url = buildFilterUrl({ type: type.id, workspace: filters.workspaceId, q: filters.q, sort: sortParam });
                  return (
                    <li>
                      <a href={url} class={`runbook-sidebar-link ${filters.typeId === type.id ? 'active' : ''}`} {...hxProps(url)}>
                        <span>{type.icon ? `${type.icon} ` : ''}{type.name}</span>
                        <span class="runbook-sidebar-count">{counts.byType[type.id] ?? 0}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {/* Playbooks (workspaces) */}
          {workspacesWithItems.length > 0 && (
            <>
              <hr class="runbook-sidebar-divider" />
              <div class="runbook-sidebar-title">{vocabulary.workspacePlural}</div>
              <ul class="runbook-sidebar-list">
                {workspacesWithItems.map((ws) => {
                  const url = buildFilterUrl({ workspace: filters.workspaceId === ws.id ? undefined : ws.id, type: filters.typeId, q: filters.q, sort: sortParam });
                  return (
                    <li>
                      <a href={url} class={`runbook-sidebar-link ${filters.workspaceId === ws.id ? 'active' : ''}`} {...hxProps(url)}>
                        <span>{ws.name}</span>
                        <span class="runbook-sidebar-count">{counts.byWorkspace[ws.id] ?? 0}</span>
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
            <div class="runbook-active-tag">
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

          <div class="runbook-header-bar">
            <span class="runbook-result-count">
              {pagination.total} {pagination.total === 1 ? vocabulary.item : vocabulary.itemPlural}
              {activeType && <> in {activeType.name}</>}
              {activeWorkspace && <> in {activeWorkspace.name}</>}
            </span>
            <div class="runbook-sort">
              <a href={newestUrl} class={`runbook-sort-tab ${filters.sort === 'newest' ? 'active' : ''}`} {...hxProps(newestUrl)}>
                Newest
              </a>
              <a href={oldestUrl} class={`runbook-sort-tab ${filters.sort === 'oldest' ? 'active' : ''}`} {...hxProps(oldestUrl)}>
                Oldest
              </a>
            </div>
          </div>

          <div id="source-loading" class="source-loading htmx-indicator">
            <span class="app-spinner" />
          </div>
          <div id="source-results">
            {items.length === 0 ? (
              <p class="runbook-empty">No {vocabulary.itemPlural} matching this filter.</p>
            ) : (
              <>
                <div class="runbook-procedure-list">
                  {groupNames.map((name) => (
                    <>
                      <div class="runbook-group-header">{name}</div>
                      {grouped[name].map((item) => (
                        <div class="runbook-card">
                          <div class="runbook-card-body">
                            <h3><a href={`/item/${item.slug}`}>{item.keySummary}</a></h3>
                            <div class="runbook-card-meta">
                              {item.typeName && <span class="runbook-system-badge">{item.typeName}</span>}
                              {item.validationActionLabel && <span class="runbook-validation-badge">{item.validationActionLabel}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  ))}
                  {ungrouped.length > 0 && (
                    <>
                      {groupNames.length > 0 && <div class="runbook-group-header">Uncategorized</div>}
                      {ungrouped.map((item) => (
                        <div class="runbook-card">
                          <div class="runbook-card-body">
                            <h3><a href={`/item/${item.slug}`}>{item.keySummary}</a></h3>
                            <div class="runbook-card-meta">
                              {item.typeName && <span class="runbook-system-badge">{item.typeName}</span>}
                              {item.validationActionLabel && <span class="runbook-validation-badge">{item.validationActionLabel}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
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
    </RunbookLayout>
  );
}
