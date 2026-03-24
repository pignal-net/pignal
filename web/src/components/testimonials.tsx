import type { ItemWithMeta } from '@pignal/db';

interface TestimonialCardProps {
  item: ItemWithMeta;
}

interface TestimonialsGridProps {
  items: ItemWithMeta[];
  limit?: number;
}

/** Escape HTML special characters for safe rendering in raw HTML strings. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Extract the first line of content as the attribution text. */
function extractAttribution(content: string): string {
  const firstLine = content.split('\n').find((line) => line.trim().length > 0);
  return firstLine?.trim() ?? '';
}

export function TestimonialCard({ item }: TestimonialCardProps) {
  const attribution = extractAttribution(item.content);

  return (
    <div class="bg-surface rounded-xl border border-border-subtle shadow-card p-6">
      <span class="text-4xl text-primary/20 font-serif leading-none">&ldquo;</span>
      <p class="text-text text-base italic leading-relaxed mt-1">{item.keySummary}</p>
      {attribution && (
        <p class="text-sm text-muted mt-4">{attribution}</p>
      )}
      {item.validationActionLabel && (
        <span class="inline-block text-xs text-success mt-2">{item.validationActionLabel}</span>
      )}
    </div>
  );
}

export function TestimonialsGrid({ items, limit }: TestimonialsGridProps) {
  const displayed = limit ? items.slice(0, limit) : items;
  if (displayed.length === 0) return null;

  return (
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-8">
      {displayed.map((item) => (
        <TestimonialCard item={item} />
      ))}
    </div>
  );
}

/**
 * Render testimonials as an HTML string for use inside processed markdown (directive handler).
 * Generates the same HTML as TestimonialsGrid but as a raw string.
 */
export function renderTestimonialsHtml(items: ItemWithMeta[], limit?: number): string {
  const displayed = limit ? items.slice(0, limit) : items;
  if (displayed.length === 0) return '';

  const cards = displayed.map((item) => {
    const attribution = extractAttribution(item.content);
    const attributionHtml = attribution
      ? `<p class="text-sm text-muted mt-4">${escapeHtml(attribution)}</p>`
      : '';
    const validationHtml = item.validationActionLabel
      ? `<span class="inline-block text-xs text-success mt-2">${escapeHtml(item.validationActionLabel)}</span>`
      : '';

    return `<div class="bg-surface rounded-xl border border-border-subtle shadow-card p-6"><span class="text-4xl text-primary/20 font-serif leading-none">&ldquo;</span><p class="text-text text-base italic leading-relaxed mt-1">${escapeHtml(item.keySummary)}</p>${attributionHtml}${validationHtml}</div>`;
  });

  return `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-8">${cards.join('')}</div>`;
}
