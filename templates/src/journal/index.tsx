/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */
import type { Template, PartialResultsProps } from '../types';
import { JournalSourcePage } from './source-page';
import { JournalItemPost } from './item-post';
import { JournalLayout } from './layout';
import { FeedResults } from '@pignal/render/components/item-feed';

import { journalConfig as config } from './config';

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
