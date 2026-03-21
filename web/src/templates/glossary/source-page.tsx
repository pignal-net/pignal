import type { SourcePageProps } from '@pignal/templates';
import { Pagination } from '../../components/pagination';
import { TypeBadge } from '../../components/type-badge';
import { JsonLd } from '../../components/json-ld';
import { buildSourceJsonLd, buildMetaTags, escapeHtmlAttr } from '../../lib/seo';
import { stripMarkdown } from '../../lib/markdown';
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
  } = props;

  const sourceTitle = settings.source_title || 'My Glossary';
  const sourceDescription = settings.source_description || `Searchable reference of ${vocabulary.itemPlural}`;

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
    <GlossaryLayout title={sourceTitle} head={headContent} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings}>
      <JsonLd data={jsonLd} />

      <div class="glossary-page">
        {/* Search bar — prominent, centered */}
        <div class="glossary-search">
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
            class="glossary-search-input"
          />
        </div>

        {/* Quick-jump alphabet bar */}
        <nav class="glossary-alphabet" aria-label="Alphabetical navigation">
          {alphabet.map((letter) => {
            const hasItems = letterGroups.has(letter);
            return hasItems ? (
              <a href={`#letter-${letter}`} class="glossary-alpha-link">{letter}</a>
            ) : (
              <span class="glossary-alpha-link glossary-alpha-disabled">{letter}</span>
            );
          })}
        </nav>

        {/* Domain (type) filter chips */}
        {typesWithItems.length > 0 && (
          <div class="glossary-filters">
            {(() => {
              const url = buildFilterUrl({ workspace: filters.workspaceId, q: filters.q, sort: sortParam });
              return (
                <a href={url} class={`glossary-chip ${!filters.typeId ? 'active' : ''}`} {...hxProps(url)}>
                  All ({counts.total})
                </a>
              );
            })()}
            {typesWithItems.map((type) => {
              const url = buildFilterUrl({ type: type.id, workspace: filters.workspaceId, q: filters.q, sort: sortParam });
              return (
                <a href={url} class={`glossary-chip ${filters.typeId === type.id ? 'active' : ''}`} {...hxProps(url)}>
                  {type.icon ? `${type.icon} ` : ''}{type.name} ({counts.byType[type.id] ?? 0})
                </a>
              );
            })}
          </div>
        )}

        {/* Glossary (workspace) tabs */}
        {workspacesWithItems.length > 0 && (
          <nav class="glossary-tabs">
            {workspacesWithItems.map((ws) => {
              const url = buildFilterUrl({
                workspace: filters.workspaceId === ws.id ? undefined : ws.id,
                type: filters.typeId,
                q: filters.q,
                sort: sortParam,
              });
              return (
                <a href={url} class={`glossary-tab ${filters.workspaceId === ws.id ? 'active' : ''}`} {...hxProps(url)}>
                  {ws.name}
                </a>
              );
            })}
          </nav>
        )}

        {/* Active tag filter */}
        {filters.tag && (
          <div class="glossary-active-tag">
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

        {/* Result count */}
        <div class="glossary-header-bar">
          <span class="glossary-result-count">
            {pagination.total} {pagination.total === 1 ? vocabulary.item : vocabulary.itemPlural}
            {activeType && <> in {activeType.name}</>}
            {activeWorkspace && <> &middot; {activeWorkspace.name}</>}
          </span>
        </div>

        <div id="source-loading" class="source-loading htmx-indicator">
          <span class="app-spinner" />
        </div>
        <div id="source-results">
          {items.length === 0 ? (
            <p class="glossary-empty">No {vocabulary.itemPlural} found.</p>
          ) : (
            <>
              <div class="glossary-term-list">
                {sortedLetters.map((letter) => (
                  <div class="glossary-letter-group" id={`letter-${letter}`}>
                    <div class="glossary-letter-header">{letter}</div>
                    <div class="glossary-terms">
                      {letterGroups.get(letter)!.map((item) => {
                        const termName = getTermName(item.keySummary);
                        const definition = getDefinition(item.content, 100);
                        return (
                          <a href={`/item/${item.slug}`} class="glossary-term-row" {...hxProps(`/item/${item.slug}`)}>
                            <div class="glossary-term-left">
                              <span class="glossary-term-name">{termName}</span>
                              <TypeBadge typeName={item.typeName} />
                            </div>
                            <div class="glossary-term-def">{definition}</div>
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
              />
            </>
          )}
        </div>
      </div>
    </GlossaryLayout>
  );
}
