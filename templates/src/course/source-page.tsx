/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */
import type { SourcePageProps } from '../types';
import { Pagination } from '@pignal/render/components/pagination';
import { EmptyState } from '@pignal/render/components/empty-state';
import { JsonLd } from '@pignal/render/components/json-ld';
import { buildSourceJsonLd, buildMetaTags, escapeHtmlAttr, resolveOgImage } from '@pignal/render/lib/seo';
import { stripMarkdown } from '@pignal/render/lib/markdown';
import { readingTime } from '@pignal/render/lib/time';
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
    t,
  } = props;

  const sourceTitle = settings.source_title || 'My Course';
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

  // Compute total reading time for all items
  const totalReadingMinutes = items.reduce((sum, item) => {
    const words = item.content.split(/\s+/).length;
    return sum + Math.ceil(words / 200);
  }, 0);

  return (
    <CourseLayout title={sourceTitle} head={headContent} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings} visitor={props.visitor}>
      <JsonLd data={jsonLd} />

      <div class="max-w-7xl mx-auto px-4 pt-8 pb-16 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8 items-start">
        {/* Sidebar: module outline */}
        <aside class="sticky top-6 text-sm max-h-[calc(100vh-3rem)] overflow-y-auto max-lg:static max-lg:max-h-none max-lg:border-b max-lg:border-border-subtle max-lg:pb-4 max-lg:mb-0 lg:bg-surface lg:rounded-xl lg:border lg:border-border-subtle lg:shadow-card lg:p-4" role="navigation" aria-label="Course navigation">
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

          {/* Course stats summary */}
          <div class="flex items-center gap-3 px-2.5 py-2 mb-3 text-xs text-muted">
            <span>{counts.total} {counts.total === 1 ? vocabulary.item : vocabulary.itemPlural}</span>
            {totalReadingMinutes > 0 && <span>&middot; ~{totalReadingMinutes} min total</span>}
          </div>

          {/* All lessons */}
          {(() => {
            const url = buildFilterUrl({ q: filters.q, sort: sortParam });
            return (
              <a href={url} class={`flex justify-between items-center px-2.5 py-2 rounded-lg no-underline text-sm font-semibold mb-2 transition-colors ${!filters.typeId && !filters.workspaceId ? 'bg-primary/10 text-primary' : 'text-text hover:bg-primary/8 hover:text-primary'}`} {...hxProps(url)}>
                <span>All {vocabulary.itemPlural}</span>
                <span class={`text-xs font-normal ${!filters.typeId && !filters.workspaceId ? 'text-primary/80' : 'text-muted'}`}>{counts.total}</span>
              </a>
            );
          })()}

          {/* Modules (types) */}
          {typesWithItems.length > 0 && (
            <>
              <hr class="border-0 border-t border-border-subtle my-3" />
              <div class="flex justify-between items-center px-2.5 py-2 text-[0.7rem] font-bold uppercase tracking-wider text-muted">{vocabulary.typePlural}</div>
              {typesWithItems.map((type) => {
                const isActive = filters.typeId === type.id;
                const typeUrl = buildFilterUrl({ type: isActive ? undefined : type.id, workspace: filters.workspaceId, q: filters.q, sort: sortParam });
                return (
                  <details class="mb-1" open={isActive || undefined}>
                    <summary class="flex justify-between items-center px-2.5 py-2 rounded-lg cursor-pointer text-[0.82rem] font-semibold text-text list-none transition-colors hover:bg-primary/8 hover:text-primary [&::-webkit-details-marker]:hidden before:content-['\25B6'] before:text-[0.55rem] before:mr-2 before:inline-block before:transition-transform before:duration-200 [details[open]>&]:before:rotate-90">
                      {type.icon && <span class="mr-1.5">{type.icon}</span>}
                      <span style="flex:1">{type.name}</span>
                      <span class="text-[0.72rem] font-normal text-muted min-w-[1.2em] text-right">{counts.byType[type.id] ?? 0}</span>
                    </summary>
                    <ul class="list-none pl-2 mt-1 mb-2">
                      <li>
                        <a href={typeUrl} class={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg no-underline text-[0.82rem] border-l-2 transition-colors ${isActive ? 'bg-primary/10 text-primary font-semibold border-l-primary' : 'text-text border-l-transparent hover:bg-primary/8 hover:text-primary'}`} {...hxProps(typeUrl)}>
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
              <hr class="border-0 border-t border-border-subtle my-3" />
              <div class="flex justify-between items-center px-2.5 py-2 text-[0.7rem] font-bold uppercase tracking-wider text-muted">{vocabulary.workspacePlural}</div>
              <ul class="list-none pl-2 mt-1 mb-2">
                {workspacesWithItems.map((ws) => {
                  const wsUrl = buildFilterUrl({ workspace: filters.workspaceId === ws.id ? undefined : ws.id, type: filters.typeId, q: filters.q, sort: sortParam });
                  return (
                    <li>
                      <a href={wsUrl} class={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg no-underline text-[0.82rem] border-l-2 transition-colors ${filters.workspaceId === ws.id ? 'bg-primary/10 text-primary font-semibold border-l-primary' : 'text-text border-l-transparent hover:bg-primary/8 hover:text-primary'}`} {...hxProps(wsUrl)}>
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
                Sequence
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
                <div class="flex flex-col gap-3">
                  {items.map((item, idx) => {
                    const num = pagination.offset + idx + 1;
                    const desc = stripMarkdown(item.content).slice(0, 120);
                    return (
                      <div class="card-hover flex items-start max-sm:flex-col gap-4 max-sm:gap-2 p-4 border border-border-subtle shadow-card rounded-xl bg-surface transition-all hover:border-primary">
                        <div class="flex items-center justify-center w-10 h-10 max-sm:w-8 max-sm:h-8 rounded-full bg-primary/12 text-primary text-base max-sm:text-sm font-bold shrink-0">{num}</div>
                        <div class="flex-1 min-w-0">
                          <h3 class="m-0 mb-1 text-base font-semibold leading-snug">
                            <a href={`/item/${item.slug}`} class="no-underline text-text hover:text-primary transition-colors">{item.keySummary}</a>
                          </h3>
                          <div class="flex items-center gap-2 flex-wrap text-xs text-muted">
                            {item.typeName && <span class="text-[0.72rem] px-2 py-0.5 rounded-full bg-primary/12 text-primary font-medium whitespace-nowrap">{item.typeName}</span>}
                            {item.workspaceName && <span class="text-[0.72rem] text-muted">{item.workspaceName}</span>}
                            <span>{readingTime(item.content)}</span>
                          </div>
                          {desc && <div class="text-sm text-muted mt-1 line-clamp-2 leading-relaxed">{desc}</div>}
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
                  t={t}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </CourseLayout>
  );
}
