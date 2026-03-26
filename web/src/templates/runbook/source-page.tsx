import type { SourcePageProps } from '@pignal/templates';
import { Pagination } from '../../components/pagination';
import { EmptyState } from '../../components/empty-state';
import { JsonLd } from '../../components/json-ld';
import { buildSourceJsonLd, buildMetaTags, escapeHtmlAttr, resolveOgImage } from '../../lib/seo';
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
    t,
  } = props;

  const sourceTitle = settings.source_title || 'My Runbook';
  const sourceDescription = settings.source_description || '';

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

      <div class="max-w-7xl mx-auto px-4 pt-8 pb-16 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8 items-start">
        {/* System sidebar */}
        <aside class="sticky top-6 text-sm max-h-[calc(100vh-3rem)] overflow-y-auto max-lg:static max-lg:max-h-none max-lg:flex max-lg:gap-4 max-lg:flex-wrap max-lg:border-b max-lg:border-border-subtle max-lg:pb-4 max-lg:mb-0 lg:bg-surface lg:rounded-xl lg:border lg:border-border-subtle lg:shadow-card lg:p-4" role="navigation" aria-label="Runbook navigation">
          <div class="mb-4 max-lg:mb-0 max-lg:w-full">
            <input
              type="text"
              name="q"
              placeholder={`Search ${vocabulary.itemPlural}...`}
              value={filters.q || ''}
              class="w-full m-0 h-9 text-sm px-3 py-1"
              hx-get="/"
              hx-target={HX_TARGET}
              hx-swap={HX_SWAP}
              hx-trigger="input changed delay:300ms, keyup[key=='Enter']"
              hx-push-url="true"
              hx-indicator={HX_INDICATOR}
              hx-vals={hxVals}
              aria-label={`Search ${vocabulary.itemPlural}`}
            />
          </div>

          {/* Systems (types) */}
          {typesWithItems.length > 0 && (
            <div class="max-lg:mb-0">
              <div class="text-[0.7rem] font-bold uppercase tracking-wider text-muted mb-2 px-2.5">{vocabulary.typePlural}</div>
              <ul class="list-none p-0 m-0 mb-4 max-lg:flex max-lg:gap-1 max-lg:flex-wrap">
                <li>
                  {(() => {
                    const url = buildFilterUrl({ workspace: filters.workspaceId, q: filters.q, sort: sortParam });
                    return (
                      <a href={url} class={`flex justify-between items-center px-2.5 py-1.5 rounded-lg no-underline text-sm transition-colors ${!filters.typeId ? 'bg-primary/10 text-primary font-semibold' : 'text-text hover:bg-primary/8 hover:text-primary'}`} {...hxProps(url)}>
                        <span>All</span>
                        <span class={`text-xs min-w-[1.2em] text-right ${!filters.typeId ? 'text-primary/80' : 'text-muted font-normal'}`}>{counts.total}</span>
                      </a>
                    );
                  })()}
                </li>
                {typesWithItems.map((type) => {
                  const url = buildFilterUrl({ type: type.id, workspace: filters.workspaceId, q: filters.q, sort: sortParam });
                  return (
                    <li>
                      <a href={url} class={`flex justify-between items-center px-2.5 py-1.5 rounded-lg no-underline text-sm transition-colors ${filters.typeId === type.id ? 'bg-primary/10 text-primary font-semibold' : 'text-text hover:bg-primary/8 hover:text-primary'}`} {...hxProps(url)}>
                        <span>{type.icon ? `${type.icon} ` : ''}{type.name}</span>
                        <span class={`text-xs min-w-[1.2em] text-right ${filters.typeId === type.id ? 'text-primary/80' : 'text-muted font-normal'}`}>{counts.byType[type.id] ?? 0}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Playbooks (workspaces) */}
          {workspacesWithItems.length > 0 && (
            <div class="max-lg:mb-0">
              <hr class="border-0 border-t border-border-subtle my-3 max-lg:hidden" />
              <div class="text-[0.7rem] font-bold uppercase tracking-wider text-muted mb-2 px-2.5">{vocabulary.workspacePlural}</div>
              <ul class="list-none p-0 m-0 mb-4 max-lg:flex max-lg:gap-1 max-lg:flex-wrap">
                {workspacesWithItems.map((ws) => {
                  const url = buildFilterUrl({ workspace: filters.workspaceId === ws.id ? undefined : ws.id, type: filters.typeId, q: filters.q, sort: sortParam });
                  return (
                    <li>
                      <a href={url} class={`flex justify-between items-center px-2.5 py-1.5 rounded-lg no-underline text-sm transition-colors ${filters.workspaceId === ws.id ? 'bg-primary/10 text-primary font-semibold' : 'text-text hover:bg-primary/8 hover:text-primary'}`} {...hxProps(url)}>
                        <span>{ws.name}</span>
                        <span class={`text-xs min-w-[1.2em] text-right ${filters.workspaceId === ws.id ? 'text-primary/80' : 'text-muted font-normal'}`}>{counts.byWorkspace[ws.id] ?? 0}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </aside>

        {/* Main content */}
        <div>
          {filters.tag && (
            <div class="mb-3">
              {(() => {
                const url = buildFilterUrl({ type: filters.typeId, workspace: filters.workspaceId, q: filters.q, sort: sortParam });
                return (
                  <a href={url} class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[0.8rem] font-medium no-underline bg-primary text-primary-inverse transition-colors hover:bg-primary-hover" title="Clear tag filter" {...hxProps(url)}>
                    #{filters.tag} &times;
                  </a>
                );
              })()}
            </div>
          )}

          <div class="flex items-center justify-between mb-4 pb-3 border-b border-border-subtle">
            <span class="text-sm text-muted">
              {pagination.total} {pagination.total === 1 ? vocabulary.item : vocabulary.itemPlural}
              {activeType && <> in {activeType.name}</>}
              {activeWorkspace && <> in {activeWorkspace.name}</>}
            </span>
            <div class="flex">
              <a href={newestUrl} class={`text-sm px-3 py-1.5 no-underline transition-colors ${filters.sort === 'newest' ? 'text-primary font-semibold' : 'text-muted hover:text-text'}`} {...hxProps(newestUrl)}>
                Newest
              </a>
              <a href={oldestUrl} class={`text-sm px-3 py-1.5 no-underline transition-colors ${filters.sort === 'oldest' ? 'text-primary font-semibold' : 'text-muted hover:text-text'}`} {...hxProps(oldestUrl)}>
                Oldest
              </a>
            </div>
          </div>

          <div id="source-loading" class="source-loading htmx-indicator">
            <span class="app-spinner" />
          </div>
          <div id="source-results" aria-live="polite">
            {items.length === 0 ? (
              <EmptyState
                icon="file"
                title={`No ${vocabulary.itemPlural} found`}
                description="Try adjusting your filters or search query."
              />
            ) : (
              <>
                <div class="flex flex-col gap-2">
                  {groupNames.map((name) => (
                    <>
                      <div class="text-sm font-bold text-muted uppercase tracking-wide py-2 mt-6 first:mt-0 mb-2 border-b border-border-subtle">{name}</div>
                      {grouped[name].map((item, idx) => (
                        <div class="card-hover flex items-center gap-3 px-4 py-3 border border-border-subtle shadow-card rounded-xl bg-surface transition-all border-l-[3px] border-l-transparent hover:border-l-primary">
                          <div class="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0">{idx + 1}</div>
                          <div class="flex-1 min-w-0">
                            <h3 class="m-0 mb-0.5 text-[0.95rem] font-semibold leading-snug">
                              <a href={`/item/${item.slug}`} class="no-underline text-text hover:text-primary transition-colors">{item.keySummary}</a>
                            </h3>
                            <div class="flex items-center gap-2 flex-wrap text-xs text-muted">
                              {item.typeName && <span class="text-[0.72rem] px-2 py-0.5 rounded-full bg-primary/12 text-primary font-medium whitespace-nowrap">{item.typeName}</span>}
                              {item.validationActionLabel && <span class="text-[0.68rem] px-1.5 py-0.5 rounded-full font-semibold whitespace-nowrap bg-success-bg text-success border border-success-border">{item.validationActionLabel}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  ))}
                  {ungrouped.length > 0 && (
                    <>
                      {groupNames.length > 0 && <div class="text-sm font-bold text-muted uppercase tracking-wide py-2 mt-6 mb-2 border-b border-border-subtle">Uncategorized</div>}
                      {ungrouped.map((item, idx) => (
                        <div class="card-hover flex items-center gap-3 px-4 py-3 border border-border-subtle shadow-card rounded-xl bg-surface transition-all border-l-[3px] border-l-transparent hover:border-l-primary">
                          <div class="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0">{idx + 1}</div>
                          <div class="flex-1 min-w-0">
                            <h3 class="m-0 mb-0.5 text-[0.95rem] font-semibold leading-snug">
                              <a href={`/item/${item.slug}`} class="no-underline text-text hover:text-primary transition-colors">{item.keySummary}</a>
                            </h3>
                            <div class="flex items-center gap-2 flex-wrap text-xs text-muted">
                              {item.typeName && <span class="text-[0.72rem] px-2 py-0.5 rounded-full bg-primary/12 text-primary font-medium whitespace-nowrap">{item.typeName}</span>}
                              {item.validationActionLabel && <span class="text-[0.68rem] px-1.5 py-0.5 rounded-full font-semibold whitespace-nowrap bg-success-bg text-success border border-success-border">{item.validationActionLabel}</span>}
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
                  t={t}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </RunbookLayout>
  );
}
