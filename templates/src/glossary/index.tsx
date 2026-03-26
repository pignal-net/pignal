/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */
import type { Template, PartialResultsProps, Item } from '../types';
import { GlossarySourcePage } from './source-page';
import { GlossaryItemPost } from './item-post';
import { GlossaryLayout } from './layout';
import { Pagination } from '@pignal/render/components/pagination';
import { EmptyState } from '@pignal/render/components/empty-state';
import { TypeBadge } from '@pignal/render/components/type-badge';
import { stripMarkdown } from '@pignal/render/lib/markdown';

import { glossaryConfig as config } from './config';

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
    return (
      <EmptyState
        icon="search"
        title={`No ${props.vocabulary.itemPlural} found`}
        description="Try adjusting your filters or search query."
      />
    );
  }

  const grouped = groupAlphabetically(props.items);

  return (
    <>
      <div class="flex flex-col gap-6">
        {Array.from(grouped.entries()).map(([letter, letterItems]) => (
          <div class="scroll-mt-4" id={`letter-${letter}`}>
            <div class="sticky top-0 z-[5] py-1.5 text-2xl font-extrabold text-muted bg-bg-page border-b-2 border-border-subtle mb-1">{letter}</div>
            <div class="flex flex-col">
              {letterItems.map((item) => {
                const termName = getTermName(item.keySummary);
                const definition = getDefinition(item.content, 100);
                return (
                  <a href={`/item/${item.slug}`} class="flex items-start max-sm:flex-col gap-4 max-sm:gap-1 px-3 py-3 no-underline text-inherit border-b border-border-subtle rounded-lg transition-colors hover:bg-surface-hover">
                    <div class="flex items-center gap-2 shrink-0 min-w-[180px] lg:min-w-[220px] max-sm:min-w-0">
                      <span class="font-semibold text-lg text-text">{termName}</span>
                      <TypeBadge typeName={item.typeName} />
                    </div>
                    <div class="text-[0.9rem] text-muted leading-relaxed flex-1 max-sm:text-sm">{definition}</div>
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

  styles: '',
};
