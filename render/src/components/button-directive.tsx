/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */

/** Escape HTML special characters for safe rendering in raw HTML strings. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Validate that the URL is a relative path or an http/https URL. */
function isValidUrl(url: string): boolean {
  if (url.startsWith('/')) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

const VARIANT_CLASSES: Record<string, string> = {
  primary: 'bg-primary text-primary-inverse hover:bg-primary-hover',
  secondary:
    'bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/20',
  outline:
    'bg-transparent text-primary border border-primary hover:bg-primary/10',
};

/**
 * Render a standalone button as an HTML string for directive embedding.
 *
 * @param text - Button label text
 * @param url - Link URL (must start with / or http:// or https://)
 * @param variant - Visual style: primary (default), secondary, or outline
 */
export function renderButtonHtml(text: string, url: string, variant?: string): string {
  if (!isValidUrl(url)) return '';

  const classes = VARIANT_CLASSES[variant ?? 'primary'] ?? VARIANT_CLASSES.primary;
  const safeText = escapeHtml(text);
  const safeUrl = escapeHtml(url);

  const isExternal = url.startsWith('http://') || url.startsWith('https://');
  const targetAttr = isExternal ? ' target="_blank" rel="noopener"' : '';

  return `<div class="flex justify-center my-6"><a href="${safeUrl}" class="inline-flex items-center px-6 py-3 rounded-lg font-semibold text-sm ${classes} transition-colors no-underline"${targetAttr}>${safeText}</a></div>`;
}
