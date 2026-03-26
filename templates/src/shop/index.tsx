/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */
import type { Template, PartialResultsProps } from '../types';
import { ShopSourcePage } from './source-page';
import { ShopItemPost } from './item-post';
import { ShopLayout } from './layout';
import { ShopCard } from './shop-card';
import { Pagination } from '@pignal/render/components/pagination';
import { EmptyState } from '@pignal/render/components/empty-state';

import { shopConfig as config } from './config';

function ShopPartialResults(props: PartialResultsProps) {
  if (props.items.length === 0) {
    return (
      <EmptyState
        icon="search"
        title={`No ${props.vocabulary.itemPlural} found`}
        description="Try adjusting your filters or search terms."
      />
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
