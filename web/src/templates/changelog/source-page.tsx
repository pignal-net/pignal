import type { SourcePageProps } from '@pignal/templates';
import { FilterBar } from '../../components/type-sidebar';
import { Pagination } from '../../components/pagination';
import { JsonLd } from '../../components/json-ld';
import { buildSourceJsonLd, buildMetaTags, escapeHtmlAttr } from '../../lib/seo';
import { formatDate } from '../../lib/time';
import { stripMarkdown } from '../../lib/markdown';
import { ChangelogLayout } from './layout';

/* HTMX constants */
const HX_TARGET = '#source-results';

/** Map type name to CSS class for change type badge coloring */
function getTypeClass(typeName: string): string {
  const lower = typeName.toLowerCase();
  if (lower.includes('feature') || lower.includes('new')) return 'changelog-type-feature';
  if (lower.includes('fix') || lower.includes('bug')) return 'changelog-type-fix';
  if (lower.includes('breaking')) return 'changelog-type-breaking';
  if (lower.includes('improvement') || lower.includes('enhance')) return 'changelog-type-improvement';
  if (lower.includes('deprecat')) return 'changelog-type-deprecation';
  return 'changelog-type-default';
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
  } = props;

  const sourceTitle = settings.source_title || 'Changelog';
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

  const groups = groupByDate(items);

  return (
    <ChangelogLayout title={sourceTitle} head={headContent} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings}>
      <JsonLd data={jsonLd} />

      <div class="source-page source-page--feed">
        <FilterBar types={types} activeTypeId={filters.typeId} workspaces={workspaces} activeWorkspaceId={filters.workspaceId} activeTag={filters.tag} sort={filters.sort} counts={counts} query={filters.q} />

        <div id="source-loading" class="source-loading htmx-indicator">
          <span class="app-spinner" />
        </div>
        <div id="source-results">
          {items.length === 0 ? (
            <p class="changelog-empty">No {vocabulary.vouched} {vocabulary.itemPlural} matching this filter.</p>
          ) : (
            <>
              <div class="changelog-timeline">
                {groups.map((group) => (
                  <div class="changelog-date-group">
                    <div class="changelog-date-marker">{group.label}</div>
                    {group.items.map((item) => {
                      const typeClass = getTypeClass(item.typeName);
                      return (
                        <a href={`/item/${item.slug}`} class="changelog-entry">
                          <div class="changelog-entry-body">
                            <div class="changelog-entry-meta">
                              <span class={`changelog-type-badge ${typeClass}`}>{item.typeName}</span>
                              {item.workspaceName && (
                                <span class="changelog-product-badge">{item.workspaceName}</span>
                              )}
                            </div>
                            <div class="changelog-entry-title">
                              {item.keySummary}
                            </div>
                            <p class="changelog-entry-preview">
                              {stripMarkdown(item.content).slice(0, 160)}{item.content.length > 160 ? '...' : ''}
                            </p>
                            {item.tags && item.tags.length > 0 && (
                              <div class="changelog-tags">
                                {item.tags.map((t) => (
                                  <span class="changelog-tag">#{t}</span>
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
              />
            </>
          )}
        </div>
      </div>
    </ChangelogLayout>
  );
}
