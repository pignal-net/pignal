import type { Signal } from '@pignal/core';
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
 * Generate an Atom XML feed from public signals.
 * Includes only metadata — no full content. Readers follow links for details.
 */
export function generateAtomFeed(
  settings: SettingsMap,
  signals: Signal[],
  origin: string
): string {
  const sourceUrl = origin;
  const title = settings.source_title || 'My Signals';
  const description = settings.source_description || 'Insights captured from AI conversations';
  const author = settings.owner_name || 'Pignal';
  const githubUrl = settings.source_social_github || '';
  const authorUri = githubUrl ? `\n    <uri>${escapeXml(githubUrl)}</uri>` : '';
  const updated = signals.length > 0
    ? toIso8601(signals[0].updatedAt)
    : new Date().toISOString();

  const entries = signals.map((t) => {
    const signalUrl = `${sourceUrl}/signal/${t.slug ?? ''}`;
    const tags = t.tags ?? [];
    const categories = [`    <category term="${escapeXml(t.typeName)}"/>`];
    for (const tag of tags) {
      categories.push(`    <category term="${escapeXml(tag)}"/>`);
    }
    return `  <entry>
    <title>${escapeXml(t.keySummary)}</title>
    <link href="${escapeXml(signalUrl)}" rel="alternate" type="text/html"/>
    <link href="${escapeXml(signalUrl)}.md" rel="related" type="text/markdown" title="Markdown"/>
    <id>${escapeXml(signalUrl)}</id>
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
