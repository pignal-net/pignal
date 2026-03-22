import type { SourcePageProps } from '@pignal/templates';
import { Pagination } from '../../components/pagination';
import { JsonLd } from '../../components/json-ld';
import { buildSourceJsonLd, buildMetaTags, escapeHtmlAttr } from '../../lib/seo';
import { stripMarkdown } from '../../lib/markdown';
import { ServicesLayout } from './layout';

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

export function ServicesSourcePage(props: SourcePageProps) {
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

  const sourceTitle = settings.source_title || 'My Services';
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

  // Group items by tier (type)
  const grouped: Record<string, { type: typeof types[0]; items: typeof items }> = {};
  const ungrouped: typeof items = [];
  for (const item of items) {
    if (item.typeId) {
      if (!grouped[item.typeId]) {
        const type = types.find((t) => t.id === item.typeId);
        if (type) grouped[item.typeId] = { type, items: [] };
      }
      if (grouped[item.typeId]) {
        grouped[item.typeId].items.push(item);
      } else {
        ungrouped.push(item);
      }
    } else {
      ungrouped.push(item);
    }
  }

  return (
    <ServicesLayout title={sourceTitle} head={headContent} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings}>
      <JsonLd data={jsonLd} />

      <div class="max-w-5xl mx-auto px-4 pt-8 pb-16">
        {/* Search */}
        <div class="mb-4 max-w-md">
          <input
            type="text"
            name="q"
            placeholder={`Search ${vocabulary.itemPlural}...`}
            value={filters.q || ''}
            class="w-full m-0 h-10 text-sm px-3 py-1.5 rounded-lg border border-border bg-surface text-text"
            hx-get="/"
            hx-target={HX_TARGET}
            hx-swap={HX_SWAP}
            hx-trigger="input changed delay:300ms, keyup[key=='Enter']"
            hx-push-url="true"
            hx-indicator={HX_INDICATOR}
            hx-vals={hxVals}
          />
        </div>

        {/* Package filter chips */}
        {workspacesWithItems.length > 0 && (
          <div class="flex flex-wrap gap-2 mb-5">
            {(() => {
              const allUrl = buildFilterUrl({ type: filters.typeId, q: filters.q, sort: sortParam });
              return (
                <a href={allUrl} class={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[0.82rem] font-medium no-underline border transition-colors ${!filters.workspaceId ? 'bg-primary text-white border-primary font-semibold' : 'border-border text-text bg-transparent hover:border-primary hover:text-primary hover:bg-primary/5'}`} {...hxProps(allUrl)}>
                  All {vocabulary.workspacePlural}
                </a>
              );
            })()}
            {workspacesWithItems.map((ws) => {
              const url = buildFilterUrl({ workspace: filters.workspaceId === ws.id ? undefined : ws.id, type: filters.typeId, q: filters.q, sort: sortParam });
              return (
                <a href={url} class={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[0.82rem] font-medium no-underline border transition-colors ${filters.workspaceId === ws.id ? 'bg-primary text-white border-primary font-semibold' : 'border-border text-text bg-transparent hover:border-primary hover:text-primary hover:bg-primary/5'}`} {...hxProps(url)}>
                  {ws.name}
                  <span class="text-[0.72rem] opacity-70">{counts.byWorkspace[ws.id] ?? 0}</span>
                </a>
              );
            })}
          </div>
        )}

        {/* Tier filter chips */}
        {typesWithItems.length > 1 && (
          <div class="flex flex-wrap gap-2 mb-5">
            {(() => {
              const allUrl = buildFilterUrl({ workspace: filters.workspaceId, q: filters.q, sort: sortParam });
              return (
                <a href={allUrl} class={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[0.82rem] font-medium no-underline border transition-colors ${!filters.typeId ? 'bg-primary text-white border-primary font-semibold' : 'border-border text-text bg-transparent hover:border-primary hover:text-primary hover:bg-primary/5'}`} {...hxProps(allUrl)}>
                  All {vocabulary.typePlural}
                </a>
              );
            })()}
            {typesWithItems.map((type) => {
              const url = buildFilterUrl({ type: filters.typeId === type.id ? undefined : type.id, workspace: filters.workspaceId, q: filters.q, sort: sortParam });
              return (
                <a href={url} class={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[0.82rem] font-medium no-underline border transition-colors ${filters.typeId === type.id ? 'bg-primary text-white border-primary font-semibold' : 'border-border text-text bg-transparent hover:border-primary hover:text-primary hover:bg-primary/5'}`} {...hxProps(url)}>
                  {type.icon ? `${type.icon} ` : ''}{type.name}
                  <span class="text-[0.72rem] opacity-70">{counts.byType[type.id] ?? 0}</span>
                </a>
              );
            })}
          </div>
        )}

        {/* Active tag */}
        {filters.tag && (
          <div class="mb-3">
            {(() => {
              const url = buildFilterUrl({ type: filters.typeId, workspace: filters.workspaceId, q: filters.q, sort: sortParam });
              return (
                <a href={url} title="Clear tag filter" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium no-underline bg-primary text-white" {...hxProps(url)}>
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
            <a href={newestUrl} class={`text-[0.82rem] px-3 py-1 no-underline transition-colors ${filters.sort === 'newest' ? 'text-primary font-semibold' : 'text-muted hover:text-text'}`} {...hxProps(newestUrl)}>
              Newest
            </a>
            <a href={oldestUrl} class={`text-[0.82rem] px-3 py-1 no-underline transition-colors ${filters.sort === 'oldest' ? 'text-primary font-semibold' : 'text-muted hover:text-text'}`} {...hxProps(oldestUrl)}>
              Oldest
            </a>
          </div>
        </div>

        <div id="source-loading" class="source-loading htmx-indicator">
          <span class="app-spinner" />
        </div>
        <div id="source-results">
          {items.length === 0 ? (
            <div class="empty-state">
              <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
              <p>{`No ${vocabulary.itemPlural} found.`}</p>
            </div>
          ) : (
            <>
              {/* Grouped by tier */}
              {types.filter((t) => grouped[t.id]).map((type) => (
                <>
                  <div class="text-base font-bold text-text pt-2 mt-6 first:mt-0 mb-3 border-b-2 border-primary flex items-center gap-1.5">
                    {type.icon && <span class="text-lg">{type.icon}</span>}
                    {type.name}
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-4">
                    {grouped[type.id].items.map((item) => {
                      const desc = stripMarkdown(item.content).slice(0, 150);
                      return (
                        <div class="border border-border-subtle border-t-[3px] border-t-primary rounded-xl bg-surface p-5 flex flex-col shadow-card transition-shadow duration-200 hover:shadow-card-hover">
                          <div class="flex items-start justify-between gap-2 mb-2">
                            <h3 class="m-0 text-base font-semibold leading-snug flex-1">
                              <a href={`/item/${item.slug}`} class="no-underline text-text hover:text-primary transition-colors">{item.keySummary}</a>
                            </h3>
                            <span class="text-[0.7rem] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold whitespace-nowrap shrink-0">{item.typeName}</span>
                          </div>
                          {desc && <div class="text-sm text-muted leading-relaxed mb-3 line-clamp-3 flex-1">{desc}</div>}
                          <div class="flex items-center justify-between pt-3 border-t border-border-subtle text-xs text-muted">
                            <div>
                              {item.workspaceName && <span class="text-[0.72rem]">{item.workspaceName}</span>}
                            </div>
                            <div class="flex items-center gap-2">
                              {item.validationActionLabel && (
                                <span class="text-[0.7rem] px-2 py-0.5 rounded-full font-semibold bg-green-500/15 text-green-600 whitespace-nowrap">{item.validationActionLabel}</span>
                              )}
                              <a href={`/item/${item.slug}`} class="text-primary no-underline font-semibold text-[0.82rem] hover:underline">Details</a>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ))}
              {ungrouped.length > 0 && (
                <>
                  <div class="text-base font-bold text-text pt-2 mt-6 mb-3 border-b-2 border-primary">Other</div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-4">
                    {ungrouped.map((item) => {
                      const desc = stripMarkdown(item.content).slice(0, 150);
                      return (
                        <div class="border border-border-subtle border-t-[3px] border-t-primary rounded-xl bg-surface p-5 flex flex-col shadow-card transition-shadow duration-200 hover:shadow-card-hover">
                          <div class="flex items-start justify-between gap-2 mb-2">
                            <h3 class="m-0 text-base font-semibold leading-snug flex-1">
                              <a href={`/item/${item.slug}`} class="no-underline text-text hover:text-primary transition-colors">{item.keySummary}</a>
                            </h3>
                          </div>
                          {desc && <div class="text-sm text-muted leading-relaxed mb-3 line-clamp-3 flex-1">{desc}</div>}
                          <div class="flex items-center justify-between pt-3 border-t border-border-subtle text-xs text-muted">
                            <div>
                              {item.workspaceName && <span class="text-[0.72rem]">{item.workspaceName}</span>}
                            </div>
                            <a href={`/item/${item.slug}`} class="text-primary no-underline font-semibold text-[0.82rem] hover:underline">Details</a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
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
    </ServicesLayout>
  );
}
