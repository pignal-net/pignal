import type { SourcePageProps } from '@pignal/templates';
import { FilterBar } from '../../components/type-sidebar';
import { Pagination } from '../../components/pagination';
import { TypeBadge } from '../../components/type-badge';
import { JsonLd } from '../../components/json-ld';
import { buildSourceJsonLd, buildMetaTags, escapeHtmlAttr, resolveOgImage } from '../../lib/seo';
import { formatDate } from '../../lib/time';
import { TilLayout } from './layout';

/**
 * Group items by date label (Today, Yesterday, or formatted date).
 */
function groupByDate(items: SourcePageProps['items']): { label: string; items: SourcePageProps['items'] }[] {
  if (items.length === 0) return [];

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const groups = new Map<string, SourcePageProps['items']>();

  for (const item of items) {
    const d = new Date(item.vouchedAt || item.createdAt);
    const itemDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    let key: string;

    if (itemDate.getTime() === today.getTime()) {
      key = 'Today';
    } else if (itemDate.getTime() === yesterday.getTime()) {
      key = 'Yesterday';
    } else {
      key = formatDate(item.vouchedAt || item.createdAt);
    }

    const arr = groups.get(key) ?? [];
    arr.push(item);
    groups.set(key, arr);
  }

  return [...groups.entries()].map(([label, items]) => ({ label, items }));
}

export function TilSourcePage(props: SourcePageProps) {
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

  const sourceTitle = settings.source_title || 'Today I Learned';
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
  const baseUrl = filterQs ? `${safeSourceUrl}/?${escapeHtmlAttr(filterQs)}` : `${safeSourceUrl}/`;
  const sep = filterQs ? '&amp;' : '?';
  if (currentPage > 1) {
    relLinks += `\n    <link rel="prev" href="${baseUrl}${sep}offset=${(currentPage - 2) * pagination.limit}">`;
  }
  if (currentPage < totalPages) {
    relLinks += `\n    <link rel="next" href="${baseUrl}${sep}offset=${currentPage * pagination.limit}">`;
  }

  const headContent = `${metaTags}${relLinks}`;

  const dateGroups = groupByDate(items);

  return (
    <TilLayout title={sourceTitle} head={headContent} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings}>
      <JsonLd data={jsonLd} />

      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-16 w-full flex flex-col">
        <FilterBar types={types} activeTypeId={filters.typeId} workspaces={workspaces} activeWorkspaceId={filters.workspaceId} activeTag={filters.tag} sort={filters.sort} counts={counts} query={filters.q} />

        <div id="source-loading" class="source-loading htmx-indicator">
          <span class="app-spinner" />
        </div>
        <div id="source-results">
          {items.length === 0 ? (
            <div class="empty-state">
              <svg class="empty-state-icon" width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="6" y="10" width="36" height="28" rx="3"/><path d="M6 22h12l3 4h6l3-4h12"/><path d="M20 18h8M22 14h4"/></svg>
              <p class="empty-state-title">No items found</p>
              <p class="empty-state-description">No {vocabulary.itemPlural} matching this filter.</p>
            </div>
          ) : (
            <>
              {dateGroups.map((group) => (
                <div class="mb-6">
                  <h3 class="text-xs font-semibold uppercase tracking-widest text-muted border-b border-border-subtle pb-1.5 mb-2">{group.label}</h3>
                  <div class="flex flex-col gap-0.5 md:gap-px">
                    {group.items.map((item) => (
                      <div class="rounded hover:bg-surface transition-colors">
                        <div class="px-2 py-1.5 sm:px-1 sm:py-1">
                          <div class="flex items-center gap-1.5 mb-0.5 text-xs text-muted">
                            <TypeBadge typeName={item.typeName} />
                            {item.tags && item.tags.length > 0 && (
                              <span class="inline-flex gap-1">
                                {item.tags.slice(0, 3).map((t) => (
                                  <a href={`/?tag=${encodeURIComponent(t)}`} class="text-[0.7rem] text-muted hover:text-primary transition-colors">#{t}</a>
                                ))}
                              </span>
                            )}
                          </div>
                          <p class="text-sm leading-snug text-text m-0">
                            {item.slug ? (
                              <a href={`/item/${item.slug}`} class="no-underline text-text hover:text-primary transition-colors">{item.keySummary}</a>
                            ) : (
                              item.keySummary
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <Pagination
                total={pagination.total}
                limit={pagination.limit}
                offset={pagination.offset}
                baseUrl={paginationBase}
              />
            </>
          )}
        </div>
      </div>
    </TilLayout>
  );
}
