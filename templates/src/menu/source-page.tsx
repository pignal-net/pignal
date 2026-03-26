/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */
import type { SourcePageProps } from '../types';
import { Pagination } from '@pignal/render/components/pagination';
import { JsonLd } from '@pignal/render/components/json-ld';
import { EmptyState } from '@pignal/render/components/empty-state';
import { buildSourceJsonLd, buildMetaTags, escapeHtmlAttr, resolveOgImage } from '@pignal/render/lib/seo';
import { stripMarkdown } from '@pignal/render/lib/markdown';
import { MenuLayout } from './layout';

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

/** Extract a price-like string from the first line of content (e.g., "$12.99" or "12.50") */
function extractPrice(content: string): string | null {
  const firstLine = content.split('\n')[0].trim();
  const priceMatch = firstLine.match(/\$[\d,.]+/);
  if (priceMatch) return priceMatch[0];
  return null;
}

/** Get a short description from item content, skipping the first line if it looks like a price */
function getDescription(content: string, maxLen: number): string {
  const plain = stripMarkdown(content);
  return plain.length > maxLen ? plain.slice(0, maxLen) + '...' : plain;
}

export function MenuSourcePage(props: SourcePageProps) {
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

  const sourceTitle = settings.source_title || 'My Menu';
  const sourceDescription = settings.source_description || `Browse our ${vocabulary.itemPlural}`;

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

  // Workspace (menu) tabs -- only those with items
  const workspacesWithItems = workspaces.filter((w) => (counts.byWorkspace[w.id] ?? 0) > 0);

  // Group items by type (section) for table rendering
  // When a specific type filter is active, no grouping needed -- just show one section
  const typeOrder = types.filter((t) => !filters.typeId || t.id === filters.typeId);

  const itemsByType: Record<string, typeof items> = {};
  for (const item of items) {
    const key = item.typeId;
    if (!itemsByType[key]) itemsByType[key] = [];
    itemsByType[key].push(item);
  }

  return (
    <MenuLayout title={sourceTitle} head={headContent} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings} visitor={props.visitor}>
      <JsonLd data={jsonLd} />

      <div class="max-w-3xl mx-auto py-4">
        {/* Menu (workspace) tabs */}
        {workspacesWithItems.length > 0 && (
          <nav class="flex border-b-2 border-border-subtle mb-6 overflow-x-auto" style="-webkit-overflow-scrolling: touch">
            {(() => {
              const url = buildFilterUrl({ type: filters.typeId, q: filters.q, sort: sortParam });
              return (
                <a href={url} class={`px-5 py-2.5 no-underline font-medium text-sm whitespace-nowrap border-b-2 -mb-[2px] transition-colors ${!filters.workspaceId ? 'text-primary border-primary' : 'text-muted border-transparent hover:text-text'}`} {...hxProps(url)}>
                  All
                </a>
              );
            })()}
            {workspacesWithItems.map((ws) => {
              const url = buildFilterUrl({
                workspace: filters.workspaceId === ws.id ? undefined : ws.id,
                type: filters.typeId,
                q: filters.q,
                sort: sortParam,
              });
              return (
                <a href={url} class={`px-5 py-2.5 no-underline font-medium text-sm whitespace-nowrap border-b-2 -mb-[2px] transition-colors ${filters.workspaceId === ws.id ? 'text-primary border-primary' : 'text-muted border-transparent hover:text-text'}`} {...hxProps(url)}>
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
                <a href={url} title="Clear tag filter" class="inline-block px-3 py-1 bg-primary/10 rounded-full text-sm text-primary no-underline" {...hxProps(url)}>
                  #{filters.tag} &times;
                </a>
              );
            })()}
          </div>
        )}

        {/* Header bar */}
        <div class="flex justify-between items-center mb-4 pb-2">
          <span class="text-sm text-muted">
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
            <EmptyState
              icon="search"
              title={`No ${vocabulary.itemPlural} found`}
              description="Try adjusting your filters or search terms."
            />
          ) : (
            <>
              <div class="flex flex-col gap-8">
                {typeOrder
                  .filter((t) => itemsByType[t.id] && itemsByType[t.id].length > 0)
                  .map((type) => (
                    <div class="flex flex-col">
                      <div class="py-3 border-b-2 border-primary mb-1 flex items-baseline gap-3">
                        <span class="text-xl font-bold text-text tracking-wide">{type.icon ? `${type.icon} ` : ''}{type.name}</span>
                        {type.description && <span class="text-sm text-muted italic">{type.description}</span>}
                      </div>
                      <div class="flex flex-col">
                        {itemsByType[type.id].map((item) => {
                          const price = extractPrice(item.content);
                          const desc = getDescription(item.content, 80);
                          return (
                            <a href={`/item/${item.slug}`} class="group block py-3 no-underline text-inherit border-b border-border-subtle transition-colors hover:bg-surface-hover max-sm:p-3 max-sm:mb-2 max-sm:border max-sm:border-border-subtle max-sm:rounded-lg max-sm:bg-surface max-sm:hover:bg-surface-hover">
                              <div class="flex items-baseline gap-0 min-h-[1.4em]">
                                <span class="font-semibold text-base text-text shrink-0 group-hover:text-primary transition-colors">{item.keySummary}</span>
                                <span class="flex-1 border-b border-dotted border-border-subtle mx-2 min-w-4 relative -top-1 max-sm:hidden" />
                                {price && <span class="font-bold text-lg text-primary shrink-0 whitespace-nowrap">{price}</span>}
                              </div>
                              {desc && <div class="text-sm text-muted mt-0.5 leading-snug">{desc}</div>}
                              {item.tags && item.tags.length > 0 && (
                                <div class="flex gap-1.5 mt-1 flex-wrap">
                                  {item.tags.map((t) => (
                                    <span class="text-[0.7rem] px-1.5 py-0.5 rounded-xl bg-primary/10 text-primary uppercase tracking-wide font-medium">{t}</span>
                                  ))}
                                </div>
                              )}
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
    </MenuLayout>
  );
}
