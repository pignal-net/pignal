import type { Template, PartialResultsProps } from '@pignal/templates';
import { getTemplateConfig } from '@pignal/templates';
import { ReviewsSourcePage } from './source-page';
import { ReviewsItemPost } from './item-post';
import { ReviewsLayout } from './layout';
import { FeedResults } from '../../components/item-feed';
import templateStyles from './styles.css';

const config = getTemplateConfig('reviews');

function ReviewsPartialResults(props: PartialResultsProps) {
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
      emptyMessage={`No ${config.vocabulary.vouched} ${config.vocabulary.itemPlural} matching this filter.`}
    />
  );
}

export const reviewsTemplate: Template = {
  SourcePage: ReviewsSourcePage,
  ItemPost: ReviewsItemPost,
  Layout: ReviewsLayout,
  PartialResults: ReviewsPartialResults,

  vocabulary: config.vocabulary,
  seo: config.seo,

  profile: config.profile,

  styles: templateStyles,
};
