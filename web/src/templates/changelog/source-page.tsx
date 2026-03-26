import type { SourcePageProps } from '@pignal/templates';
import { FilterBar } from '../../components/type-sidebar';
import { Pagination } from '../../components/pagination';
import { EmptyState } from '../../components/empty-state';
import { JsonLd } from '../../components/json-ld';
import { buildSourceJsonLd, buildMetaTags, escapeHtmlAttr, resolveOgImage } from '../../lib/seo';
import { formatDate } from '../../lib/time';
import { stripMarkdown } from '../../lib/markdown';
import { ChangelogLayout } from './layout';

/* HTMX constants */
const HX_TARGET = '#source-results';

/** Map type name to design-token-based badge classes */
function getTypeBadgeClasses(typeName: string): string {
  const lower = typeName.toLowerCase();
  if (lower.includes('feature') || lower.includes('new')) return 'bg-primary text-primary-inverse';
  if (lower.includes('fix') || lower.includes('bug')) return 'bg-success text-primary-inverse';
  if (lower.includes('breaking')) return 'bg-error text-primary-inverse';
  if (lower.includes('improvement') || lower.includes('enhance')) return 'bg-info text-primary-inverse';
  if (lower.includes('deprecat')) return 'bg-warning text-primary-inverse';
  return 'bg-muted/60 text-primary-inverse';
}

interface DateGroup {
  label: string;
  items: SourcePageProps['items'];
}

/** Group items by their formatted date string, preserving order */
function groupByDate(items: SourcePageProps['items']): DateGroup[] {
  if (items.length === 0) return [];

  const groups: DateGroup[] = [];
  const map = new Map<string, SourcePageProps['items']>();

  for (const item of items) {
    const date = formatDate(item.vouchedAt || item.createdAt);
    const arr = map.get(date);
    if (arr) {
      arr.push(item);
    } else {
      const newArr = [item];
      map.set(date, newArr);
      groups.push({ label: date, items: newArr });
    }
  }

  return groups;
}

export function ChangelogSourcePage(props: SourcePageProps) {
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

  const sourceTitle = settings.source_title || 'Changelog';
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

  const groups = groupByDate(items);

  return (
    <ChangelogLayout title={sourceTitle} head={headContent} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings}>
      <JsonLd data={jsonLd} />

      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-16 w-full flex flex-col">
        <FilterBar types={types} activeTypeId={filters.typeId} workspaces={workspaces} activeWorkspaceId={filters.workspaceId} activeTag={filters.tag} sort={filters.sort} counts={counts} query={filters.q} t={t} />

        <div id="source-loading" class="source-loading htmx-indicator">
          <span class="app-spinner" />
        </div>
        <div id="source-results" aria-live="polite">
          {items.length === 0 ? (
            <EmptyState
              icon="file"
              title={`No ${vocabulary.itemPlural} found`}
              description={`No ${vocabulary.vouched} ${vocabulary.itemPlural} matching this filter.`}
            />
          ) : (
            <>
              <div class="relative pl-8 my-4 sm:border-l-[3px] sm:border-border-subtle sm:ml-2">
                {groups.map((group) => (
                  <div class="relative mb-6">
                    <div class="relative text-xs font-semibold text-muted uppercase tracking-wider py-1 mb-3 before:content-[''] before:absolute before:hidden sm:before:block before:-left-[calc(2rem+5.5px)] before:top-1/2 before:-translate-y-1/2 before:w-[11px] before:h-[11px] before:rounded-full before:bg-border before:border-2 before:border-surface before:z-10">{group.label}</div>
                    {group.items.map((item) => {
                      const badgeClasses = getTypeBadgeClasses(item.typeName);
                      return (
                        <a href={`/item/${item.slug}`} class="card-hover relative block p-3 sm:p-4 mb-2 border border-border-subtle shadow-card rounded-xl bg-surface no-underline text-inherit hover:shadow-card-hover hover:border-primary transition-all before:content-[''] before:absolute before:hidden sm:before:block before:-left-[calc(2rem+3.5px)] before:top-4 before:-translate-x-1/2 before:w-[7px] before:h-[7px] before:rounded-full before:bg-muted before:z-10">
                          <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 flex-wrap text-xs text-muted mb-1">
                              <span class={`inline-block px-2 py-0.5 rounded text-[0.72rem] font-semibold tracking-tight whitespace-nowrap ${badgeClasses}`}>{item.typeName}</span>
                              {item.workspaceName && (
                                <span class="inline-block px-1.5 py-0.5 rounded text-[0.72rem] font-medium bg-surface-raised text-text">{item.workspaceName}</span>
                              )}
                            </div>
                            <div class="text-[0.95rem] font-semibold leading-snug mb-1">
                              {item.keySummary}
                            </div>
                            <p class="text-[0.82rem] text-muted m-0 leading-relaxed line-clamp-2">
                              {stripMarkdown(item.content).slice(0, 160)}
                            </p>
                            {item.tags && item.tags.length > 0 && (
                              <div class="flex flex-wrap gap-1.5 mt-1.5">
                                {item.tags.map((t) => (
                                  <span class="text-[0.72rem] text-primary">#{t}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </a>
                      );
                    })}
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
    </ChangelogLayout>
  );
}
