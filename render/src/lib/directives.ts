import { renderMarkdown, normalizeHeadings, extractHeadings } from './markdown';
import type { TocEntry } from './markdown';
import { createDirectiveRegistry } from '@pignal/core/directives/registry';
import type { DirectiveHandler, DirectiveContext } from '@pignal/core/directives/registry';
import { renderTestimonialsHtml } from '../components/testimonials';
import { renderActionFormHtml } from '../components/action-form';

/** Escape HTML attribute values. */
function escapeAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** The action directive handler -- renders an ActionForm as inline HTML. */
export const actionDirectiveHandler: DirectiveHandler = {
  name: 'action',
  render(params, context) {
    const action = context.actions.get(params.positional);
    if (!action || action.status !== 'active') return ''; // hide gracefully
    return renderActionFormHtml(action);
  },
};

/**
 * Render an inline CTA block as an HTML string for directive embedding.
 * Supports either a URL link or an action form via HTMX.
 */
function renderInlineCtaHtml(
  title: string,
  buttonText: string,
  opts: { description?: string; url?: string; action?: string },
): string {
  const safeTitle = escapeAttr(title);
  const safeButton = escapeAttr(buttonText);
  const descHtml = opts.description
    ? `<p class="text-muted mt-2">${escapeAttr(opts.description)}</p>`
    : '';

  let buttonHtml: string;
  if (opts.action) {
    const safeSlug = escapeAttr(opts.action);
    const targetId = `cta-form-${opts.action.replace(/[^a-z0-9-]/g, '')}`;
    buttonHtml = `<button type="button" class="bg-primary text-primary-inverse rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-primary-hover transition-colors mt-4 inline-block" hx-get="/form/${safeSlug}" hx-target="#${targetId}" hx-swap="innerHTML">${safeButton}</button><div id="${targetId}" class="mt-4"></div>`;
  } else if (opts.url) {
    const safeUrl = escapeAttr(opts.url);
    buttonHtml = `<a href="${safeUrl}" class="bg-primary text-primary-inverse rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-primary-hover transition-colors mt-4 inline-block" target="_blank" rel="noopener">${safeButton}</a>`;
  } else {
    buttonHtml = `<span class="bg-primary text-primary-inverse rounded-lg px-6 py-2.5 text-sm font-medium mt-4 inline-block">${safeButton}</span>`;
  }

  return `<div class="bg-surface rounded-xl border border-border-subtle shadow-card p-6"><h3 class="text-lg font-semibold text-text">${safeTitle}</h3>${descHtml}${buttonHtml}</div>`;
}

/**
 * The CTA directive handler — renders an inline CTA card.
 *
 * Syntax: {{cta:title="..." button="..." url="..." description="..." action="..."}}
 *
 * - `title` (required): CTA heading text
 * - `button` (required): Button label
 * - `url`: External link (mutually exclusive with `action`)
 * - `action`: Action slug to load form inline via HTMX
 * - `description`: Optional subtext
 */
export const ctaDirectiveHandler: DirectiveHandler = {
  name: 'cta',
  render(params, _context) {
    const { title, description, button, action, url } = params.named;
    if (!title || !button) return null;
    return renderInlineCtaHtml(title, button, { description, url, action });
  },
};

/**
 * The testimonials directive handler — renders a grid of testimonial cards.
 *
 * Syntax:
 * - `{{testimonials}}` — render all testimonial items
 * - `{{testimonials limit="3"}}` — limit to 3 items
 * - `{{testimonials type="Testimonial"}}` — filter by type name
 * - `{{testimonials type="Testimonial" limit="6"}}` — combine filters
 *
 * Requires `items` in the DirectiveContext (populated from vouched items matching
 * the `testimonial_type_name` setting).
 */
export const testimonialsDirectiveHandler: DirectiveHandler = {
  name: 'testimonials',
  render(params, context) {
    if (!context.items || context.items.length === 0) return ''; // hide gracefully

    // Parse optional params
    const limit = params.named.limit ? parseInt(params.named.limit, 10) : undefined;
    const typeName = params.named.type;

    // Filter items by type name if specified
    let filteredItems = context.items;
    if (typeName) {
      filteredItems = filteredItems.filter((item) => item.typeName === typeName);
    }

    if (filteredItems.length === 0) return null;

    return renderTestimonialsHtml(filteredItems, limit);
  },
};

/**
 * Render markdown content with directive processing.
 *
 * Processes `{{action:slug}}`, `{{cta:...}}`, and `{{testimonials}}` directives
 * by replacing them with rendered HTML.
 * Returns both the processed HTML and extracted headings for table of contents.
 */
export function renderContentWithDirectives(
  content: string,
  context: DirectiveContext,
): { html: string; headings: TocEntry[] } {
  // Create registry with built-in handlers
  const registry = createDirectiveRegistry();
  registry.register(actionDirectiveHandler);
  registry.register(ctaDirectiveHandler);
  registry.register(testimonialsDirectiveHandler);

  const normalized = normalizeHeadings(content);

  // Two-step approach: extract directives BEFORE markdown rendering
  // to prevent markdown from escaping quotes and auto-linking URLs
  // inside directive parameters.
  const { markdown: safeMarkdown, extracted } = registry.extractFromMarkdown(normalized);

  const headings = extractHeadings(safeMarkdown, true);
  let html = renderMarkdown(safeMarkdown, true);

  // Replace placeholders with rendered directive HTML
  html = registry.renderPlaceholders(html, extracted, context);

  return { html, headings };
}
