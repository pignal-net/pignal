import type { Template, PartialResultsProps } from '@pignal/templates';
import { getTemplateConfig } from '@pignal/templates';
import { RecipesSourcePage, RecipeCard } from './source-page';
import { RecipesItemPost } from './item-post';
import { RecipesLayout } from './layout';
import { Pagination } from '../../components/pagination';

const config = getTemplateConfig('recipes');

const HX_TARGET = '#source-results';

function RecipesPartialResults(props: PartialResultsProps) {
  if (props.items.length === 0) {
    return (
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="10" width="36" height="28" rx="3"/><path d="M6 22h12l3 4h6l3-4h12"/><path d="M20 18h8M22 14h4"/></svg>
        </div>
        <p class="empty-state-title">{`No ${props.vocabulary.itemPlural} found`}</p>
        <p class="empty-state-description">Try adjusting your filters or search query.</p>
      </div>
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
