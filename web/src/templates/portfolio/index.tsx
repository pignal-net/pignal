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
    <article class="bg-surface rounded-xl border border-border-subtle shadow-card overflow-hidden flex flex-col transition-all duration-300 hover:shadow-card-hover">
      <div class="aspect-[4/3] bg-gradient-to-br from-primary/5 to-primary/15 flex items-center justify-center text-4xl text-primary opacity-50 relative overflow-hidden">
        <span>{icon}</span>
        <div class="absolute top-2.5 left-2.5 z-10">
          <TypeBadge typeName={item.typeName} />
        </div>
        <div class="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-surface" />
      </div>
      <div class="px-4 pt-3 pb-4 flex-1 flex flex-col">
        <h3 class="m-0 mb-1 text-base font-semibold leading-snug">
          <a href={detailUrl} class="no-underline text-text hover:text-primary transition-colors">{item.keySummary}</a>
        </h3>
        <p class="text-[0.82rem] text-muted leading-relaxed m-0 mb-2 line-clamp-2 flex-1">{preview}{item.content.length > 120 ? '...' : ''}</p>
        {item.tags && item.tags.length > 0 && (
          <div class="flex gap-1 flex-wrap mt-auto pt-2">
            {item.tags.slice(0, 3).map((t) => {
              const tagUrl = `/?tag=${encodeURIComponent(t)}`;
              return (
                <a href={tagUrl} class="item-tag text-[0.7rem] px-1.5 py-0.5" {...hxProps(tagUrl)}>#{t}</a>
              );
            })}
          </div>
        )}
      </div>
      <div class="flex items-center justify-between px-4 py-2 border-t border-border-subtle text-xs text-muted">
        <time datetime={item.vouchedAt || item.createdAt}>
          {formatDate(item.vouchedAt || item.createdAt)}
        </time>
        <a href={detailUrl} class="text-primary no-underline font-semibold text-[0.8rem] hover:underline">View {vocabulary.item} &rarr;</a>
      </div>
    </article>
  );
}

function PortfolioPartialResults(props: PartialResultsProps) {
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
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

  styles: '',
};
