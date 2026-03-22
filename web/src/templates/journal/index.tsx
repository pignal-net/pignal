import type { Template, PartialResultsProps } from '@pignal/templates';
import { getTemplateConfig } from '@pignal/templates';
import { JournalSourcePage } from './source-page';
import { JournalItemPost } from './item-post';
import { JournalLayout } from './layout';
import { FeedResults } from '../../components/item-feed';

const config = getTemplateConfig('journal');

function JournalPartialResults(props: PartialResultsProps) {
  return (
    <FeedResults
      items={props.items}
      total={props.total}
      limit={props.limit}
      offset={props.offset}
      paginationBase={props.paginationBase}
      sort={props.sort}
      basePath="/item"
      tagBasePath="/"
      showReadingTime={false}
      emptyMessage={`No ${config.vocabulary.vouched} ${config.vocabulary.itemPlural} matching this filter.`}
    />
  );
}

export const journalTemplate: Template = {
  SourcePage: JournalSourcePage,
  ItemPost: JournalItemPost,
  Layout: JournalLayout,
  PartialResults: JournalPartialResults,

  vocabulary: config.vocabulary,
  seo: config.seo,

  profile: config.profile,

  styles: '',
};
