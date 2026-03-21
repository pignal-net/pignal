import type { SourcePageProps } from '@pignal/templates';
import type { Item } from '@pignal/templates';
import { FilterBar } from '../../components/type-sidebar';
import { Pagination } from '../../components/pagination';
import { JsonLd } from '../../components/json-ld';
import { buildSourceJsonLd, buildMetaTags, escapeHtmlAttr } from '../../lib/seo';
import { formatDate } from '../../lib/time';
import { stripMarkdown } from '../../lib/markdown';
import { IncidentsLayout } from './layout';

/* HTMX constants */
const HX_TARGET = '#source-results';

/** Determine severity level from type name (P0, P1, P2, P3) */
function getSeverityLevel(typeName: string): string {
  const lower = typeName.toLowerCase();
  if (lower.includes('p0') || lower.includes('critical')) return 'p0';
  if (lower.includes('p1') || lower.includes('major')) return 'p1';
  if (lower.includes('p2') || lower.includes('minor')) return 'p2';
  if (lower.includes('p3') || lower.includes('low')) return 'p3';
  return 'p3';
}

/** Map validation action label to a status CSS class */
function getStatusClass(actionLabel: string | null | undefined): string {
  if (!actionLabel) return '';
  const lower = actionLabel.toLowerCase();
  if (lower.includes('resolved') || lower.includes('fix')) return 'incidents-status--resolved';
  if (lower.includes('investigating') || lower.includes('false alarm')) return 'incidents-status--investigating';
  if (lower.includes('monitoring') || lower.includes('downgraded')) return 'incidents-status--monitoring';
  if (lower.includes('escalated') || lower.includes('upgraded')) return 'incidents-status--escalated';
  return 'incidents-status--default';
}

interface DateGroup {
  label: string;
  items: Item[];
}

/** Group items by their formatted date string, preserving order */
function groupByDate(items: Item[]): DateGroup[] {
  if (items.length === 0) return [];

  const groups: DateGroup[] = [];
  const map = new Map<string, Item[]>();

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

export function IncidentsSourcePage(props: SourcePageProps) {
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

  const sourceTitle = settings.source_title || 'Incident Log';
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
    <IncidentsLayout title={sourceTitle} head={headContent} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings}>
      <JsonLd data={jsonLd} />

      <div class="source-page source-page--feed">
        <FilterBar types={types} activeTypeId={filters.typeId} workspaces={workspaces} activeWorkspaceId={filters.workspaceId} activeTag={filters.tag} sort={filters.sort} counts={counts} query={filters.q} />

        <div id="source-loading" class="source-loading htmx-indicator">
          <span class="app-spinner" />
        </div>
        <div id="source-results">
          {items.length === 0 ? (
            <p class="incidents-empty">No {vocabulary.vouched} {vocabulary.itemPlural} matching this filter.</p>
          ) : (
            <>
              <div class="incidents-timeline">
                {groups.map((group) => (
                  <div class="incidents-date-group">
                    <div class="incidents-date-marker">{group.label}</div>
                    {group.items.map((item) => {
                      const severity = getSeverityLevel(item.typeName);
                      const statusClass = getStatusClass(item.validationActionLabel);
                      return (
                        <a href={`/item/${item.slug}`} class={`incidents-entry incidents-entry--${severity}`}>
                          <div class="incidents-entry-header">
                            <span class={`incidents-severity incidents-severity--${severity}`}>{item.typeName}</span>
                            {item.validationActionLabel && (
                              <span class={`incidents-status ${statusClass}`}>{item.validationActionLabel}</span>
                            )}
                            {item.workspaceName && (
                              <span class="incidents-service-badge">{item.workspaceName}</span>
                            )}
                          </div>
                          <div class="incidents-entry-title">
                            {item.keySummary}
                          </div>
                          <div class="incidents-entry-meta">
                            <time datetime={item.vouchedAt || item.createdAt}>
                              {formatDate(item.vouchedAt || item.createdAt)}
                            </time>
                          </div>
                          <p class="incidents-entry-preview">
                            {stripMarkdown(item.content).slice(0, 160)}{item.content.length > 160 ? '...' : ''}
                          </p>
                          {item.tags && item.tags.length > 0 && (
                            <div class="incidents-tags">
                              {item.tags.map((t) => (
                                <span class="incidents-tag">#{t}</span>
                              ))}
                            </div>
                          )}
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
    </IncidentsLayout>
  );
}
