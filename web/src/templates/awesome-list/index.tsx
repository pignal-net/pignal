import type { Template, PartialResultsProps } from '@pignal/templates';
import { getTemplateConfig } from '@pignal/templates';
import { AwesomeListSourcePage } from './source-page';
import { AwesomeListItemPost } from './item-post';
import { AwesomeListLayout } from './layout';
import { Pagination } from '../../components/pagination';
import { stripMarkdown } from '../../lib/markdown';
import templateStyles from './styles.css';

const config = getTemplateConfig('awesome-list');

/**
 * Custom PartialResults that renders compact links instead of cards.
 */
function AwesomeListPartialResults(props: PartialResultsProps) {
  if (props.items.length === 0) {
    return <p class="empty-state">No {config.vocabulary.vouched} {config.vocabulary.itemPlural} matching this filter.</p>;
  }

  return (
    <>
      <ul class="awesome-list-items">
        {props.items.map((item) => {
          const desc = stripMarkdown(item.content).slice(0, 120);
          return (
            <li class="awesome-list-item">
              {item.slug ? (
                <a href={`/item/${item.slug}`} class="awesome-list-item-title">{item.keySummary}</a>
              ) : (
                <span class="awesome-list-item-title">{item.keySummary}</span>
              )}
              {desc && (
                <span class="awesome-list-item-desc"> — {desc}{item.content.length > 120 ? '...' : ''}</span>
              )}
              {item.tags && item.tags.length > 0 && (
                <span class="awesome-list-item-tags">
                  {item.tags.slice(0, 3).map((t) => (
                    <a href={`/?tag=${encodeURIComponent(t)}`} class="item-tag">#{t}</a>
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

  styles: templateStyles,
};
