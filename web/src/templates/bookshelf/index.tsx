import type { Template, PartialResultsProps } from '@pignal/templates';
import { getTemplateConfig } from '@pignal/templates';
import { BookshelfSourcePage, BookCard } from './source-page';
import { BookshelfItemPost } from './item-post';
import { BookshelfLayout } from './layout';
import { Pagination } from '../../components/pagination';
import templateStyles from './styles.css';

const config = getTemplateConfig('bookshelf');

const HX_TARGET = '#source-results';

function BookshelfPartialResults(props: PartialResultsProps) {
  if (props.items.length === 0) {
    return <p class="bookshelf-empty">No {props.vocabulary.itemPlural} found.</p>;
  }

  return (
    <>
      <div class="bookshelf-grid">
        {props.items.map((item) => (
          <BookCard item={item} vocabulary={props.vocabulary} />
        ))}
      </div>
      <Pagination
        total={props.total}
        limit={props.limit}
        offset={props.offset}
        baseUrl={props.paginationBase}
        htmxTarget={HX_TARGET}
      />
    </>
  );
}

export const bookshelfTemplate: Template = {
  SourcePage: BookshelfSourcePage,
  ItemPost: BookshelfItemPost,
  Layout: BookshelfLayout,
  PartialResults: BookshelfPartialResults,

  vocabulary: config.vocabulary,
  seo: config.seo,
  profile: config.profile,

  styles: templateStyles,
};
