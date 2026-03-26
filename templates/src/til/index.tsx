/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */
import type { Template, PartialResultsProps } from '../types';
import { TilSourcePage } from './source-page';
import { TilItemPost } from './item-post';
import { TilLayout } from './layout';
import { FeedResults } from '@pignal/render/components/item-feed';

import { tilConfig as config } from './config';

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
