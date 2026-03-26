/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */
import type { Template, PartialResultsProps } from '../types';
import { ReviewsSourcePage } from './source-page';
import { ReviewsItemPost } from './item-post';
import { ReviewsLayout } from './layout';
import { FeedResults } from '@pignal/render/components/item-feed';

import { reviewsConfig as config } from './config';

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

  styles: '',
};
