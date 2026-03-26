/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */
import type { SourcePageProps } from '../types';
import { Pagination } from '@pignal/render/components/pagination';
import { EmptyState } from '@pignal/render/components/empty-state';
import { JsonLd } from '@pignal/render/components/json-ld';
import { buildSourceJsonLd, buildMetaTags, escapeHtmlAttr, resolveOgImage } from '@pignal/render/lib/seo';
import { stripMarkdown } from '@pignal/render/lib/markdown';
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
    t,
  } = props;

  const sourceTitle = settings.source_title || 'My Knowledge Base';
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
    <WikiLayout title={sourceTitle} head={headContent} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings} visitor={props.visitor}>
      <JsonLd data={jsonLd} />

      <div class="max-w-7xl mx-auto px-4 pt-8 pb-16 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8 items-start">
        {/* Tree sidebar */}
        <aside class="sticky top-6 text-sm max-h-[calc(100vh-3rem)] overflow-y-auto max-lg:static max-lg:max-h-none max-lg:border-b max-lg:border-border-subtle max-lg:pb-4 max-lg:mb-0 lg:bg-surface lg:rounded-xl lg:border lg:border-border-subtle lg:shadow-card lg:p-4" role="navigation" aria-label="Wiki navigation">
          <div class="mb-4">
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

          {/* All articles link */}
          {(() => {
            const url = buildFilterUrl({ q: filters.q, sort: sortParam });
            return (
              <a href={url} class={`flex justify-between items-center px-2.5 py-2 rounded-lg no-underline text-sm font-semibold mb-2 transition-colors ${!filters.typeId && !filters.workspaceId ? 'bg-primary/10 text-primary' : 'text-text hover:bg-primary/8 hover:text-primary'}`} {...hxProps(url)}>
                <span>All {vocabulary.itemPlural}</span>
                <span class={`text-xs font-normal ${!filters.typeId && !filters.workspaceId ? 'text-primary/80' : 'text-muted'}`}>{counts.total}</span>
              </a>
            );
          })()}

          {/* Sections (workspaces) as collapsible tree nodes */}
          {workspacesWithItems.length > 0 && (
            <>
              <hr class="border-0 border-t border-border-subtle my-3" />
              {workspacesWithItems.map((ws) => {
                const isActive = filters.workspaceId === ws.id;
                const wsUrl = buildFilterUrl({ workspace: isActive ? undefined : ws.id, q: filters.q, sort: sortParam });
                // Get types within this workspace
                const wsTypes = typesWithItems.filter((t) => (counts.byWorkspaceType[ws.id]?.[t.id] ?? 0) > 0);
                return (
                  <details class="mb-1" open={isActive || undefined}>
                    <summary class="flex justify-between items-center px-2.5 py-2 rounded-lg cursor-pointer text-xs font-semibold uppercase tracking-wide text-muted list-none transition-colors hover:bg-primary/8 hover:text-primary [&::-webkit-details-marker]:hidden before:content-['\25B6'] before:text-[0.55rem] before:mr-2 before:inline-block before:transition-transform before:duration-200 [details[open]>&]:before:rotate-90">
                      <span>{ws.name}</span>
                      <span class="text-[0.7rem] font-normal text-muted min-w-[1.2em] text-right">{counts.byWorkspace[ws.id] ?? 0}</span>
                    </summary>
                    <ul class="list-none pl-2 mt-1 mb-2">
                      <li>
                        <a href={wsUrl} class={`flex justify-between items-center px-2.5 py-1.5 rounded-lg no-underline text-[0.82rem] border-l-2 transition-colors ${isActive && !filters.typeId ? 'bg-primary/10 text-primary font-semibold border-l-primary' : 'text-text border-l-transparent hover:bg-primary/8 hover:text-primary'}`} {...hxProps(wsUrl)}>
                          All in {ws.name}
                        </a>
                      </li>
                      {wsTypes.map((type) => {
                        const typeUrl = buildFilterUrl({ workspace: ws.id, type: type.id, q: filters.q, sort: sortParam });
                        return (
                          <li>
                            <a href={typeUrl} class={`flex justify-between items-center px-2.5 py-1.5 rounded-lg no-underline text-[0.82rem] border-l-2 transition-colors ${filters.workspaceId === ws.id && filters.typeId === type.id ? 'bg-primary/10 text-primary font-semibold border-l-primary' : 'text-text border-l-transparent hover:bg-primary/8 hover:text-primary'}`} {...hxProps(typeUrl)}>
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
              <hr class="border-0 border-t border-border-subtle my-3" />
              <details class="mb-1" open>
                <summary class="flex justify-between items-center px-2.5 py-2 rounded-lg cursor-pointer text-xs font-semibold uppercase tracking-wide text-muted list-none transition-colors hover:bg-primary/8 hover:text-primary [&::-webkit-details-marker]:hidden before:content-['\25B6'] before:text-[0.55rem] before:mr-2 before:inline-block before:transition-transform before:duration-200 [details[open]>&]:before:rotate-90">
                  <span>By {vocabulary.type}</span>
                </summary>
                <ul class="list-none pl-2 mt-1 mb-2">
                  {typesWithItems.map((type) => {
                    const typeUrl = buildFilterUrl({ type: filters.typeId === type.id ? undefined : type.id, workspace: filters.workspaceId, q: filters.q, sort: sortParam });
                    return (
                      <li>
                        <a href={typeUrl} class={`flex justify-between items-center px-2.5 py-1.5 rounded-lg no-underline text-[0.82rem] border-l-2 transition-colors ${filters.typeId === type.id && !filters.workspaceId ? 'bg-primary/10 text-primary font-semibold border-l-primary' : 'text-text border-l-transparent hover:bg-primary/8 hover:text-primary'}`} {...hxProps(typeUrl)}>
                          <span>{type.icon ? `${type.icon} ` : ''}{type.name}</span>
                          <span class={`text-xs font-normal min-w-[1.2em] text-right ${filters.typeId === type.id && !filters.workspaceId ? 'text-primary/80' : 'text-muted'}`}>{counts.byType[type.id] ?? 0}</span>
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

          {/* Header bar */}
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
                A-Z
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
                <div class="flex flex-col">
                  {sortedLetters.map((letter) => (
                    <>
                      <div class="text-lg font-bold text-primary pt-2 pb-1 mt-5 first:mt-0 border-b-2 border-primary mb-2 scroll-mt-4" id={`letter-${letter}`}>{letter}</div>
                      {grouped[letter].map((item) => {
                        const desc = stripMarkdown(item.content).slice(0, 100);
                        return (
                          <div class="flex items-baseline max-sm:flex-col gap-3 max-sm:gap-1 py-2.5 px-2 border-b border-border-subtle rounded-lg transition-colors hover:bg-primary/4">
                            <div class="flex-1 min-w-0">
                              <a href={`/item/${item.slug}`} class="no-underline text-text font-medium text-[0.95rem] hover:text-primary transition-colors">{item.keySummary}</a>
                              {desc && <div class="text-sm text-muted mt-0.5 line-clamp-1">{desc}</div>}
                            </div>
                            <div class="flex items-center gap-2 shrink-0 text-xs text-muted max-sm:order-first">
                              {item.typeName && <span class="text-[0.72rem] px-2 py-0.5 rounded-full bg-primary/12 text-primary font-medium whitespace-nowrap">{item.typeName}</span>}
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
                  t={t}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </WikiLayout>
  );
}
