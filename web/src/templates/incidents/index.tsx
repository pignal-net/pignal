import type { Template, PartialResultsProps } from '@pignal/templates';
import type { Item } from '@pignal/templates';
import { getTemplateConfig } from '@pignal/templates';
import { IncidentsSourcePage } from './source-page';
import { IncidentsItemPost } from './item-post';
import { IncidentsLayout } from './layout';
import { Pagination } from '../../components/pagination';
import { formatDate } from '../../lib/time';
import { stripMarkdown } from '../../lib/markdown';

const config = getTemplateConfig('incidents');

/** Determine severity level from type name (P0, P1, P2, P3) */
function getSeverityLevel(typeName: string): string {
  const lower = typeName.toLowerCase();
  if (lower.includes('p0') || lower.includes('critical')) return 'p0';
  if (lower.includes('p1') || lower.includes('major')) return 'p1';
  if (lower.includes('p2') || lower.includes('minor')) return 'p2';
  if (lower.includes('p3') || lower.includes('low')) return 'p3';
  return 'p3';
}

/** Map severity to badge Tailwind classes */
function getSeverityClasses(severity: string): string {
  switch (severity) {
    case 'p0': return 'bg-red-600 text-white';
    case 'p1': return 'bg-red-500/70 text-white';
    case 'p2': return 'bg-primary/70 text-white';
    case 'p3': return 'bg-muted/80 text-white';
    default: return 'bg-muted/80 text-white';
  }
}

/** Map severity to left border Tailwind classes */
function getSeverityBorderClass(severity: string): string {
  switch (severity) {
    case 'p0': return 'border-l-red-600';
    case 'p1': return 'border-l-red-500/70';
    case 'p2': return 'border-l-primary/70';
    case 'p3': return 'border-l-muted/50';
    default: return 'border-l-muted/50';
  }
}

/** Map validation action label to status Tailwind classes */
function getStatusClasses(actionLabel: string | null | undefined): string {
  if (!actionLabel) return '';
  const lower = actionLabel.toLowerCase();
  if (lower.includes('resolved') || lower.includes('fix')) return 'bg-emerald-500/20 text-emerald-600';
  if (lower.includes('investigating') || lower.includes('false alarm')) return 'bg-red-500/15 text-red-600';
  if (lower.includes('monitoring') || lower.includes('downgraded')) return 'bg-primary/15 text-primary';
  if (lower.includes('escalated') || lower.includes('upgraded')) return 'bg-red-500/15 text-red-600';
  return 'bg-muted/15 text-muted';
}

interface DateGroup {
  label: string;
  items: Item[];
}

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

function IncidentsPartialResults(props: PartialResultsProps) {
  const { vocabulary } = props;

  if (props.items.length === 0) {
    return <p class="text-center py-12 text-muted">No {vocabulary.vouched} {vocabulary.itemPlural} matching this filter.</p>;
  }

  const groups = groupByDate(props.items);

  return (
    <>
      <div class="relative pl-8 my-4 sm:border-l-[3px] sm:border-border sm:ml-2">
        {groups.map((group) => (
          <div class="relative mb-6">
            <div class="relative text-xs font-semibold text-muted uppercase tracking-wider py-1 mb-3">{group.label}</div>
            {group.items.map((item) => {
              const severity = getSeverityLevel(item.typeName);
              const severityClasses = getSeverityClasses(severity);
              const borderClass = getSeverityBorderClass(severity);
              const statusClasses = getStatusClasses(item.validationActionLabel);
              return (
                <a href={`/item/${item.slug}`} class={`relative block p-3 sm:p-4 mb-2 border border-border border-l-[3px] ${borderClass} rounded-md bg-surface no-underline text-inherit hover:shadow-md hover:border-primary transition-all`}>
                  <div class="flex items-center gap-2 flex-wrap mb-1.5">
                    <span class={`inline-block px-2 py-0.5 rounded text-[0.72rem] font-semibold tracking-tight whitespace-nowrap ${severityClasses}`}>{item.typeName}</span>
                    {item.validationActionLabel && (
                      <span class={`inline-block px-1.5 py-0.5 rounded text-[0.7rem] font-semibold tracking-tight whitespace-nowrap ${statusClasses}`}>{item.validationActionLabel}</span>
                    )}
                    {item.workspaceName && (
                      <span class="inline-block px-1.5 py-0.5 rounded text-[0.72rem] font-medium bg-muted/20 text-text">{item.workspaceName}</span>
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
                    {stripMarkdown(item.content).slice(0, 160)}{item.content.length > 160 ? '...' : ''}
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
        total={props.total}
        limit={props.limit}
        offset={props.offset}
        baseUrl={props.paginationBase}
        htmxTarget="#source-results"
      />
    </>
  );
}

export const incidentsTemplate: Template = {
  SourcePage: IncidentsSourcePage,
  ItemPost: IncidentsItemPost,
  Layout: IncidentsLayout,
  PartialResults: IncidentsPartialResults,

  vocabulary: config.vocabulary,
  seo: config.seo,

  profile: config.profile,

  styles: '',
};
