import type { Template, PartialResultsProps, Item } from '@pignal/templates';
import { getTemplateConfig } from '@pignal/templates';
import { MenuSourcePage } from './source-page';
import { MenuItemPost } from './item-post';
import { MenuLayout } from './layout';
import { Pagination } from '../../components/pagination';
import { EmptyState } from '../../components/empty-state';
import { stripMarkdown } from '../../lib/markdown';

const config = getTemplateConfig('menu');

/** Extract a price-like string from content */
function extractPrice(content: string): string | null {
  const firstLine = content.split('\n')[0].trim();
  const priceMatch = firstLine.match(/\$[\d,.]+/);
  if (priceMatch) return priceMatch[0];
  return null;
}

function getDescription(content: string, maxLen: number): string {
  const plain = stripMarkdown(content);
  return plain.length > maxLen ? plain.slice(0, maxLen) + '...' : plain;
}

/** Group items by typeName for section rendering */
function groupByType(items: Item[]): Map<string, Item[]> {
  const groups = new Map<string, Item[]>();
  for (const item of items) {
    const key = item.typeName;
    const arr = groups.get(key) ?? [];
    arr.push(item);
    groups.set(key, arr);
  }
  return groups;
}

function MenuPartialResults(props: PartialResultsProps) {
  if (props.items.length === 0) {
    return (
      <EmptyState
        icon="search"
        title={`No ${props.vocabulary.itemPlural} found`}
        description="Try adjusting your filters or search terms."
      />
    );
  }

  const grouped = groupByType(props.items);

  return (
    <>
      <div class="flex flex-col gap-8">
        {Array.from(grouped.entries()).map(([typeName, sectionItems]) => (
          <div class="flex flex-col">
            <div class="py-3 border-b-2 border-primary mb-1">
              <span class="text-xl font-bold text-text tracking-wide">{typeName}</span>
            </div>
            <div class="flex flex-col">
              {sectionItems.map((item) => {
                const price = extractPrice(item.content);
                const desc = getDescription(item.content, 80);
                return (
                  <a href={`/item/${item.slug}`} class="group block py-3 no-underline text-inherit border-b border-border-subtle transition-colors hover:bg-surface-hover max-sm:p-3 max-sm:mb-2 max-sm:border max-sm:border-border-subtle max-sm:rounded-lg max-sm:bg-surface max-sm:hover:bg-surface-hover">
                    <div class="flex items-baseline gap-0 min-h-[1.4em]">
                      <span class="font-semibold text-base text-text shrink-0 group-hover:text-primary transition-colors">{item.keySummary}</span>
                      <span class="flex-1 border-b border-dotted border-border-subtle mx-2 min-w-4 relative -top-1 max-sm:hidden" />
                      {price && <span class="font-bold text-lg text-primary shrink-0 whitespace-nowrap">{price}</span>}
                    </div>
                    {desc && <div class="text-sm text-muted mt-0.5 leading-snug">{desc}</div>}
                  </a>
                );
              })}
            </div>
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

export const menuTemplate: Template = {
  SourcePage: MenuSourcePage,
  ItemPost: MenuItemPost,
  Layout: MenuLayout,
  PartialResults: MenuPartialResults,

  vocabulary: config.vocabulary,
  seo: config.seo,

  profile: config.profile,

  styles: '',
};
