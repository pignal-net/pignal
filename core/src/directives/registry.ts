import type { SiteActionSelect, SettingsMap, ItemWithMeta } from '@pignal/db';

/** Parsed directive from content: {{name:positional key="value" key2="value2"}} */
export interface DirectiveParams {
  /** Directive name: "action", "cta", "testimonials" */
  name: string;
  /** Positional parameter after the colon: "contact" in {{action:contact}} */
  positional: string;
  /** Named key="value" parameters */
  named: Record<string, string>;
}

/** Runtime context available to all directive handlers */
export interface DirectiveContext {
  /** Available site actions by slug */
  actions: Map<string, SiteActionSelect>;
  /** Site settings */
  settings: SettingsMap;
  /** Items available for rendering (e.g., testimonials) */
  items?: ItemWithMeta[];
  /** Base URL of the source */
  sourceUrl: string;
}

/** Interface for directive handlers. Implement to add new directive types. */
export interface DirectiveHandler {
  /** Unique directive name (e.g., "action", "cta", "testimonials") */
  name: string;
  /** Render the directive to HTML string. Return null to leave the directive text unchanged. */
  render(params: DirectiveParams, context: DirectiveContext): string | null;
}

/**
 * Parse the inner content of a `{{...}}` directive into structured params.
 *
 * Supported forms:
 * - `name`
 * - `name:positional`
 * - `name:positional key="value"`
 * - `name:key1="val1" key2="val2"`
 */
/**
 * Unescape HTML entities and strip HTML tags from directive inner content.
 * Markdown rendering escapes quotes to &quot; and may convert URLs to <a> tags
 * before directives are processed.
 */
function cleanDirectiveContent(raw: string): string {
  return raw
    // Strip HTML tags (e.g., <a href="...">url</a> → url)
    .replace(/<[^>]+>/g, '')
    // Unescape HTML entities produced by markdown rendering
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'");
}

function parseDirectiveContent(raw: string): DirectiveParams | null {
  const trimmed = cleanDirectiveContent(raw).trim();
  if (trimmed.length === 0) {
    return null;
  }

  // The name is everything up to the first colon or whitespace
  const nameMatch = /^([a-zA-Z_][\w-]*)/.exec(trimmed);
  if (!nameMatch) {
    return null;
  }

  const name = nameMatch[1];
  let rest = trimmed.slice(name.length);

  let positional = '';

  // Check for colon-separated positional parameter
  if (rest.startsWith(':')) {
    rest = rest.slice(1); // remove the colon

    // Positional is everything up to the first whitespace or end,
    // but must not contain '=' (that would be a named param like key="val")
    const posMatch = /^([^\s=]+)/.exec(rest);
    if (posMatch) {
      // Only treat as positional if the next char after it isn't '='
      const afterCandidate = rest.slice(posMatch[1].length);
      if (!afterCandidate.startsWith('=')) {
        positional = posMatch[1];
        rest = rest.slice(positional.length);
      }
    }
  }

  // Parse named parameters: key="value" or key=value (unquoted)
  // Handles both space-separated and immediately after colon
  const named: Record<string, string> = {};
  const namedRegex = /(?:^|\s)([a-zA-Z_][\w-]*)=(?:"([^"]*)"|(\S+))/g;
  let match: RegExpExecArray | null;

  while ((match = namedRegex.exec(rest)) !== null) {
    named[match[1]] = match[2] !== undefined ? match[2] : match[3];
  }

  return { name, positional, named };
}

/**
 * Registry for directive handlers that process `{{...}}` patterns in rendered HTML content.
 *
 * Directives are embedded in markdown content and survive markdown rendering as plain text
 * (typically inside `<p>` tags). The `process()` method finds and replaces them with
 * rendered HTML from registered handlers.
 */
export class DirectiveRegistry {
  private handlers = new Map<string, DirectiveHandler>();

  /** Register a directive handler. Replaces existing handler with same name. */
  register(handler: DirectiveHandler): void {
    this.handlers.set(handler.name, handler);
  }

  /** Remove a handler by name. */
  unregister(name: string): void {
    this.handlers.delete(name);
  }

  /** Check if a handler is registered for the given name. */
  has(name: string): boolean {
    return this.handlers.has(name);
  }

  /** Get a handler by name. */
  get(name: string): DirectiveHandler | undefined {
    return this.handlers.get(name);
  }

  /** List all registered handler names. */
  names(): string[] {
    return [...this.handlers.keys()];
  }

  /**
   * Extract directives from raw markdown BEFORE markdown rendering.
   * Returns the markdown with directives replaced by unique placeholders,
   * plus a map of placeholder → parsed params for later rendering.
   *
   * This prevents markdown from escaping quotes and auto-linking URLs
   * inside directive parameters.
   */
  extractFromMarkdown(markdown: string): {
    markdown: string;
    extracted: Map<string, { params: DirectiveParams; original: string }>;
  } {
    const extracted = new Map<string, { params: DirectiveParams; original: string }>();
    let counter = 0;

    // Split by fenced code blocks to avoid extracting directives from code examples.
    // Odd-indexed segments are inside code fences and should be left untouched.
    const segments = markdown.split(/(```[\s\S]*?```)/g);

    const processed = segments
      .map((segment, i) => {
        // Odd segments are code blocks — skip
        if (i % 2 === 1) return segment;

        // Also skip inline code spans (`...`)
        // Split by inline code, process only non-code parts
        const inlineParts = segment.split(/(`[^`]+`)/g);
        return inlineParts
          .map((part, j) => {
            if (j % 2 === 1) return part; // inside inline code
            return part.replace(
              /\{\{([^}]+)\}\}/g,
              (fullMatch: string, innerContent: string): string => {
                const params = parseDirectiveContent(innerContent);
                if (!params || !this.handlers.has(params.name)) {
                  return fullMatch;
                }
                const placeholder = `PIGNAL_DIRECTIVE_${counter++}`;
                extracted.set(placeholder, { params, original: fullMatch });
                return placeholder;
              },
            );
          })
          .join('');
      })
      .join('');

    return { markdown: processed, extracted };
  }

  /**
   * Replace directive placeholders in rendered HTML with rendered output.
   * Called AFTER markdown rendering on HTML that contains placeholders
   * from `extractFromMarkdown()`.
   *
   * When a placeholder is the sole content of a `<p>` tag, the wrapping
   * `<p>` tag is stripped since rendered directives are typically block elements.
   */
  renderPlaceholders(
    html: string,
    extracted: Map<string, { params: DirectiveParams; original: string }>,
    context: DirectiveContext,
  ): string {
    for (const [placeholder, { params, original }] of extracted) {
      const handler = this.handlers.get(params.name);
      const rendered = handler ? handler.render(params, context) : null;

      // Use rendered HTML, or restore original directive text if handler returns null
      const replacement = rendered ?? original;

      // Replace placeholder, stripping <p> wrapper if the placeholder is the only content
      const pWrapped = new RegExp(`<p>\\s*${placeholder}\\s*</p>`);
      if (pWrapped.test(html)) {
        html = html.replace(pWrapped, replacement);
      } else {
        html = html.replace(placeholder, replacement);
      }
    }
    return html;
  }

  /**
   * Process HTML content, replacing all directives with rendered output.
   * This is the post-render approach — works for simple directives but
   * may fail when markdown escapes quotes or converts URLs in complex directives.
   *
   * Prefer the two-step approach: `extractFromMarkdown()` + `renderPlaceholders()`.
   */
  process(html: string, context: DirectiveContext): string {
    const directiveRegex = /(<p>\s*)?(\{\{([^}]+)\}\})(\s*<\/p>)?/g;

    return html.replace(
      directiveRegex,
      (
        fullMatch: string,
        openP: string | undefined,
        _directiveWithBraces: string,
        innerContent: string,
        closeP: string | undefined,
      ): string => {
        const params = parseDirectiveContent(innerContent);
        if (!params) {
          return fullMatch;
        }

        const handler = this.handlers.get(params.name);
        if (!handler) {
          return fullMatch;
        }

        const rendered = handler.render(params, context);
        if (rendered === null) {
          return fullMatch;
        }

        const isWrappedInP = openP !== undefined && closeP !== undefined;
        if (isWrappedInP) {
          return rendered;
        }

        return rendered;
      },
    );
  }
}

/** Create a DirectiveRegistry with no handlers registered. */
export function createDirectiveRegistry(): DirectiveRegistry {
  return new DirectiveRegistry();
}
