/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */
import type { Item } from '../types';
import type { TemplateVocabulary } from '../types';
import { TypeBadge } from '@pignal/render/components/type-badge';
import { stripMarkdown } from '@pignal/render/lib/markdown';
import { formatDate } from '@pignal/render/lib/time';

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
    <article class="group card-hover bg-surface rounded-xl border border-border-subtle shadow-card overflow-hidden flex flex-col">
      <a href={detailUrl} class="block no-underline text-inherit">
        <div class="aspect-[4/3] bg-gradient-to-br from-primary/5 to-primary/15 flex items-center justify-center text-4xl text-primary opacity-60 relative overflow-hidden">
          <span class="transition-transform duration-300 group-hover:scale-[1.03]">{icon}</span>
          <div class="absolute top-2.5 left-2.5 z-10">
            <TypeBadge typeName={item.typeName} />
          </div>
          <div class="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-surface" />
        </div>
      </a>
      <div class="px-4 pt-3 pb-4 flex-1 flex flex-col">
        <h3 class="m-0 mb-1 text-[0.95rem] font-semibold leading-snug">
          <a href={detailUrl} class="no-underline text-text hover:text-primary transition-colors">{item.keySummary}</a>
        </h3>
        <p class="text-[0.82rem] text-muted leading-relaxed m-0 mb-2 line-clamp-2 flex-1">{preview}{item.content.length > 120 ? '...' : ''}</p>
        {item.tags && item.tags.length > 0 && (
          <div class="flex gap-1 flex-wrap mt-auto pt-2">
            {item.tags.slice(0, 3).map((t) => {
              const tagUrl = `/?tag=${encodeURIComponent(t)}`;
              return (
                <a href={tagUrl} class="inline-block px-2 py-0.5 rounded-full text-[0.7rem] font-medium text-muted no-underline border border-border-subtle hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-colors" {...hxProps(tagUrl)}>#{t}</a>
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
