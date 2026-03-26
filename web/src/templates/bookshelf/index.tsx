import type { Template, PartialResultsProps } from '@pignal/templates';
import { getTemplateConfig } from '@pignal/templates';
import { BookshelfSourcePage, BookCard } from './source-page';
import { BookshelfItemPost } from './item-post';
import { BookshelfLayout } from './layout';
import { EmptyState } from '../../components/empty-state';
import { Pagination } from '../../components/pagination';

const config = getTemplateConfig('bookshelf');

const HX_TARGET = '#source-results';

function BookshelfPartialResults(props: PartialResultsProps) {
  if (props.items.length === 0) {
    return (
      <EmptyState
        icon="search"
        title={`No ${props.vocabulary.itemPlural} found`}
        description="Try adjusting your filters or search query."
      />
    );
  }

  return (
    <>
      <div class="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] max-sm:grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-6 max-sm:gap-3">
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

  styles: '',
};
