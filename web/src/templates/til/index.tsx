import type { Template, PartialResultsProps } from '@pignal/templates';
import { getTemplateConfig } from '@pignal/templates';
import { TilSourcePage } from './source-page';
import { TilItemPost } from './item-post';
import { TilLayout } from './layout';
import { FeedResults } from '../../components/item-feed';

const config = getTemplateConfig('til');

function TilPartialResults(props: PartialResultsProps) {
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

export const tilTemplate: Template = {
  SourcePage: TilSourcePage,
  ItemPost: TilItemPost,
  Layout: TilLayout,
  PartialResults: TilPartialResults,

  vocabulary: config.vocabulary,
  seo: config.seo,

  profile: config.profile,

  styles: '',
};
