import type { Template, PartialResultsProps } from '@pignal/templates';
import { getTemplateConfig } from '@pignal/templates';
import { ChangelogSourcePage } from './source-page';
import { ChangelogItemPost } from './item-post';
import { ChangelogLayout } from './layout';
import { Pagination } from '../../components/pagination';
import { formatDate } from '../../lib/time';
import { stripMarkdown } from '../../lib/markdown';

const config = getTemplateConfig('changelog');

/** Map type name to Tailwind badge classes */
function getTypeBadgeClasses(typeName: string): string {
  const lower = typeName.toLowerCase();
  if (lower.includes('feature') || lower.includes('new')) return 'bg-primary/85 text-white';
  if (lower.includes('fix') || lower.includes('bug')) return 'bg-emerald-600/85 text-white';
  if (lower.includes('breaking')) return 'bg-red-600/85 text-white';
  if (lower.includes('improvement') || lower.includes('enhance')) return 'bg-primary/60 text-white';
  if (lower.includes('deprecat')) return 'bg-red-600/50 text-white';
  return 'bg-muted/60 text-white';
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
              const badgeClasses = getTypeBadgeClasses(item.typeName);
              return (
                <a href={`/item/${item.slug}`} class="relative block p-3 sm:p-4 mb-2 border border-border rounded-md bg-surface no-underline text-inherit hover:shadow-md hover:border-primary transition-all">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap text-xs text-muted mb-1">
                      <span class={`inline-block px-2 py-0.5 rounded text-[0.72rem] font-semibold tracking-tight whitespace-nowrap ${badgeClasses}`}>{item.typeName}</span>
                      {item.workspaceName && (
                        <span class="inline-block px-1.5 py-0.5 rounded text-[0.72rem] font-medium bg-muted/20 text-text">{item.workspaceName}</span>
                      )}
                    </div>
                    <div class="text-[0.95rem] font-semibold leading-snug mb-1">
                      {item.keySummary}
                    </div>
                    <p class="text-[0.82rem] text-muted m-0 leading-relaxed line-clamp-2">
                      {stripMarkdown(item.content).slice(0, 160)}{item.content.length > 160 ? '...' : ''}
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

  styles: '',
};
