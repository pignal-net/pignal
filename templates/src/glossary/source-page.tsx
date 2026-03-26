/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */
import type { SourcePageProps } from '../types';
import { Pagination } from '@pignal/render/components/pagination';
import { EmptyState } from '@pignal/render/components/empty-state';
import { TypeBadge } from '@pignal/render/components/type-badge';
import { JsonLd } from '@pignal/render/components/json-ld';
import { buildSourceJsonLd, buildMetaTags, escapeHtmlAttr, resolveOgImage } from '@pignal/render/lib/seo';
import { stripMarkdown } from '@pignal/render/lib/markdown';
import { GlossaryLayout } from './layout';

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

/** Extract the term name (before any dash separator) from keySummary */
function getTermName(keySummary: string): string {
  const dashIdx = keySummary.indexOf(' \u2014 ');
  if (dashIdx > 0) return keySummary.slice(0, dashIdx);
  const hyphenIdx = keySummary.indexOf(' - ');
  if (hyphenIdx > 0) return keySummary.slice(0, hyphenIdx);
  return keySummary;
}

/** Get a short definition from content */
function getDefinition(content: string, maxLen: number): string {
  const plain = stripMarkdown(content);
  return plain.length > maxLen ? plain.slice(0, maxLen) + '...' : plain;
}

/** Get the first letter (uppercased) for alphabetical grouping */
function getFirstLetter(keySummary: string): string {
  const ch = keySummary.trim().charAt(0).toUpperCase();
  return /[A-Z]/.test(ch) ? ch : '#';
}

export function GlossarySourcePage(props: SourcePageProps) {
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

  const sourceTitle = settings.source_title || 'My Glossary';
  const sourceDescription = settings.source_description || `Searchable reference of ${vocabulary.itemPlural}`;

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

  // Build hx-vals for search input: preserves current filter state
  const hxValsObj: Record<string, string> = {};
  if (filters.sort === 'oldest') hxValsObj.sort = 'oldest';
  if (filters.typeId) hxValsObj.type = filters.typeId;
  if (filters.workspaceId) hxValsObj.workspace = filters.workspaceId;
  if (filters.tag) hxValsObj.tag = filters.tag;
  const hxVals = JSON.stringify(hxValsObj);

  // Types (domains) with items for filter chips
  const typesWithItems = types.filter((t) => (counts.byType[t.id] ?? 0) > 0);

  // Workspaces (glossaries) with items for tabs
  const workspacesWithItems = workspaces.filter((w) => (counts.byWorkspace[w.id] ?? 0) > 0);

  // Group items alphabetically by first letter of keySummary
  const letterGroups = new Map<string, typeof items>();
  for (const item of items) {
    const letter = getFirstLetter(item.keySummary);
    const arr = letterGroups.get(letter) ?? [];
    arr.push(item);
    letterGroups.set(letter, arr);
  }
  // Sort letter groups alphabetically
  const sortedLetters = Array.from(letterGroups.keys()).sort((a, b) => {
    if (a === '#') return 1;
    if (b === '#') return -1;
    return a.localeCompare(b);
  });

  // Build alphabet bar from A-Z
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  return (
    <GlossaryLayout title={sourceTitle} head={headContent} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings} visitor={props.visitor}>
      <JsonLd data={jsonLd} />

      <div class="max-w-[850px] mx-auto py-8 pb-16">
        {/* Search bar -- prominent, centered */}
        <div class="max-w-[600px] mx-auto mb-5 text-center">
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
            class="w-full text-lg px-4 py-3 border-2 border-border rounded-lg bg-surface text-text transition-colors focus:border-primary focus:outline-none placeholder:text-muted"
            aria-label={`Search ${vocabulary.itemPlural}`}
          />
        </div>

        {/* Quick-jump alphabet bar */}
        <nav class="flex flex-wrap justify-center gap-0.5 mb-5 py-2 border-b border-border-subtle" aria-label="Alphabetical navigation">
          {alphabet.map((letter) => {
            const hasItems = letterGroups.has(letter);
            return hasItems ? (
              <a href={`#letter-${letter}`} class="filter-chip inline-flex items-center justify-center w-8 h-8 text-sm font-semibold no-underline rounded hover:bg-primary/10 transition-colors">{letter}</a>
            ) : (
              <span class="inline-flex items-center justify-center w-8 h-8 text-sm font-semibold text-muted opacity-40 cursor-default pointer-events-none" aria-disabled="true">{letter}</span>
            );
          })}
        </nav>

        {/* Domain (type) filter chips */}
        {typesWithItems.length > 0 && (
          <div class="flex flex-wrap gap-1.5 mb-4">
            {(() => {
              const url = buildFilterUrl({ workspace: filters.workspaceId, q: filters.q, sort: sortParam });
              return (
                <a href={url} class={`filter-chip ${!filters.typeId ? 'active' : ''}`} {...hxProps(url)}>
                  All ({counts.total})
                </a>
              );
            })()}
            {typesWithItems.map((type) => {
              const url = buildFilterUrl({ type: type.id, workspace: filters.workspaceId, q: filters.q, sort: sortParam });
              return (
                <a href={url} class={`filter-chip ${filters.typeId === type.id ? 'active' : ''}`} {...hxProps(url)}>
                  {type.icon ? `${type.icon} ` : ''}{type.name} ({counts.byType[type.id] ?? 0})
                </a>
              );
            })}
          </div>
        )}

        {/* Glossary (workspace) tabs */}
        {workspacesWithItems.length > 0 && (
          <nav class="flex gap-0 border-b-2 border-border-subtle mb-4 overflow-x-auto" aria-label="Glossary sections">
            {workspacesWithItems.map((ws) => {
              const url = buildFilterUrl({
                workspace: filters.workspaceId === ws.id ? undefined : ws.id,
                type: filters.typeId,
                q: filters.q,
                sort: sortParam,
              });
              return (
                <a href={url} class={`px-4 py-2 no-underline font-medium text-sm whitespace-nowrap -mb-0.5 border-b-2 transition-colors ${filters.workspaceId === ws.id ? 'text-primary border-primary' : 'text-muted border-transparent hover:text-text'}`} {...hxProps(url)}>
                  {ws.name}
                </a>
              );
            })}
          </nav>
        )}

        {/* Active tag filter */}
        {filters.tag && (
          <div class="mb-4">
            {(() => {
              const url = buildFilterUrl({ type: filters.typeId, workspace: filters.workspaceId, q: filters.q, sort: sortParam });
              return (
                <a href={url} class="inline-block px-3 py-1 bg-primary/10 rounded-full text-sm text-primary no-underline transition-colors hover:bg-primary/20" title="Clear tag filter" {...hxProps(url)}>
                  #{filters.tag} &times;
                </a>
              );
            })()}
          </div>
        )}

        {/* Result count */}
        <div class="flex justify-between items-center mb-4">
          <span class="text-sm text-muted">
            {pagination.total} {pagination.total === 1 ? vocabulary.item : vocabulary.itemPlural}
            {activeType && <> in {activeType.name}</>}
            {activeWorkspace && <> &middot; {activeWorkspace.name}</>}
          </span>
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
              <div class="flex flex-col gap-6">
                {sortedLetters.map((letter) => (
                  <div class="scroll-mt-4" id={`letter-${letter}`}>
                    <div class="sticky top-0 z-[5] py-1.5 text-2xl font-extrabold text-muted bg-bg-page border-b-2 border-border-subtle mb-1">{letter}</div>
                    <div class="flex flex-col">
                      {letterGroups.get(letter)!.map((item) => {
                        const termName = getTermName(item.keySummary);
                        const definition = getDefinition(item.content, 100);
                        return (
                          <a href={`/item/${item.slug}`} class="flex items-start max-sm:flex-col gap-4 max-sm:gap-1 px-3 py-3 no-underline text-inherit border-b border-border-subtle rounded-lg transition-colors hover:bg-surface-hover">
                            <div class="flex items-center gap-2 shrink-0 min-w-[180px] lg:min-w-[220px] max-sm:min-w-0">
                              <span class="font-semibold text-lg text-text">{termName}</span>
                              <TypeBadge typeName={item.typeName} />
                            </div>
                            <div class="text-[0.9rem] text-muted leading-relaxed flex-1 max-sm:text-sm">{definition}</div>
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
                t={t}
              />
            </>
          )}
        </div>
      </div>
    </GlossaryLayout>
  );
}
