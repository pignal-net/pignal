import type { Template, PartialResultsProps } from '@pignal/templates';
import { getTemplateConfig } from '@pignal/templates';
import { WritingSourcePage } from './source-page';
import { WritingItemPost } from './item-post';
import { WritingLayout } from './layout';
import { FeedResults } from '../../components/item-feed';

const config = getTemplateConfig('writing');

function WritingPartialResults(props: PartialResultsProps) {
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
      showReadingTime={true}
      emptyMessage={`No ${config.vocabulary.vouched} ${config.vocabulary.itemPlural} yet.`}
    />
  );
}

export const writingTemplate: Template = {
  SourcePage: WritingSourcePage,
  ItemPost: WritingItemPost,
  Layout: WritingLayout,
  PartialResults: WritingPartialResults,

  vocabulary: config.vocabulary,
  seo: config.seo,

  profile: config.profile,

  styles: '',
};
