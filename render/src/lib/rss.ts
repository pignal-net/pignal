import type { Item } from '@pignal/core';
import type { TemplateVocabulary } from '../types';
import type { SettingsMap } from '@pignal/db';
import { toIso8601 } from './time';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate an Atom XML feed from public items.
 * Includes only metadata — no full content. Readers follow links for details.
 */
export function generateAtomFeed(
  settings: SettingsMap,
  items: Item[],
  origin: string,
  vocabulary?: TemplateVocabulary
): string {
  const v = vocabulary ?? { itemPlural: 'items' };
  const sourceUrl = origin;
  const title = settings.source_title || 'My Pignal';
  const description = settings.source_description || `A self-hosted platform for publishing ${v.itemPlural}`;
  const author = settings.owner_name || 'Pignal';
  const githubUrl = settings.source_social_github || '';
  const authorUri = githubUrl ? `\n    <uri>${escapeXml(githubUrl)}</uri>` : '';
  const updated = items.length > 0
    ? toIso8601(items[0].updatedAt)
    : new Date().toISOString();

  const entries = items.map((t) => {
    const itemUrl = `${sourceUrl}/item/${t.slug ?? ''}`;
    const tags = t.tags ?? [];
    const categories = [`    <category term="${escapeXml(t.typeName)}"/>`];
    for (const tag of tags) {
      categories.push(`    <category term="${escapeXml(tag)}"/>`);
    }
    return `  <entry>
    <title>${escapeXml(t.keySummary)}</title>
    <link href="${escapeXml(itemUrl)}" rel="alternate" type="text/html"/>
    <link href="${escapeXml(itemUrl)}.md" rel="related" type="text/markdown" title="Markdown"/>
    <id>${escapeXml(itemUrl)}</id>
    <published>${toIso8601(t.vouchedAt || t.createdAt)}</published>
    <updated>${toIso8601(t.updatedAt)}</updated>
    <author><name>${escapeXml(author)}</name>${authorUri}</author>
${categories.join('\n')}
    <summary type="text">${escapeXml(t.keySummary)}</summary>
  </entry>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXml(title)}</title>
  <subtitle>${escapeXml(description)}</subtitle>
  <link href="${escapeXml(sourceUrl)}/feed.xml" rel="self" type="application/atom+xml"/>
  <link href="${escapeXml(sourceUrl)}/" rel="alternate" type="text/html"/>
  <id>${escapeXml(sourceUrl)}/</id>
  <updated>${updated}</updated>
  <author><name>${escapeXml(author)}</name>${authorUri}</author>
${entries.join('\n')}
</feed>`;
}
