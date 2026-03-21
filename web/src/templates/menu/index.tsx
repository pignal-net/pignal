import type { Template, PartialResultsProps, Item } from '@pignal/templates';
import { getTemplateConfig } from '@pignal/templates';
import { MenuSourcePage } from './source-page';
import { MenuItemPost } from './item-post';
import { MenuLayout } from './layout';
import { Pagination } from '../../components/pagination';
import { stripMarkdown } from '../../lib/markdown';
import templateStyles from './styles.css';

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
    return <p class="menu-empty">No {props.vocabulary.itemPlural} found.</p>;
  }

  const grouped = groupByType(props.items);

  return (
    <>
      <div class="menu-table-container">
        {Array.from(grouped.entries()).map(([typeName, sectionItems]) => (
          <div class="menu-section">
            <div class="menu-section-header">
              <span class="menu-section-name">{typeName}</span>
            </div>
            <div class="menu-items">
              {sectionItems.map((item) => {
                const price = extractPrice(item.content);
                const desc = getDescription(item.content, 80);
                return (
                  <a href={`/item/${item.slug}`} class="menu-row">
                    <div class="menu-row-left">
                      <span class="menu-item-name">{item.keySummary}</span>
                      <span class="menu-item-dots" />
                      {price && <span class="menu-item-price">{price}</span>}
                    </div>
                    {desc && <div class="menu-item-desc">{desc}</div>}
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

  styles: templateStyles,
};
