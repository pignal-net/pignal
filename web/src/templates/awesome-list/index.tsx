import type { Template, PartialResultsProps } from '@pignal/templates';
import { getTemplateConfig } from '@pignal/templates';
import { AwesomeListSourcePage } from './source-page';
import { AwesomeListItemPost } from './item-post';
import { AwesomeListLayout } from './layout';
import { Pagination } from '../../components/pagination';
import { stripMarkdown } from '../../lib/markdown';

const config = getTemplateConfig('awesome-list');

/**
 * Custom PartialResults that renders compact links instead of cards.
 */
function AwesomeListPartialResults(props: PartialResultsProps) {
  if (props.items.length === 0) {
    return <p class="text-center py-12 text-muted">No {config.vocabulary.vouched} {config.vocabulary.itemPlural} matching this filter.</p>;
  }

  return (
    <>
      <ul class="list-none p-0 m-0">
        {props.items.map((item, index) => {
          const desc = stripMarkdown(item.content).slice(0, 120);
          const isLast = index === props.items.length - 1;
          return (
            <li class={`py-1.5 md:py-2 leading-relaxed ${!isLast ? 'border-b border-dotted border-border' : ''}`}>
              {item.slug ? (
                <a href={`/item/${item.slug}`} class="font-medium text-primary text-sm no-underline hover:underline">{item.keySummary}</a>
              ) : (
                <span class="font-medium text-primary text-sm">{item.keySummary}</span>
              )}
              {desc && (
                <span class="text-sm text-muted"> — {desc}{item.content.length > 120 ? '...' : ''}</span>
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
