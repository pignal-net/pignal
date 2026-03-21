import type { Template, PartialResultsProps, Item } from '@pignal/templates';
import { getTemplateConfig } from '@pignal/templates';
import { CaseStudiesSourcePage } from './source-page';
import { CaseStudiesItemPost } from './item-post';
import { CaseStudiesLayout } from './layout';
import { Pagination } from '../../components/pagination';
import { stripMarkdown } from '../../lib/markdown';
import { formatDate, readingTime } from '../../lib/time';
import templateStyles from './styles.css';

const config = getTemplateConfig('case-studies');

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

/**
 * Extract key outcome metrics from the content.
 */
function extractMetrics(content: string): { value: string; label: string }[] {
  const metrics: { value: string; label: string }[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    if (metrics.length >= 3) break;

    const pctMatch = line.match(/(\d+(?:\.\d+)?%)\s+([\w\s]{3,20})/i);
    if (pctMatch && metrics.length < 3) {
      metrics.push({ value: pctMatch[1], label: pctMatch[2].trim().slice(0, 20) });
      continue;
    }

    const multMatch = line.match(/(\d+(?:\.\d+)?x)\s+([\w\s]{3,20})/i);
    if (multMatch && metrics.length < 3) {
      metrics.push({ value: multMatch[1], label: multMatch[2].trim().slice(0, 20) });
      continue;
    }

    const dollarMatch = line.match(/(\$[\d.]+[KMB]?)\s+([\w\s]{3,20})/i);
    if (dollarMatch && metrics.length < 3) {
      metrics.push({ value: dollarMatch[1], label: dollarMatch[2].trim().slice(0, 20) });
    }
  }

  return metrics;
}

/** Extract client attribution from keySummary. */
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
    <div class="case-studies-hero">
      <div class="case-studies-hero-body">
        <a href={`/?type=${item.typeId}`} class="case-studies-industry-badge" {...hxProps(`/?type=${item.typeId}`)}>
          {item.typeName}
        </a>
        <h2>
          <a href={itemUrl} {...hxProps(itemUrl)}>{item.keySummary}</a>
        </h2>
        {excerpt && <p class="case-studies-hero-excerpt">{excerpt}</p>}
        <div class="case-studies-hero-meta">
          {client && (
            <>
              <span class="case-studies-client">{client}</span>
              <span class="case-studies-meta-sep">/</span>
            </>
          )}
          <time datetime={dateStr}>{formatDate(dateStr)}</time>
          <span class="case-studies-meta-sep">/</span>
          <span>{readingTime(item.content)}</span>
        </div>
      </div>
      {metrics.length > 0 && (
        <div class="case-studies-metrics">
          {metrics.map((m) => (
            <div class="case-studies-metric">
              <span class="case-studies-metric-value">{m.value}</span>
              <span class="case-studies-metric-label">{m.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
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
    <div class="case-studies-card">
      <div class="case-studies-card-header">
        <a href={typeUrl} class="case-studies-industry-badge" {...hxProps(typeUrl)}>{item.typeName}</a>
        {client && <span class="case-studies-client">{client}</span>}
      </div>
      <div class="case-studies-card-body">
        <h3>
          <a href={itemUrl} {...hxProps(itemUrl)}>{item.keySummary}</a>
        </h3>
        {excerpt && <p class="case-studies-card-excerpt">{excerpt}</p>}
        <div class="case-studies-card-meta">
          <time datetime={dateStr}>{formatDate(dateStr)}</time>
          <span class="case-studies-meta-sep">/</span>
          <span>{readingTime(item.content)}</span>
        </div>
        {item.tags && item.tags.length > 0 && (
          <div class="case-studies-card-tags">
            {item.tags.slice(0, 3).map((t) => (
              <a href={`/?tag=${encodeURIComponent(t)}`} class="case-studies-tag" {...hxProps(`/?tag=${encodeURIComponent(t)}`)}>#{t}</a>
            ))}
          </div>
        )}
      </div>
      {metrics.length > 0 && (
        <div class="case-studies-card-metrics">
          {metrics.map((m) => (
            <div class="case-studies-metric">
              <span class="case-studies-metric-value">{m.value}</span>
              <span class="case-studies-metric-label">{m.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CaseStudiesPartialResults(props: PartialResultsProps) {
  if (props.items.length === 0) {
    return <p class="case-studies-empty">No {config.vocabulary.vouched} {config.vocabulary.itemPlural} matching this filter.</p>;
  }

  const [heroItem, ...gridItems] = props.items;

  return (
    <>
      {heroItem && <PartialHeroCard item={heroItem} />}

      {gridItems.length > 0 && (
        <div class="case-studies-grid">
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

  styles: templateStyles,
};
