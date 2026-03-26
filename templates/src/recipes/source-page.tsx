/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */
import type { SourcePageProps, Item } from '../types';
import type { TemplateVocabulary } from '../types';
import { Pagination } from '@pignal/render/components/pagination';
import { TypeBadge } from '@pignal/render/components/type-badge';
import { EmptyState } from '@pignal/render/components/empty-state';
import { JsonLd } from '@pignal/render/components/json-ld';
import { buildSourceJsonLd, buildMetaTags, escapeHtmlAttr, resolveOgImage } from '@pignal/render/lib/seo';
import { stripMarkdown } from '@pignal/render/lib/markdown';
import { formatDate } from '@pignal/render/lib/time';
import { RecipesLayout } from './layout';

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

export function RecipeCard({ item, vocabulary }: { item: Item; vocabulary: TemplateVocabulary }) {
  const detailUrl = `/item/${item.slug}`;
  const preview = stripMarkdown(item.content).slice(0, 100);
  const icon = item.typeName ? item.typeName.charAt(0).toUpperCase() : '?';

  return (
    <article class="group card-hover bg-surface rounded-xl border border-border-subtle shadow-card overflow-hidden flex flex-col">
      <a href={detailUrl} class="block no-underline text-inherit">
        <div class="aspect-[16/10] bg-gradient-to-br from-primary/10 to-primary/25 flex items-center justify-center text-4xl text-primary opacity-50 relative overflow-hidden">
          <span class="transition-transform duration-300 group-hover:scale-[1.03]">{icon}</span>
          <div class="absolute top-2.5 left-2.5 z-10">
            <TypeBadge typeName={item.typeName} />
          </div>
          <div class="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-surface" />
        </div>
      </a>
      <div class="px-4 pt-3 pb-4 flex-1 flex flex-col">
        <h3 class="m-0 mb-1.5 text-[0.95rem] font-semibold leading-snug">
          <a href={detailUrl} class="no-underline text-text hover:text-primary transition-colors">{item.keySummary}</a>
        </h3>
        <div class="flex items-center gap-2 flex-wrap mb-1.5 text-xs text-muted">
          <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-border/50 text-[0.72rem] whitespace-nowrap">Recipe</span>
          {item.workspaceName && (
            <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-border/50 text-[0.72rem] whitespace-nowrap">{item.workspaceName}</span>
          )}
        </div>
        <p class="text-sm text-muted leading-relaxed m-0 mb-2 line-clamp-2 flex-1">{preview}{item.content.length > 100 ? '...' : ''}</p>
        {item.tags && item.tags.length > 0 && (
          <div class="flex gap-1.5 flex-wrap mt-auto pt-2">
            {item.tags.slice(0, 3).map((t) => {
              const tagUrl = `/?tag=${encodeURIComponent(t)}`;
              return (
                <a href={tagUrl} class="inline-flex items-center rounded-full text-[0.7rem] px-2 py-0.5 no-underline text-muted hover:bg-primary/5 hover:text-primary transition-colors border border-border-subtle" {...hxProps(tagUrl)}>#{t}</a>
              );
            })}
          </div>
        )}
      </div>
      <div class="flex items-center justify-between px-4 py-2 border-t border-border-subtle text-xs text-muted">
        <time datetime={item.vouchedAt || item.createdAt}>
          {formatDate(item.vouchedAt || item.createdAt)}
        </time>
        <a href={detailUrl} class="text-primary no-underline font-semibold text-[0.8rem] hover:underline">View {vocabulary.item} &rarr;</a>
      </div>
    </article>
  );
}

export function RecipesSourcePage(props: SourcePageProps) {
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

  const sourceTitle = settings.source_title || `My ${vocabulary.itemPlural.charAt(0).toUpperCase() + vocabulary.itemPlural.slice(1)}`;
  const sourceDescription = settings.source_description || `Browse ${vocabulary.itemPlural}`;

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

  // Filter types/workspaces that have items
  const typesWithItems = types.filter((t) => (counts.byType[t.id] ?? 0) > 0);
  const workspacesWithItems = workspaces.filter((w) => (counts.byWorkspace[w.id] ?? 0) > 0);

  // Pre-build URLs for sort tabs
  const newestUrl = buildFilterUrl({ type: filters.typeId, workspace: filters.workspaceId, tag: filters.tag, q: filters.q });
  const oldestUrl = buildFilterUrl({ type: filters.typeId, workspace: filters.workspaceId, tag: filters.tag, q: filters.q, sort: 'oldest' });

  return (
    <RecipesLayout title={sourceTitle} head={headContent} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings} t={props.t} locale={props.locale} defaultLocale={props.defaultLocale} visitor={props.visitor}>
      <JsonLd data={jsonLd} />

      <div class="max-w-7xl mx-auto px-4 pt-8 pb-16 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8 items-start fade-in-page">
        {/* Sidebar: cuisines + cookbooks */}
        <aside class="lg:sticky lg:top-6 text-sm max-lg:flex max-lg:gap-4 max-lg:flex-wrap max-lg:border-b max-lg:border-border-subtle max-lg:pb-4 lg:bg-surface lg:rounded-xl lg:border lg:border-border-subtle lg:shadow-card lg:p-4" aria-label="Recipe filters">
          <div class="mb-4 max-lg:mb-0 max-lg:w-full">
            <input
              type="text"
              name="q"
              placeholder={`Search ${vocabulary.itemPlural}...`}
              value={filters.q || ''}
              aria-label={`Search ${vocabulary.itemPlural}`}
              class="w-full m-0 h-9 text-sm px-3 py-1 rounded-lg border border-border bg-surface text-text"
              hx-get="/"
              hx-target={HX_TARGET}
              hx-swap="innerHTML"
              hx-trigger="input changed delay:300ms, keyup[key=='Enter']"
              hx-push-url="true"
              hx-indicator={HX_INDICATOR}
              hx-vals={hxVals}
            />
          </div>

          {typesWithItems.length > 0 && (
            <div class="mb-6 max-lg:mb-0">
              <div class="text-[0.7rem] font-bold uppercase tracking-wider text-muted mb-2">{vocabulary.typePlural}</div>
              <ul class="list-none p-0 m-0 max-lg:flex max-lg:gap-1 max-lg:flex-wrap">
                <li>
                  {(() => {
                    const url = buildFilterUrl({ workspace: filters.workspaceId, q: filters.q, sort: sortParam });
                    return (
                      <a href={url} class={`flex justify-between items-center px-2.5 py-1.5 rounded-lg no-underline text-sm transition-colors ${!filters.typeId ? 'bg-primary/10 text-primary font-semibold' : 'text-text hover:bg-primary/5 hover:text-primary'}`} {...hxProps(url)}>
                        <span>All</span>
                        <span class={`text-xs min-w-[1.2em] text-right ${!filters.typeId ? 'text-primary/60' : 'text-muted'}`}>{counts.total}</span>
                      </a>
                    );
                  })()}
                </li>
                {typesWithItems.map((type) => {
                  const url = buildFilterUrl({ type: type.id, workspace: filters.workspaceId, q: filters.q, sort: sortParam });
                  return (
                    <li>
                      <a href={url} class={`flex justify-between items-center px-2.5 py-1.5 rounded-lg no-underline text-sm transition-colors ${filters.typeId === type.id ? 'bg-primary/10 text-primary font-semibold' : 'text-text hover:bg-primary/5 hover:text-primary'}`} {...hxProps(url)}>
                        <span>{type.icon ? `${type.icon} ` : ''}{type.name}</span>
                        <span class={`text-xs min-w-[1.2em] text-right ${filters.typeId === type.id ? 'text-primary/60' : 'text-muted'}`}>{counts.byType[type.id] ?? 0}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {workspacesWithItems.length > 0 && (
            <div class="mb-6 max-lg:mb-0">
              <div class="text-[0.7rem] font-bold uppercase tracking-wider text-muted mb-2">{vocabulary.workspacePlural}</div>
              <ul class="list-none p-0 m-0 max-lg:flex max-lg:gap-1 max-lg:flex-wrap">
                {workspacesWithItems.map((ws) => {
                  const url = buildFilterUrl({ workspace: filters.workspaceId === ws.id ? undefined : ws.id, type: filters.typeId, q: filters.q, sort: sortParam });
                  return (
                    <li>
                      <a href={url} class={`flex justify-between items-center px-2.5 py-1.5 rounded-lg no-underline text-sm transition-colors ${filters.workspaceId === ws.id ? 'bg-primary/10 text-primary font-semibold' : 'text-text hover:bg-primary/5 hover:text-primary'}`} {...hxProps(url)}>
                        <span>{ws.name}</span>
                        <span class={`text-xs min-w-[1.2em] text-right ${filters.workspaceId === ws.id ? 'text-primary/60' : 'text-muted'}`}>{counts.byWorkspace[ws.id] ?? 0}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </aside>

        {/* Main content area */}
        <div>
          {filters.tag && (
            <div class="mb-3">
              {(() => {
                const url = buildFilterUrl({ type: filters.typeId, workspace: filters.workspaceId, q: filters.q, sort: sortParam });
                return (
                  <a href={url} class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[0.8rem] font-medium no-underline bg-primary text-primary-inverse hover:bg-primary-hover transition-colors" title="Clear tag filter" {...hxProps(url)}>
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
                icon="search"
                title={`No ${vocabulary.itemPlural} found`}
                description="Try adjusting your filters or search query."
              />
            ) : (
              <>
                <div class="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-6">
                  {items.map((item) => (
                    <RecipeCard item={item} vocabulary={vocabulary} />
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
    </RecipesLayout>
  );
}
