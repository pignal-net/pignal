import type { Template, PartialResultsProps, Item } from '@pignal/templates';
import { getTemplateConfig } from '@pignal/templates';
import { MagazineSourcePage } from './source-page';
import { MagazineItemPost } from './item-post';
import { MagazineLayout } from './layout';
import { Pagination } from '../../components/pagination';
import { stripMarkdown } from '../../lib/markdown';
import { relativeTime, readingTime } from '../../lib/time';
import templateStyles from './styles.css';

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
    <div class="magazine-hero">
      <div class="magazine-hero-image">
        <span class="magazine-section-badge">{item.typeName}</span>
      </div>
      <div class="magazine-hero-body">
        <h2>
          <a href={itemUrl} {...hxProps(itemUrl)}>{item.keySummary}</a>
        </h2>
        {excerpt && <p class="magazine-hero-excerpt">{excerpt}</p>}
        <div class="magazine-hero-meta">
          <span class="magazine-time">{relativeTime(dateStr)}</span>
          <span class="magazine-meta-sep">/</span>
          <span class="magazine-reading-time">{readingTime(item.content)}</span>
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
    <div class="magazine-card">
      <div class="magazine-card-image">
        <a href={typeUrl} class="magazine-section-badge" {...hxProps(typeUrl)}>{item.typeName}</a>
      </div>
      <div class="magazine-card-body">
        <h3>
          <a href={itemUrl} {...hxProps(itemUrl)}>{item.keySummary}</a>
        </h3>
        {excerpt && <p class="magazine-card-excerpt">{excerpt}</p>}
        <div class="magazine-card-meta">
          <span class="magazine-time">{relativeTime(dateStr)}</span>
          <span class="magazine-meta-sep">/</span>
          <span class="magazine-reading-time">{readingTime(item.content)}</span>
        </div>
        {item.tags && item.tags.length > 0 && (
          <div class="magazine-card-tags">
            {item.tags.slice(0, 3).map((t) => (
              <a href={`/?tag=${encodeURIComponent(t)}`} class="magazine-tag" {...hxProps(`/?tag=${encodeURIComponent(t)}`)}>#{t}</a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MagazinePartialResults(props: PartialResultsProps) {
  if (props.items.length === 0) {
    return <p class="magazine-empty">No {config.vocabulary.vouched} {config.vocabulary.itemPlural} matching this filter.</p>;
  }

  const [heroItem, ...gridItems] = props.items;

  return (
    <>
      {heroItem && <PartialHeroCard item={heroItem} />}

      {gridItems.length > 0 && (
        <div class="magazine-grid">
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

  styles: templateStyles,
};
