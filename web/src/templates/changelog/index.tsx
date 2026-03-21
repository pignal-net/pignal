import type { Template, PartialResultsProps } from '@pignal/templates';
import { getTemplateConfig } from '@pignal/templates';
import { ChangelogSourcePage } from './source-page';
import { ChangelogItemPost } from './item-post';
import { ChangelogLayout } from './layout';
import { Pagination } from '../../components/pagination';
import { formatDate } from '../../lib/time';
import { stripMarkdown } from '../../lib/markdown';
import templateStyles from './styles.css';

const config = getTemplateConfig('changelog');

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
  items: PartialResultsProps['items'];
}

function groupByDate(items: PartialResultsProps['items']): DateGroup[] {
  if (items.length === 0) return [];

  const groups: DateGroup[] = [];
  const map = new Map<string, PartialResultsProps['items']>();

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

function ChangelogPartialResults(props: PartialResultsProps) {
  const { vocabulary } = props;

  if (props.items.length === 0) {
    return <p class="changelog-empty">No {vocabulary.vouched} {vocabulary.itemPlural} matching this filter.</p>;
  }

  const groups = groupByDate(props.items);

  return (
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
        total={props.total}
        limit={props.limit}
        offset={props.offset}
        baseUrl={props.paginationBase}
        htmxTarget="#source-results"
      />
    </>
  );
}

export const changelogTemplate: Template = {
  SourcePage: ChangelogSourcePage,
  ItemPost: ChangelogItemPost,
  Layout: ChangelogLayout,
  PartialResults: ChangelogPartialResults,

  vocabulary: config.vocabulary,
  seo: config.seo,

  profile: config.profile,

  styles: templateStyles,
};
