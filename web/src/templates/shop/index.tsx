import type { Template, PartialResultsProps } from '@pignal/templates';
import { getTemplateConfig } from '@pignal/templates';
import { ShopSourcePage } from './source-page';
import { ShopItemPost } from './item-post';
import { ShopLayout } from './layout';
import { ShopCard } from './shop-card';
import { Pagination } from '../../components/pagination';

const config = getTemplateConfig('shop');

function ShopPartialResults(props: PartialResultsProps) {
  if (props.items.length === 0) {
    return (
      <div class="empty-state">
        <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
        <p>{`No ${props.vocabulary.itemPlural} found.`}</p>
      </div>
    );
  }

  return (
    <>
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {props.items.map((item) => (
          <ShopCard item={item} vocabulary={props.vocabulary} />
        ))}
      </div>
      <Pagination
        total={props.total}
        limit={props.limit}
        offset={props.offset}
        baseUrl={props.paginationBase}
        htmxTarget="#source-results"
      />
    </>
  );
}

export const shopTemplate: Template = {
  SourcePage: ShopSourcePage,
  ItemPost: ShopItemPost,
  Layout: ShopLayout,
  PartialResults: ShopPartialResults,

  vocabulary: config.vocabulary,
  seo: config.seo,
  profile: config.profile,

  styles: '',
};
