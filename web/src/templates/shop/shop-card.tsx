import type { Item } from '@pignal/core';
import type { TemplateVocabulary } from '@pignal/templates';
import { TypeBadge } from '../../components/type-badge';
import { stripMarkdown } from '../../lib/markdown';
import { formatDate } from '../../lib/time';

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

export function ShopCard({ item, vocabulary }: { item: Item; vocabulary: TemplateVocabulary }) {
  const detailUrl = `/item/${item.slug}`;
  const preview = stripMarkdown(item.content).slice(0, 120);
  const icon = item.typeName ? item.typeName.charAt(0).toUpperCase() : '?';

  return (
    <article class="shop-card">
      <div class="shop-card-image">
        <span>{icon}</span>
        <div class="shop-card-badge">
          <TypeBadge typeName={item.typeName} />
        </div>
      </div>
      <div class="shop-card-body">
        <h3><a href={detailUrl}>{item.keySummary}</a></h3>
        <p class="shop-card-description">{preview}{item.content.length > 120 ? '...' : ''}</p>
        {item.tags && item.tags.length > 0 && (
          <div class="shop-card-tags">
            {item.tags.slice(0, 3).map((t) => {
              const tagUrl = `/?tag=${encodeURIComponent(t)}`;
              return (
                <a href={tagUrl} class="item-tag" {...hxProps(tagUrl)}>#{t}</a>
              );
            })}
          </div>
        )}
      </div>
      <div class="shop-card-footer">
        <time datetime={item.vouchedAt || item.createdAt}>
          {formatDate(item.vouchedAt || item.createdAt)}
        </time>
        <a href={detailUrl}>View {vocabulary.item} &rarr;</a>
      </div>
    </article>
  );
}
