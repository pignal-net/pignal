import type { Template, PartialResultsProps } from '@pignal/templates';
import { getTemplateConfig } from '@pignal/templates';
import { RecipesSourcePage, RecipeCard } from './source-page';
import { RecipesItemPost } from './item-post';
import { RecipesLayout } from './layout';
import { Pagination } from '../../components/pagination';
import templateStyles from './styles.css';

const config = getTemplateConfig('recipes');

const HX_TARGET = '#source-results';

function RecipesPartialResults(props: PartialResultsProps) {
  if (props.items.length === 0) {
    return <p class="recipes-empty">No {props.vocabulary.itemPlural} found.</p>;
  }

  return (
    <>
      <div class="recipes-grid">
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

  styles: templateStyles,
};
