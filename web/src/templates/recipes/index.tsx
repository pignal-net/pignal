import type { Template, PartialResultsProps } from '@pignal/templates';
import { getTemplateConfig } from '@pignal/templates';
import { RecipesSourcePage, RecipeCard } from './source-page';
import { RecipesItemPost } from './item-post';
import { RecipesLayout } from './layout';
import { EmptyState } from '../../components/empty-state';
import { Pagination } from '../../components/pagination';

const config = getTemplateConfig('recipes');

const HX_TARGET = '#source-results';

function RecipesPartialResults(props: PartialResultsProps) {
  if (props.items.length === 0) {
    return (
      <EmptyState
        icon="search"
        title={`No ${props.vocabulary.itemPlural} found`}
        description="Try adjusting your filters or search query."
      />
    );
  }

  return (
    <>
      <div class="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-6">
        {props.items.map((item) => (
          <RecipeCard item={item} vocabulary={props.vocabulary} />
        ))}
      </div>
      <Pagination
        total={props.total}
        limit={props.limit}
        offset={props.offset}
        baseUrl={props.paginationBase}
        htmxTarget={HX_TARGET}
      />
    </>
  );
}

export const recipesTemplate: Template = {
  SourcePage: RecipesSourcePage,
  ItemPost: RecipesItemPost,
  Layout: RecipesLayout,
  PartialResults: RecipesPartialResults,

  vocabulary: config.vocabulary,
  seo: config.seo,
  profile: config.profile,

  styles: '',
};
