import type { Template, PartialResultsProps } from '@pignal/templates';
import type { Item } from '@pignal/templates';
import { getTemplateConfig } from '@pignal/templates';
import { IncidentsSourcePage } from './source-page';
import { IncidentsItemPost } from './item-post';
import { IncidentsLayout } from './layout';
import { Pagination } from '../../components/pagination';
import { formatDate } from '../../lib/time';
import { stripMarkdown } from '../../lib/markdown';
import templateStyles from './styles.css';

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
    return <p class="incidents-empty">No {vocabulary.vouched} {vocabulary.itemPlural} matching this filter.</p>;
  }

  const groups = groupByDate(props.items);

  return (
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

  styles: templateStyles,
};
