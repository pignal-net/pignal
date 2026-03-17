import { raw } from 'hono/html';

interface JsonLdProps {
  data: string;
}

/**
 * Render JSON-LD structured data script tag.
 * The `data` parameter must be pre-escaped by seo.ts builders.
 */
export function JsonLd({ data }: JsonLdProps) {
  return raw(`<script type="application/ld+json">${data}</script>`);
}
