import { Marked } from 'marked';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isValidUrl(href: string): boolean {
  try {
    const url = new URL(href);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function hasH1(markdown: string): boolean {
  return /^#\s/m.test(markdown);
}

/** Shift all headings down one level when H1 is present. */
export function normalizeHeadings(markdown: string): string {
  if (!hasH1(markdown)) return markdown;

  return markdown.replace(/^(#{1,5})\s/gm, (_, hashes: string) => {
    return '#' + hashes + ' ';
  });
}

/** Strip all HTML tags except safe inline formatting produced by Marked. */
function sanitizeInlineHtml(html: string): string {
  return html.replace(/<\/?(?!(?:strong|em|code|a|del|s)\b)[^>]*>/gi, '');
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]*>/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export interface TocEntry {
  id: string;
  text: string;
  level: number;
}

/**
 * Extract h2/h3 headings from markdown for table of contents.
 * Accepts pre-normalized content to avoid double normalization.
 */
export function extractHeadings(content: string, preNormalized = false): TocEntry[] {
  const normalized = preNormalized ? content : normalizeHeadings(content);
  const entries: TocEntry[] = [];
  const regex = /^(#{2,3})\s+(.+)$/gm;
  let match;
  while ((match = regex.exec(normalized)) !== null) {
    const level = match[1].length;
    const rawText = match[2]
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/`(.+?)`/g, '$1')
      .replace(/\[(.+?)\]\(.+?\)/g, '$1')
      .trim();
    const id = slugify(rawText);
    if (id) entries.push({ id, text: rawText, level });
  }
  return entries;
}

// Module-level singleton — renderer is stateless, no need to recreate per call
const markedInstance = new Marked();
markedInstance.use({
  renderer: {
    heading({ text, depth }: { text: string; depth: number }) {
      const id = slugify(text);
      const safeText = sanitizeInlineHtml(text);
      return `<h${depth} id="${escapeHtml(id)}">${safeText}</h${depth}>\n`;
    },
    link({ href, text }: { href: string; text: string }) {
      if (!isValidUrl(href)) {
        return escapeHtml(text);
      }
      return `<a href="${escapeHtml(href)}" rel="noopener noreferrer">${escapeHtml(text)}</a>`;
    },
    image({ href, text }: { href: string; text: string }) {
      if (!isValidUrl(href)) {
        return escapeHtml(text);
      }
      return `<img src="${escapeHtml(href)}" alt="${escapeHtml(text)}" loading="lazy">`;
    },
    html({ text }: { text: string }) {
      return escapeHtml(text);
    },
    code({ text, lang }: { text: string; lang?: string }) {
      const langAttr = lang ? ` class="language-${escapeHtml(lang)}"` : '';
      return `<pre><code${langAttr}>${escapeHtml(text)}</code></pre>\n`;
    },
    codespan({ text }: { text: string }) {
      return `<code>${escapeHtml(text)}</code>`;
    },
  },
});

/**
 * Render markdown to HTML. Accepts pre-normalized content to avoid
 * double normalization when called alongside extractHeadings.
 */
export function renderMarkdown(content: string, preNormalized = false): string {
  const normalized = preNormalized ? content : normalizeHeadings(content);
  return markedInstance.parse(normalized) as string;
}

/**
 * Strip markdown to plain text (for descriptions, excerpts).
 */
export function stripMarkdown(content: string): string {
  return content
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/!\[.*?\]\(.+?\)/g, '')
    .replace(/^[-*+]\s/gm, '')
    .replace(/^\d+\.\s/gm, '')
    .replace(/\n{2,}/g, ' ')
    .replace(/\n/g, ' ')
    .trim();
}
