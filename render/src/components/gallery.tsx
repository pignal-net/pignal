/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */
import type { ItemWithMeta } from '@pignal/db';

/** Escape HTML special characters for safe rendering in raw HTML strings. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Get the grid-cols class based on the number of columns. */
function getGridColsClass(columns: number): string {
  switch (columns) {
    case 2:
      return 'grid-cols-1 sm:grid-cols-2';
    case 4:
      return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
    case 3:
    default:
      return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
  }
}

/**
 * Render a gallery grid of items as an HTML string for directive embedding.
 *
 * @param items - All available items (will be filtered by tag)
 * @param tag - Tag to filter items by
 * @param columns - Number of grid columns (2, 3, or 4; default: 3)
 * @param limit - Maximum number of items to show (default: 12)
 */
export function renderGalleryHtml(
  items: ItemWithMeta[],
  tag?: string,
  columns?: number,
  limit?: number,
): string {
  let filtered = items;

  if (tag) {
    const lowerTag = tag.toLowerCase();
    filtered = filtered.filter(
      (item) => item.tags?.some((t) => t.toLowerCase() === lowerTag),
    );
  }

  const displayed = filtered.slice(0, limit ?? 12);
  if (displayed.length === 0) return '';

  const cols = columns ?? 3;
  const gridClass = getGridColsClass(cols);

  const cardsHtml = displayed
    .map((item) => {
      const slug = item.slug ? escapeHtml(item.slug) : item.id;
      const summary = escapeHtml(item.keySummary);
      const snippet = item.content.length > 100
        ? escapeHtml(item.content.slice(0, 100)) + '&hellip;'
        : escapeHtml(item.content);

      return `<a href="/item/${slug}" class="block p-4 rounded-lg bg-surface border border-border-subtle hover:shadow-card-hover transition-shadow no-underline"><p class="font-medium text-text text-sm">${summary}</p><p class="text-xs text-muted mt-1 line-clamp-2">${snippet}</p></a>`;
    })
    .join('');

  return `<div class="my-6 grid gap-4 ${gridClass}">${cardsHtml}</div>`;
}
