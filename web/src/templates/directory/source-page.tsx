import type { SourcePageProps } from '@pignal/templates';
import { Pagination } from '../../components/pagination';
import { EmptyState } from '../../components/empty-state';
import { JsonLd } from '../../components/json-ld';
import { buildSourceJsonLd, buildMetaTags, escapeHtmlAttr, resolveOgImage } from '../../lib/seo';
import { stripMarkdown } from '../../lib/markdown';
import { DirectoryLayout } from './layout';

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

function getStatusClasses(label: string | null): string {
  if (!label) return '';
  const lower = label.toLowerCase();
  if (lower.includes('active') || lower.includes('recommended')) return 'bg-success-bg text-success border border-success-border';
  if (lower.includes('new')) return 'bg-info-bg text-info border border-info-border';
  if (lower.includes('archived') || lower.includes('inactive') || lower.includes('stale')) return 'bg-surface-raised text-muted border border-border';
  if (lower.includes('deprecated') || lower.includes('shutting')) return 'bg-error-bg text-error border border-error-border';
  return 'bg-success-bg text-success border border-success-border';
}

export function DirectorySourcePage(props: SourcePageProps) {
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

  const sourceTitle = settings.source_title || 'My Resource Directory';
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
    <DirectoryLayout title={sourceTitle} head={headContent} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings} visitor={props.visitor}>
      <JsonLd data={jsonLd} />

      <div class="max-w-5xl mx-auto px-4 pt-8 pb-16">
        {/* Prominent search */}
        <div class="mb-6 max-w-lg">
          <div class="relative">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
            <input
              type="text"
              name="q"
              placeholder={`Search ${vocabulary.itemPlural}...`}
              value={filters.q || ''}
              aria-label={`Search ${vocabulary.itemPlural}`}
              class="w-full m-0 h-11 text-sm pl-10 pr-3 py-2 rounded-xl border border-border bg-surface text-text shadow-xs focus:border-primary focus:ring-2 focus:ring-primary-focus transition-colors"
              hx-get="/"
              hx-target={HX_TARGET}
              hx-swap={HX_SWAP}
              hx-trigger="input changed delay:300ms, keyup[key=='Enter']"
              hx-push-url="true"
              hx-indicator={HX_INDICATOR}
              hx-vals={hxVals}
            />
          </div>
        </div>

        {/* Category filter chips */}
        {typesWithItems.length > 1 && (
          <div class="flex flex-wrap gap-2 mb-5" role="group" aria-label={`Filter by ${vocabulary.type}`}>
            {(() => {
              const allUrl = buildFilterUrl({ workspace: filters.workspaceId, q: filters.q, sort: sortParam });
              return (
                <a href={allUrl} class={`filter-chip ${!filters.typeId ? 'active' : ''}`} {...hxProps(allUrl)}>
                  All {vocabulary.typePlural}
                </a>
              );
            })()}
            {typesWithItems.map((type) => {
              const url = buildFilterUrl({ type: filters.typeId === type.id ? undefined : type.id, workspace: filters.workspaceId, q: filters.q, sort: sortParam });
              return (
                <a href={url} class={`filter-chip ${filters.typeId === type.id ? 'active' : ''}`} {...hxProps(url)}>
                  {type.icon ? `${type.icon} ` : ''}{type.name}
                  <span class="text-[0.72rem] opacity-70">{counts.byType[type.id] ?? 0}</span>
                </a>
              );
            })}
          </div>
        )}

        {/* Collection filter chips */}
        {workspacesWithItems.length > 0 && (
          <div class="flex flex-wrap gap-2 mb-5" role="group" aria-label={`Filter by ${vocabulary.workspace}`}>
            {(() => {
              const allUrl = buildFilterUrl({ type: filters.typeId, q: filters.q, sort: sortParam });
              return (
                <a href={allUrl} class={`filter-chip ${!filters.workspaceId ? 'active' : ''}`} {...hxProps(allUrl)}>
                  All {vocabulary.workspacePlural}
                </a>
              );
            })()}
            {workspacesWithItems.map((ws) => {
              const url = buildFilterUrl({ workspace: filters.workspaceId === ws.id ? undefined : ws.id, type: filters.typeId, q: filters.q, sort: sortParam });
              return (
                <a href={url} class={`filter-chip ${filters.workspaceId === ws.id ? 'active' : ''}`} {...hxProps(url)}>
                  {ws.name}
                  <span class="text-[0.72rem] opacity-70">{counts.byWorkspace[ws.id] ?? 0}</span>
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
                <a href={url} title="Clear tag filter" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium no-underline bg-primary text-primary-inverse" {...hxProps(url)}>
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
          <div class="flex" role="group" aria-label="Sort order">
            <a href={newestUrl} class={`text-[0.82rem] px-3 py-1 no-underline transition-colors ${filters.sort === 'newest' ? 'text-primary font-semibold' : 'text-muted hover:text-text'}`} {...hxProps(newestUrl)}>
              Newest
            </a>
            <a href={oldestUrl} class={`text-[0.82rem] px-3 py-1 no-underline transition-colors ${filters.sort === 'oldest' ? 'text-primary font-semibold' : 'text-muted hover:text-text'}`} {...hxProps(oldestUrl)}>
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
              icon="search"
              title={`No ${vocabulary.itemPlural} found`}
              description="Try adjusting your search or filters."
            />
          ) : (
            <>
              {/* A-Z jump links */}
              {sortedLetters.length > 1 && (
                <nav class="flex flex-wrap gap-1 mb-6" aria-label="Alphabetical navigation">
                  {sortedLetters.map((letter) => (
                    <a
                      href={`#letter-${letter}`}
                      class="filter-chip"
                    >
                      {letter}
                    </a>
                  ))}
                </nav>
              )}
              <div class="flex flex-col">
                {sortedLetters.map((letter) => (
                  <>
                    <div class="text-lg font-bold text-primary pt-2 pb-1 mt-5 first:mt-0 mb-2 border-b-2 border-primary" id={`letter-${letter}`}>{letter}</div>
                    {grouped[letter].map((item) => {
                      const desc = stripMarkdown(item.content).slice(0, 140);
                      const statusClasses = getStatusClasses(item.validationActionLabel);
                      return (
                        <a href={`/item/${item.slug}`} class="card-hover flex items-start gap-3 py-3 px-3 rounded-lg border-b border-border-subtle no-underline text-inherit transition-colors hover:bg-primary/4 max-sm:flex-col max-sm:gap-1">
                          <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 mb-0.5 flex-wrap">
                              <span class="text-text font-semibold text-[0.95rem]">{item.keySummary}</span>
                              {item.typeName && <span class="text-[0.7rem] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium whitespace-nowrap">{item.typeName}</span>}
                              {item.validationActionLabel && (
                                <span class={`text-[0.68rem] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${statusClasses}`}>{item.validationActionLabel}</span>
                              )}
                            </div>
                            {desc && <div class="text-[0.82rem] text-muted leading-relaxed line-clamp-2">{desc}</div>}
                            {item.workspaceName && (
                              <div class="flex items-center gap-2 mt-1 text-xs text-muted">
                                <span class="text-[0.72rem]">{item.workspaceName}</span>
                              </div>
                            )}
                          </div>
                          <svg class="shrink-0 w-4 h-4 mt-1 text-muted opacity-40 max-sm:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17l9.2-9.2M17 17V7H7" /></svg>
                        </a>
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
    </DirectoryLayout>
  );
}
