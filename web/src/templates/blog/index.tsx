import type { Template, PartialResultsProps } from '@pignal/templates';
import { getTemplateConfig } from '@pignal/templates';
import { BlogSourcePage } from './source-page';
import { BlogItemPost } from './item-post';
import { BlogLayout } from './layout';
import { FeedResults } from '../../components/item-feed';

const config = getTemplateConfig('blog');

function BlogPartialResults(props: PartialResultsProps) {
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
      emptyMessage={`No vouched ${props.vocabulary.itemPlural} matching this filter.`}
    />
  );
}

export const blogTemplate: Template = {
  SourcePage: BlogSourcePage,
  ItemPost: BlogItemPost,
  Layout: BlogLayout,
  PartialResults: BlogPartialResults,

  vocabulary: config.vocabulary,
  seo: config.seo,
  profile: config.profile,

  styles: '',
};
