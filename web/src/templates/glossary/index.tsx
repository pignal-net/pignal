import type { Template, PartialResultsProps, Item } from '@pignal/templates';
import { getTemplateConfig } from '@pignal/templates';
import { GlossarySourcePage } from './source-page';
import { GlossaryItemPost } from './item-post';
import { GlossaryLayout } from './layout';
import { Pagination } from '../../components/pagination';
import { TypeBadge } from '../../components/type-badge';
import { stripMarkdown } from '../../lib/markdown';
import templateStyles from './styles.css';

const config = getTemplateConfig('glossary');

/** Extract the term name (before any dash separator) from keySummary */
function getTermName(keySummary: string): string {
  const dashIdx = keySummary.indexOf(' \u2014 ');
  if (dashIdx > 0) return keySummary.slice(0, dashIdx);
  const hyphenIdx = keySummary.indexOf(' - ');
  if (hyphenIdx > 0) return keySummary.slice(0, hyphenIdx);
  return keySummary;
}

function getDefinition(content: string, maxLen: number): string {
  const plain = stripMarkdown(content);
  return plain.length > maxLen ? plain.slice(0, maxLen) + '...' : plain;
}

function getFirstLetter(keySummary: string): string {
  const ch = keySummary.trim().charAt(0).toUpperCase();
  return /[A-Z]/.test(ch) ? ch : '#';
}

/** Group items alphabetically and sort */
function groupAlphabetically(items: Item[]): Map<string, Item[]> {
  const groups = new Map<string, Item[]>();
  for (const item of items) {
    const letter = getFirstLetter(item.keySummary);
    const arr = groups.get(letter) ?? [];
    arr.push(item);
    groups.set(letter, arr);
  }
  // Sort keys alphabetically
  const sorted = new Map<string, Item[]>();
  const keys = Array.from(groups.keys()).sort((a, b) => {
    if (a === '#') return 1;
    if (b === '#') return -1;
    return a.localeCompare(b);
  });
  for (const key of keys) {
    sorted.set(key, groups.get(key)!);
  }
  return sorted;
}

function GlossaryPartialResults(props: PartialResultsProps) {
  if (props.items.length === 0) {
    return <p class="glossary-empty">No {props.vocabulary.itemPlural} found.</p>;
  }

  const grouped = groupAlphabetically(props.items);

  return (
    <>
      <div class="glossary-term-list">
        {Array.from(grouped.entries()).map(([letter, letterItems]) => (
          <div class="glossary-letter-group" id={`letter-${letter}`}>
            <div class="glossary-letter-header">{letter}</div>
            <div class="glossary-terms">
              {letterItems.map((item) => {
                const termName = getTermName(item.keySummary);
                const definition = getDefinition(item.content, 100);
                return (
                  <a href={`/item/${item.slug}`} class="glossary-term-row">
                    <div class="glossary-term-left">
                      <span class="glossary-term-name">{termName}</span>
                      <TypeBadge typeName={item.typeName} />
                    </div>
                    <div class="glossary-term-def">{definition}</div>
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

export const glossaryTemplate: Template = {
  SourcePage: GlossarySourcePage,
  ItemPost: GlossaryItemPost,
  Layout: GlossaryLayout,
  PartialResults: GlossaryPartialResults,

  vocabulary: config.vocabulary,
  seo: config.seo,

  profile: config.profile,

  styles: templateStyles,
};
