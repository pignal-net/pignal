/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */
import type { Template, PartialResultsProps } from '../types';
import { WikiSourcePage } from './source-page';
import { WikiItemPost } from './item-post';
import { WikiLayout } from './layout';
import { Pagination } from '@pignal/render/components/pagination';
import { EmptyState } from '@pignal/render/components/empty-state';
import { stripMarkdown } from '@pignal/render/lib/markdown';

import { wikiConfig as config } from './config';

function WikiPartialResults(props: PartialResultsProps) {
  if (props.items.length === 0) {
    return (
      <EmptyState
        icon="file"
        title={`No ${props.vocabulary.itemPlural} found`}
        description="Try adjusting your filters or search query."
      />
    );
  }

  // Group items alphabetically
  const grouped: Record<string, typeof props.items> = {};
  for (const item of props.items) {
    const letter = (item.keySummary[0] || '#').toUpperCase();
    const key = /[A-Z]/.test(letter) ? letter : '#';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  }
  const sortedLetters = Object.keys(grouped).sort();

  return (
    <>
      <div class="flex flex-col">
        {sortedLetters.map((letter) => (
          <>
            <div class="text-lg font-bold text-primary pt-2 pb-1 mt-5 first:mt-0 border-b-2 border-primary mb-2" id={`letter-${letter}`}>{letter}</div>
            {grouped[letter].map((item) => {
              const desc = stripMarkdown(item.content).slice(0, 100);
              return (
                <div class="flex items-baseline max-sm:flex-col gap-3 max-sm:gap-1 py-2.5 px-2 border-b border-border-subtle rounded-lg transition-colors hover:bg-primary/4">
                  <div class="flex-1 min-w-0">
                    <a href={`/item/${item.slug}`} class="no-underline text-text font-medium text-[0.95rem] hover:text-primary transition-colors">{item.keySummary}</a>
                    {desc && <div class="text-sm text-muted mt-0.5 line-clamp-1">{desc}</div>}
                  </div>
                  <div class="flex items-center gap-2 shrink-0 text-xs text-muted max-sm:order-first">
                    {item.typeName && <span class="text-[0.72rem] px-2 py-0.5 rounded-full bg-primary/12 text-primary font-medium whitespace-nowrap">{item.typeName}</span>}
                    {item.workspaceName && <span>{item.workspaceName}</span>}
                  </div>
                </div>
              );
            })}
          </>
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

export const wikiTemplate: Template = {
  SourcePage: WikiSourcePage,
  ItemPost: WikiItemPost,
  Layout: WikiLayout,
  PartialResults: WikiPartialResults,

  vocabulary: config.vocabulary,
  seo: config.seo,

  profile: config.profile,

  styles: '',
};
