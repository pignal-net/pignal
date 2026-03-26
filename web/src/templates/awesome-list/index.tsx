import type { Template, PartialResultsProps } from '@pignal/templates';
import { getTemplateConfig } from '@pignal/templates';
import { AwesomeListSourcePage } from './source-page';
import { AwesomeListItemPost } from './item-post';
import { AwesomeListLayout } from './layout';
import { Pagination } from '../../components/pagination';
import { EmptyState } from '../../components/empty-state';
import { stripMarkdown } from '../../lib/markdown';

const config = getTemplateConfig('awesome-list');

/**
 * Custom PartialResults that renders compact links with hover and external link indicators.
 */
function AwesomeListPartialResults(props: PartialResultsProps) {
  if (props.items.length === 0) {
    return (
      <EmptyState
        icon="search"
        title={`No ${props.vocabulary.itemPlural} found`}
        description="Try adjusting your search or filters."
      />
    );
  }

  return (
    <>
      <ul class="list-none p-0 m-0">
        {props.items.map((item, index) => {
          const desc = stripMarkdown(item.content).slice(0, 120);
          const isLast = index === props.items.length - 1;
          return (
            <li class={`card-hover py-2 md:py-2.5 px-2 rounded-lg leading-relaxed transition-colors hover:bg-primary/4 ${!isLast ? 'border-b border-dotted border-border-subtle' : ''}`}>
              {item.slug ? (
                <a href={`/item/${item.slug}`} class="font-medium text-primary text-sm no-underline hover:underline inline-flex items-center gap-1">
                  {item.keySummary}
                  <svg class="w-3 h-3 opacity-40 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17l9.2-9.2M17 17V7H7" /></svg>
                </a>
              ) : (
                <span class="font-medium text-primary text-sm">{item.keySummary}</span>
              )}
              {desc && (
                <span class="text-sm text-muted"> — {desc}</span>
              )}
              {item.tags && item.tags.length > 0 && (
                <span class="inline-flex gap-1 ml-1.5">
                  {item.tags.slice(0, 3).map((t) => (
                    <a href={`/?tag=${encodeURIComponent(t)}`} class="text-[0.7rem] text-muted hover:text-primary transition-colors">#{t}</a>
                  ))}
                </span>
              )}
            </li>
          );
        })}
      </ul>
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

export const awesomelistTemplate: Template = {
  SourcePage: AwesomeListSourcePage,
  ItemPost: AwesomeListItemPost,
  Layout: AwesomeListLayout,
  PartialResults: AwesomeListPartialResults,

  vocabulary: config.vocabulary,
  seo: config.seo,

  profile: config.profile,

  styles: '',
};
