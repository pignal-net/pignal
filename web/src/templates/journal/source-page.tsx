import type { SourcePageProps } from '@pignal/templates';
import { FilterBar } from '../../components/type-sidebar';
import { Pagination } from '../../components/pagination';
import { JsonLd } from '../../components/json-ld';
import { buildSourceJsonLd, buildMetaTags, escapeHtmlAttr } from '../../lib/seo';
import { stripMarkdown } from '../../lib/markdown';
import { JournalLayout } from './layout';

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Format a date into large journal-style components: day number + month abbreviation.
 */
function journalDate(dateStr: string): { day: string; month: string; year: number } {
  const d = new Date(dateStr);
  return {
    day: String(d.getUTCDate()),
    month: MONTHS_SHORT[d.getUTCMonth()],
    year: d.getUTCFullYear(),
  };
}

/**
 * Group items by month-year for large date headers.
 */
function groupByMonth(items: SourcePageProps['items']): { label: string; items: SourcePageProps['items'] }[] {
  if (items.length === 0) return [];

  const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const groups = new Map<string, SourcePageProps['items']>();

  for (const item of items) {
    const d = new Date(item.vouchedAt || item.createdAt);
    const key = `${MONTHS_FULL[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
    const arr = groups.get(key) ?? [];
    arr.push(item);
    groups.set(key, arr);
  }

  return [...groups.entries()].map(([label, items]) => ({ label, items }));
}

export function JournalSourcePage(props: SourcePageProps) {
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

  const sourceTitle = settings.source_title || 'Journal';
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
  const baseUrl = filterQs ? `${safeSourceUrl}/?${escapeHtmlAttr(filterQs)}` : `${safeSourceUrl}/`;
  const sep = filterQs ? '&amp;' : '?';
  if (currentPage > 1) {
    relLinks += `\n    <link rel="prev" href="${baseUrl}${sep}offset=${(currentPage - 2) * pagination.limit}">`;
  }
  if (currentPage < totalPages) {
    relLinks += `\n    <link rel="next" href="${baseUrl}${sep}offset=${currentPage * pagination.limit}">`;
  }

  const headContent = `${metaTags}${relLinks}`;

  const monthGroups = groupByMonth(items);

  return (
    <JournalLayout title={sourceTitle} head={headContent} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings}>
      <JsonLd data={jsonLd} />

      <div class="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-16 w-full flex flex-col">
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
              {monthGroups.map((group) => (
                <div class="mb-8">
                  <h2 class="text-xl md:text-2xl font-light tracking-wide text-muted border-b border-border-subtle pb-2 mb-4">{group.label}</h2>
                  <div class="flex flex-col gap-3 md:gap-2">
                    {group.items.map((item) => {
                      const jd = journalDate(item.vouchedAt || item.createdAt);
                      const preview = stripMarkdown(item.content).slice(0, 160);

                      return (
                        <article class="flex gap-3 sm:gap-4 p-2 sm:p-3 rounded-md border border-transparent hover:border-border hover:bg-surface transition-all">
                          <div class="flex flex-col items-center justify-center shrink-0 w-10 sm:w-12 pt-0.5">
                            <span class="text-xl sm:text-2xl font-semibold leading-none text-text">{jd.day}</span>
                            <span class="text-[0.65rem] uppercase tracking-widest text-muted mt-0.5">{jd.month}</span>
                          </div>
                          <div class="flex-1 min-w-0">
                            <h3 class="text-base font-medium leading-snug mb-1">
                              {item.slug ? (
                                <a href={`/item/${item.slug}`} class="no-underline text-text hover:text-primary transition-colors">{item.keySummary}</a>
                              ) : (
                                item.keySummary
                              )}
                            </h3>
                            <p class="text-sm text-muted m-0 leading-relaxed line-clamp-2">{preview}{item.content.length > 160 ? '...' : ''}</p>
                            {item.tags && item.tags.length > 0 && (
                              <div class="flex flex-wrap gap-1.5 mt-1.5">
                                {item.tags.map((t) => (
                                  <a href={`/?tag=${encodeURIComponent(t)}`} class="text-[0.7rem] text-primary hover:underline">#{t}</a>
                                ))}
                              </div>
                            )}
                          </div>
                        </article>
                      );
                    })}
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
    </JournalLayout>
  );
}
