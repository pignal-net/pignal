import type { Template, PartialResultsProps, Item } from '@pignal/templates';
import type { TemplateVocabulary } from '@pignal/templates';
import { getTemplateConfig } from '@pignal/templates';
import { PortfolioSourcePage } from './source-page';
import { PortfolioItemPost } from './item-post';
import { PortfolioLayout } from './layout';
import { TypeBadge } from '../../components/type-badge';
import { Pagination } from '../../components/pagination';
import { stripMarkdown } from '../../lib/markdown';
import { formatDate } from '../../lib/time';
import templateStyles from './styles.css';

const config = getTemplateConfig('portfolio');

const HX_TARGET = '#source-results';
const HX_INDICATOR = '#source-loading';

function hxProps(url: string) {
  return {
    'hx-get': url,
    'hx-target': HX_TARGET,
    'hx-swap': 'innerHTML',
    'hx-push-url': 'true',
    'hx-indicator': HX_INDICATOR,
  };
}

function PortfolioCardPartial({ item, vocabulary }: { item: Item; vocabulary: TemplateVocabulary }) {
  const detailUrl = `/item/${item.slug}`;
  const preview = stripMarkdown(item.content).slice(0, 120);
  const icon = item.typeName ? item.typeName.charAt(0).toUpperCase() : '?';

  return (
    <article class="portfolio-card">
      <div class="portfolio-card-image">
        <span>{icon}</span>
        <div class="portfolio-card-badge">
          <TypeBadge typeName={item.typeName} />
        </div>
      </div>
      <div class="portfolio-card-body">
        <h3><a href={detailUrl}>{item.keySummary}</a></h3>
        <p class="portfolio-card-description">{preview}{item.content.length > 120 ? '...' : ''}</p>
        {item.tags && item.tags.length > 0 && (
          <div class="portfolio-card-tags">
            {item.tags.slice(0, 3).map((t) => {
              const tagUrl = `/?tag=${encodeURIComponent(t)}`;
              return (
                <a href={tagUrl} class="item-tag" {...hxProps(tagUrl)}>#{t}</a>
              );
            })}
          </div>
        )}
      </div>
      <div class="portfolio-card-footer">
        <time datetime={item.vouchedAt || item.createdAt}>
          {formatDate(item.vouchedAt || item.createdAt)}
        </time>
        <a href={detailUrl}>View {vocabulary.item} &rarr;</a>
      </div>
    </article>
  );
}

function PortfolioPartialResults(props: PartialResultsProps) {
  if (props.items.length === 0) {
    return <p class="portfolio-empty">No {props.vocabulary.itemPlural} found.</p>;
  }

  return (
    <>
      <div class="portfolio-grid">
        {props.items.map((item) => (
          <PortfolioCardPartial item={item} vocabulary={props.vocabulary} />
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

export const portfolioTemplate: Template = {
  SourcePage: PortfolioSourcePage,
  ItemPost: PortfolioItemPost,
  Layout: PortfolioLayout,
  PartialResults: PortfolioPartialResults,

  vocabulary: config.vocabulary,
  seo: config.seo,
  profile: config.profile,

  styles: templateStyles,
};
