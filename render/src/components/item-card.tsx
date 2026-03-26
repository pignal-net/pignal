/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */
import type { Item } from '@pignal/core';
import type { TFunction } from '../i18n/types';
import { TypeBadge } from './type-badge';
import { VisibilityBadge } from './visibility-badge';
import { relativeTime } from '../lib/time';
import { stripMarkdown } from '../lib/markdown';

interface ItemCardProps {
  item: Item;
  showVisibility?: boolean;
  t?: TFunction;
}

export function ItemCard({ item, showVisibility = true, t: tProp }: ItemCardProps) {
  const contentPreview = stripMarkdown(item.content).slice(0, 200);

  return (
    <article class="item-card">
      <h3>
        <a href={`/pignal/items/${item.id}`}>{item.keySummary}</a>
      </h3>
      <div class="card-meta">
        <TypeBadge typeName={item.typeName} />
        {showVisibility && <VisibilityBadge visibility={item.visibility} t={tProp} />}
        {item.workspaceName && <span>{item.workspaceName}</span>}
        <time datetime={item.createdAt}>{relativeTime(item.createdAt)}</time>
        {item.validationActionLabel && <span>{item.validationActionLabel}</span>}
      </div>
      <p class="card-preview">{contentPreview}{item.content.length > 200 ? '...' : ''}</p>
      {item.tags && item.tags.length > 0 && (
        <div class="item-tags">
          {item.tags.map((tag) => (
            <a href={`/pignal/items?tag=${encodeURIComponent(tag)}`} class="item-tag">#{tag}</a>
          ))}
        </div>
      )}
    </article>
  );
}
