/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */
import type { Template, PartialResultsProps, Item } from '../types';
import { CaseStudiesSourcePage } from './source-page';
import { CaseStudiesItemPost } from './item-post';
import { CaseStudiesLayout } from './layout';
import { Pagination } from '@pignal/render/components/pagination';
import { EmptyState } from '@pignal/render/components/empty-state';
import { stripMarkdown } from '@pignal/render/lib/markdown';
import { formatDate, readingTime } from '@pignal/render/lib/time';

import { caseStudiesConfig as config } from './config';

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

function extractMetrics(content: string): { value: string; label: string }[] {
  const metrics: { value: string; label: string }[] = [];
  const lines = content.split('\n');
  for (const line of lines) {
    if (metrics.length >= 3) break;
    const pctMatch = line.match(/(\d+(?:\.\d+)?%)\s+([\w\s]{3,20})/i);
    if (pctMatch && metrics.length < 3) { metrics.push({ value: pctMatch[1], label: pctMatch[2].trim().slice(0, 20) }); continue; }
    const multMatch = line.match(/(\d+(?:\.\d+)?x)\s+([\w\s]{3,20})/i);
    if (multMatch && metrics.length < 3) { metrics.push({ value: multMatch[1], label: multMatch[2].trim().slice(0, 20) }); continue; }
    const dollarMatch = line.match(/(\$[\d.]+[KMB]?)\s+([\w\s]{3,20})/i);
    if (dollarMatch && metrics.length < 3) { metrics.push({ value: dollarMatch[1], label: dollarMatch[2].trim().slice(0, 20) }); }
  }
  return metrics;
}

function extractClient(keySummary: string): string {
  const match = keySummary.match(/^(.+?)\s+(?:reduced|increased|improved|cut|automated|achieved|boosted|saved|delivered|launched|migrated|scaled)/i);
  return match ? match[1] : '';
}

function PartialHeroCard({ item }: { item: Item }) {
  const excerpt = stripMarkdown(item.content).slice(0, 220);
  const dateStr = item.vouchedAt || item.createdAt;
  const itemUrl = `/item/${item.slug}`;
  const metrics = extractMetrics(item.content);
  const client = extractClient(item.keySummary);

  return (
    <article class="relative border border-border-subtle shadow-card rounded-xl overflow-hidden bg-surface mb-8 card-hover">
      <div class="px-6 max-sm:px-5 pt-7 pb-6 max-sm:pt-4 max-sm:pb-4">
        <a href={`/?type=${item.typeId}`} class="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide text-primary-inverse bg-primary no-underline hover:opacity-90 mb-3 transition-opacity" {...hxProps(`/?type=${item.typeId}`)}>
          {item.typeName}
        </a>
        <h2 class="m-0 mb-3 text-2xl max-sm:text-lg leading-snug tracking-tight">
          <a href={itemUrl} class="no-underline text-text hover:text-primary transition-colors" {...hxProps(itemUrl)}>{item.keySummary}</a>
        </h2>
        {excerpt && <p class="text-[0.95rem] max-sm:text-sm text-muted leading-relaxed m-0 mb-4 line-clamp-3">{excerpt}</p>}
        <div class="flex items-center gap-3 flex-wrap text-sm text-muted">
          {client && (
            <>
              <span class="text-sm text-muted italic">{client}</span>
              <span class="text-muted opacity-40">/</span>
            </>
          )}
          <time datetime={dateStr}>{formatDate(dateStr)}</time>
          <span class="text-muted opacity-40">/</span>
          <span>{readingTime(item.content)}</span>
        </div>
      </div>
      {metrics.length > 0 && (
        <div class="flex max-sm:flex-col border-t border-border-subtle" role="list" aria-label="Key metrics">
          {metrics.map((m, i) => (
            <div class={`flex-1 px-4 py-3 max-sm:py-2 text-center max-sm:text-left max-sm:flex max-sm:items-center max-sm:gap-2 bg-surface ${i > 0 ? 'border-l max-sm:border-l-0 max-sm:border-t border-border' : ''}`} role="listitem">
              <span class="block max-sm:inline max-sm:min-w-[4rem] text-2xl max-sm:text-xl font-bold text-primary leading-tight mb-0.5">{m.value}</span>
              <span class="block max-sm:inline text-[0.72rem] text-muted uppercase tracking-wide">{m.label}</span>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

function PartialGridCard({ item }: { item: Item }) {
  const excerpt = stripMarkdown(item.content).slice(0, 140);
  const dateStr = item.vouchedAt || item.createdAt;
  const itemUrl = `/item/${item.slug}`;
  const typeUrl = `/?type=${item.typeId}`;
  const metrics = extractMetrics(item.content).slice(0, 2);
  const client = extractClient(item.keySummary);

  return (
    <article class="border border-border-subtle shadow-card rounded-xl overflow-hidden bg-surface flex flex-col card-hover">
      <div class="px-4 pt-4 flex items-center justify-between gap-2">
        <a href={typeUrl} class="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide text-primary-inverse bg-primary no-underline hover:opacity-90 transition-opacity" {...hxProps(typeUrl)}>{item.typeName}</a>
        {client && <span class="text-sm text-muted italic">{client}</span>}
      </div>
      <div class="px-4 pt-3 pb-4 flex-1 flex flex-col">
        <h3 class="m-0 mb-2 text-base leading-snug font-semibold">
          <a href={itemUrl} class="no-underline text-text hover:text-primary transition-colors" {...hxProps(itemUrl)}>{item.keySummary}</a>
        </h3>
        {excerpt && <p class="text-sm text-muted m-0 mb-3 leading-relaxed line-clamp-2 flex-1">{excerpt}</p>}
        <div class="flex items-center gap-2 flex-wrap text-xs text-muted mt-auto">
          <time datetime={dateStr}>{formatDate(dateStr)}</time>
          <span class="text-muted opacity-40">/</span>
          <span>{readingTime(item.content)}</span>
        </div>
        {item.tags && item.tags.length > 0 && (
          <div class="flex flex-wrap gap-1.5 mt-2">
            {item.tags.slice(0, 3).map((t) => (
              <a href={`/?tag=${encodeURIComponent(t)}`} class="text-[0.72rem] px-2 py-0.5 rounded-full bg-muted/8 border border-border-subtle text-muted no-underline hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-colors" {...hxProps(`/?tag=${encodeURIComponent(t)}`)}>#{t}</a>
            ))}
          </div>
        )}
      </div>
      {metrics.length > 0 && (
        <div class="flex max-sm:flex-col border-t border-border-subtle" role="list" aria-label="Key metrics">
          {metrics.map((m, i) => (
            <div class={`flex-1 px-3 py-2 max-sm:py-1.5 text-center max-sm:text-left max-sm:flex max-sm:items-center max-sm:gap-2 bg-surface ${i > 0 ? 'border-l max-sm:border-l-0 max-sm:border-t border-border' : ''}`} role="listitem">
              <span class="block max-sm:inline text-base max-sm:text-sm font-bold text-primary leading-tight mb-0.5">{m.value}</span>
              <span class="block max-sm:inline text-[0.65rem] text-muted uppercase tracking-wide">{m.label}</span>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

function CaseStudiesPartialResults(props: PartialResultsProps) {
  if (props.items.length === 0) {
    return (
      <EmptyState
        icon="inbox"
        title={`No ${config.vocabulary.itemPlural} found`}
        description="Try adjusting your filters or search query."
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

export const casestudiesTemplate: Template = {
  SourcePage: CaseStudiesSourcePage,
  ItemPost: CaseStudiesItemPost,
  Layout: CaseStudiesLayout,
  PartialResults: CaseStudiesPartialResults,

  vocabulary: config.vocabulary,
  seo: config.seo,

  profile: config.profile,

  styles: '',
};
