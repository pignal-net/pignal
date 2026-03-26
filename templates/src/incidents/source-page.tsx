/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */
import type { SourcePageProps } from '../types';
import type { Item } from '../types';
import { FilterBar } from '@pignal/render/components/type-sidebar';
import { Pagination } from '@pignal/render/components/pagination';
import { EmptyState } from '@pignal/render/components/empty-state';
import { JsonLd } from '@pignal/render/components/json-ld';
import { buildSourceJsonLd, buildMetaTags, escapeHtmlAttr, resolveOgImage } from '@pignal/render/lib/seo';
import { formatDate } from '@pignal/render/lib/time';
import { stripMarkdown } from '@pignal/render/lib/markdown';
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

/** Map severity to badge Tailwind classes using design tokens */
function getSeverityClasses(severity: string): string {
  switch (severity) {
    case 'p0': return 'bg-error text-primary-inverse';
    case 'p1': return 'bg-error/70 text-primary-inverse';
    case 'p2': return 'bg-warning text-primary-inverse';
    case 'p3': return 'bg-muted/80 text-primary-inverse';
    default: return 'bg-muted/80 text-primary-inverse';
  }
}

/** Map severity to left border Tailwind classes */
function getSeverityBorderClass(severity: string): string {
  switch (severity) {
    case 'p0': return 'border-l-error';
    case 'p1': return 'border-l-error/70';
    case 'p2': return 'border-l-warning';
    case 'p3': return 'border-l-muted/50';
    default: return 'border-l-muted/50';
  }
}

/** Map validation action label to status Tailwind classes using design tokens */
function getStatusClasses(actionLabel: string | null | undefined): string {
  if (!actionLabel) return '';
  const lower = actionLabel.toLowerCase();
  if (lower.includes('resolved') || lower.includes('fix')) return 'bg-success-bg text-success border border-success-border';
  if (lower.includes('investigating') || lower.includes('false alarm')) return 'bg-error-bg text-error border border-error-border';
  if (lower.includes('monitoring') || lower.includes('downgraded')) return 'bg-warning-bg text-warning border border-warning-border';
  if (lower.includes('escalated') || lower.includes('upgraded')) return 'bg-error-bg text-error border border-error-border';
  return 'bg-surface-raised text-muted border border-border';
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
    t,
  } = props;

  const sourceTitle = settings.source_title || 'Incident Log';
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
    <IncidentsLayout title={sourceTitle} head={headContent} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings} t={props.t} locale={props.locale} defaultLocale={props.defaultLocale} visitor={props.visitor}>
      <JsonLd data={jsonLd} />

      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-16 w-full flex flex-col">
        <FilterBar types={types} activeTypeId={filters.typeId} workspaces={workspaces} activeWorkspaceId={filters.workspaceId} activeTag={filters.tag} sort={filters.sort} counts={counts} query={filters.q} t={t} />

        <div id="source-loading" class="source-loading htmx-indicator">
          <span class="app-spinner" />
        </div>
        <div id="source-results" aria-live="polite">
          {items.length === 0 ? (
            <EmptyState
              icon="inbox"
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
                      const severity = getSeverityLevel(item.typeName);
                      const severityClasses = getSeverityClasses(severity);
                      const borderClass = getSeverityBorderClass(severity);
                      const statusClasses = getStatusClasses(item.validationActionLabel);
                      return (
                        <a href={`/item/${item.slug}`} class={`card-hover relative block p-3 sm:p-4 mb-2 border border-border-subtle shadow-card border-l-[3px] ${borderClass} rounded-xl bg-surface no-underline text-inherit hover:shadow-card-hover hover:border-primary transition-all`}>
                          <div class="flex items-center gap-2 flex-wrap mb-1.5 sm:flex-nowrap">
                            <span class={`inline-block px-2 py-0.5 rounded text-[0.72rem] font-semibold tracking-tight whitespace-nowrap ${severityClasses}`}>{item.typeName}</span>
                            {item.validationActionLabel && (
                              <span class={`inline-block px-1.5 py-0.5 rounded text-[0.7rem] font-semibold tracking-tight whitespace-nowrap ${statusClasses}`}>{item.validationActionLabel}</span>
                            )}
                            {item.workspaceName && (
                              <span class="inline-block px-1.5 py-0.5 rounded text-[0.72rem] font-medium bg-surface-raised text-text">{item.workspaceName}</span>
                            )}
                          </div>
                          <div class="text-[0.95rem] font-semibold leading-snug mb-1 text-text">
                            {item.keySummary}
                          </div>
                          <div class="flex items-center gap-2 flex-wrap text-xs text-muted">
                            <time datetime={item.vouchedAt || item.createdAt}>
                              {formatDate(item.vouchedAt || item.createdAt)}
                            </time>
                          </div>
                          <p class="text-[0.82rem] text-muted m-0 mt-1 leading-relaxed line-clamp-2">
                            {stripMarkdown(item.content).slice(0, 160)}
                          </p>
                          {item.tags && item.tags.length > 0 && (
                            <div class="flex flex-wrap gap-1.5 mt-1.5">
                              {item.tags.map((t) => (
                                <span class="text-[0.72rem] text-primary">#{t}</span>
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
                t={t}
              />
            </>
          )}
        </div>
      </div>
    </IncidentsLayout>
  );
}
