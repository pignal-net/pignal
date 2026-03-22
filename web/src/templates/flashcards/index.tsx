import type { Template, PartialResultsProps } from '@pignal/templates';
import { getTemplateConfig } from '@pignal/templates';
import { FlashcardsSourcePage, FlashCard } from './source-page';
import { FlashcardsItemPost } from './item-post';
import { FlashcardsLayout } from './layout';
import { Pagination } from '../../components/pagination';

const config = getTemplateConfig('flashcards');

const HX_TARGET = '#source-results';

function FlashcardsPartialResults(props: PartialResultsProps) {
  if (props.items.length === 0) {
    return (
      <div class="empty-state">
        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
        <p>{`No ${props.vocabulary.itemPlural} found.`}</p>
      </div>
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
