import type { Template, PartialResultsProps } from '@pignal/templates';
import { getTemplateConfig } from '@pignal/templates';
import { FlashcardsSourcePage, FlashCard } from './source-page';
import { FlashcardsItemPost } from './item-post';
import { FlashcardsLayout } from './layout';
import { Pagination } from '../../components/pagination';
import { EmptyState } from '../../components/empty-state';

const config = getTemplateConfig('flashcards');

const HX_TARGET = '#source-results';

function FlashcardsPartialResults(props: PartialResultsProps) {
  if (props.items.length === 0) {
    return (
      <EmptyState
        icon="inbox"
        title={`No ${props.vocabulary.itemPlural} found`}
        description="Try adjusting your filters or search query."
      />
    );
  }

  return (
    <>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
        {props.items.map((item) => (
          <FlashCard item={item} vocabulary={props.vocabulary} />
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

export const flashcardsTemplate: Template = {
  SourcePage: FlashcardsSourcePage,
  ItemPost: FlashcardsItemPost,
  Layout: FlashcardsLayout,
  PartialResults: FlashcardsPartialResults,

  vocabulary: config.vocabulary,
  seo: config.seo,
  profile: config.profile,

  styles: '',
};
