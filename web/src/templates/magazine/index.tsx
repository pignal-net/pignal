import type { Template, PartialResultsProps, Item } from '@pignal/templates';
import { getTemplateConfig } from '@pignal/templates';
import { MagazineSourcePage } from './source-page';
import { MagazineItemPost } from './item-post';
import { MagazineLayout } from './layout';
import { Pagination } from '../../components/pagination';
import { EmptyState } from '../../components/empty-state';
import { stripMarkdown } from '../../lib/markdown';
import { relativeTime, readingTime } from '../../lib/time';

const config = getTemplateConfig('magazine');

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

function PartialHeroCard({ item }: { item: Item }) {
  const excerpt = stripMarkdown(item.content).slice(0, 220);
  const dateStr = item.vouchedAt || item.createdAt;
  const itemUrl = `/item/${item.slug}`;

  return (
    <div class="relative bg-surface rounded-2xl border border-border-subtle shadow-card overflow-hidden mb-8 card-hover">
      <div class="w-full h-56 sm:h-72 bg-gradient-to-br from-primary/10 to-primary/25 flex items-center justify-center">
        <span class="inline-block px-5 py-2 rounded-full text-base font-semibold uppercase tracking-wide text-primary-inverse bg-primary no-underline">{item.typeName}</span>
      </div>
      <div class="p-6 sm:px-8 sm:pb-8">
        <h2 class="m-0 mb-3 text-[clamp(1.25rem,3vw+0.5rem,1.75rem)] leading-tight tracking-tight">
          <a href={itemUrl} class="no-underline text-text hover:text-primary" {...hxProps(itemUrl)}>{item.keySummary}</a>
        </h2>
        {excerpt && <p class="text-base text-muted leading-relaxed m-0 mb-4 line-clamp-3">{excerpt}</p>}
        <div class="flex items-center gap-3 flex-wrap text-sm text-muted">
          <span class="whitespace-nowrap">{relativeTime(dateStr)}</span>
          <span class="opacity-40">/</span>
          <span class="whitespace-nowrap">{readingTime(item.content)}</span>
        </div>
      </div>
    </div>
  );
}

function PartialGridCard({ item }: { item: Item }) {
  const excerpt = stripMarkdown(item.content).slice(0, 140);
  const dateStr = item.vouchedAt || item.createdAt;
  const itemUrl = `/item/${item.slug}`;
  const typeUrl = `/?type=${item.typeId}`;

  return (
    <div class="bg-surface rounded-xl border border-border-subtle shadow-card overflow-hidden flex flex-col card-hover">
      <div class="w-full h-28 bg-gradient-to-br from-primary/10 to-primary/25 flex items-center justify-start pl-4">
        <a href={typeUrl} class="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide text-primary-inverse bg-primary no-underline hover:opacity-90" {...hxProps(typeUrl)}>{item.typeName}</a>
      </div>
      <div class="p-4 flex-1 flex flex-col">
        <h3 class="m-0 mb-2 text-base leading-snug font-semibold">
          <a href={itemUrl} class="no-underline text-text hover:text-primary" {...hxProps(itemUrl)}>{item.keySummary}</a>
        </h3>
        {excerpt && <p class="text-sm text-muted m-0 mb-3 leading-relaxed line-clamp-2 flex-1">{excerpt}</p>}
        <div class="flex items-center gap-2 flex-wrap text-xs text-muted mt-auto">
          <span class="whitespace-nowrap tabular-nums">{relativeTime(dateStr)}</span>
          <span class="opacity-40">/</span>
          <span class="whitespace-nowrap">{readingTime(item.content)}</span>
        </div>
        {item.tags && item.tags.length > 0 && (
          <div class="flex flex-wrap gap-1.5 mt-2">
            {item.tags.slice(0, 3).map((t) => (
              <a href={`/?tag=${encodeURIComponent(t)}`} class="text-[0.72rem] px-2 py-0.5 rounded-full bg-muted/8 border border-border-subtle text-muted no-underline hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-colors" {...hxProps(`/?tag=${encodeURIComponent(t)}`)}>#{t}</a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MagazinePartialResults(props: PartialResultsProps) {
  if (props.items.length === 0) {
    return (
      <EmptyState
        icon="inbox"
        title={`No ${config.vocabulary.itemPlural} found`}
        description={`No ${config.vocabulary.vouched} ${config.vocabulary.itemPlural} matching this filter.`}
      />
    );
  }

  const [heroItem, ...gridItems] = props.items;

  return (
    <>
      {heroItem && <PartialHeroCard item={heroItem} />}

      {gridItems.length > 0 && (
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {gridItems.map((item) => (
            <PartialGridCard item={item} />
          ))}
        </div>
      )}

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

export const magazineTemplate: Template = {
  SourcePage: MagazineSourcePage,
  ItemPost: MagazineItemPost,
  Layout: MagazineLayout,
  PartialResults: MagazinePartialResults,

  vocabulary: config.vocabulary,
  seo: config.seo,

  profile: config.profile,

  styles: '',
};
