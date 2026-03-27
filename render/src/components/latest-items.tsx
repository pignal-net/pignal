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

/** Format a date string to a human-readable short format. */
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Render a list of latest items as an HTML string for directive embedding.
 *
 * @param items - All available items (will be filtered and sliced)
 * @param type - Optional type name to filter by (case-insensitive)
 * @param limit - Maximum number of items to show (default: 5)
 * @param tag - Optional tag to filter by
 */
export function renderLatestItemsHtml(
  items: ItemWithMeta[],
  type?: string,
  limit?: number,
  tag?: string,
): string {
  let filtered = items;

  if (type) {
    const lowerType = type.toLowerCase();
    filtered = filtered.filter(
      (item) => item.typeName.toLowerCase() === lowerType,
    );
  }

  if (tag) {
    const lowerTag = tag.toLowerCase();
    filtered = filtered.filter(
      (item) => item.tags?.some((t) => t.toLowerCase() === lowerTag),
    );
  }

  const displayed = filtered.slice(0, limit ?? 5);
  if (displayed.length === 0) return '';

  const heading = type ? `Latest ${escapeHtml(type)}` : 'Latest Items';

  const itemsHtml = displayed
    .map((item) => {
      const slug = item.slug ? escapeHtml(item.slug) : item.id;
      const summary = escapeHtml(item.keySummary);
      const date = formatDate(item.createdAt);
      return `<a href="/item/${slug}" class="block p-3 rounded-lg bg-surface border border-border-subtle hover:bg-surface-hover transition-colors no-underline"><p class="font-medium text-text">${summary}</p><p class="text-xs text-muted mt-1">${date}</p></a>`;
    })
    .join('');

  return `<div class="my-6 space-y-3"><h3 class="text-sm font-semibold uppercase tracking-wider text-muted">${heading}</h3>${itemsHtml}</div>`;
}
