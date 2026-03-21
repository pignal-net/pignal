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

      <div class="source-page source-page--feed journal-page">
        <FilterBar types={types} activeTypeId={filters.typeId} workspaces={workspaces} activeWorkspaceId={filters.workspaceId} activeTag={filters.tag} sort={filters.sort} counts={counts} query={filters.q} />

        <div id="source-loading" class="source-loading htmx-indicator">
          <span class="app-spinner" />
        </div>
        <div id="source-results">
          {items.length === 0 ? (
            <p class="empty-state">No {vocabulary.itemPlural} matching this filter.</p>
          ) : (
            <>
              {monthGroups.map((group) => (
                <div class="journal-month-group">
                  <h2 class="journal-month-header">{group.label}</h2>
                  <div class="journal-entries">
                    {group.items.map((item) => {
                      const jd = journalDate(item.vouchedAt || item.createdAt);
                      const preview = stripMarkdown(item.content).slice(0, 160);

                      return (
                        <article class="journal-entry">
                          <div class="journal-date-badge">
                            <span class="journal-date-day">{jd.day}</span>
                            <span class="journal-date-month">{jd.month}</span>
                          </div>
                          <div class="journal-entry-content">
                            <h3>
                              {item.slug ? (
                                <a href={`/item/${item.slug}`}>{item.keySummary}</a>
                              ) : (
                                item.keySummary
                              )}
                            </h3>
                            <p class="journal-entry-preview">{preview}{item.content.length > 160 ? '...' : ''}</p>
                            {item.tags && item.tags.length > 0 && (
                              <div class="item-tags">
                                {item.tags.map((t) => (
                                  <a href={`/?tag=${encodeURIComponent(t)}`} class="item-tag">#{t}</a>
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
