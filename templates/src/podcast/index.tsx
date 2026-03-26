/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */
import type { Template, PartialResultsProps } from '../types';
import { PodcastSourcePage } from './source-page';
import { PodcastItemPost } from './item-post';
import { PodcastLayout } from './layout';
import { FeedResults } from '@pignal/render/components/item-feed';

import { podcastConfig as config } from './config';

function PodcastPartialResults(props: PartialResultsProps) {
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

export const podcastTemplate: Template = {
  SourcePage: PodcastSourcePage,
  ItemPost: PodcastItemPost,
  Layout: PodcastLayout,
  PartialResults: PodcastPartialResults,

  vocabulary: config.vocabulary,
  seo: config.seo,

  profile: config.profile,

  styles: '',
};
