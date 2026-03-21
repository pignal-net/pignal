import type { Template, PartialResultsProps } from '@pignal/templates';
import { getTemplateConfig } from '@pignal/templates';
import { PodcastSourcePage } from './source-page';
import { PodcastItemPost } from './item-post';
import { PodcastLayout } from './layout';
import { FeedResults } from '../../components/item-feed';
import templateStyles from './styles.css';

const config = getTemplateConfig('podcast');

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

  styles: templateStyles,
};
