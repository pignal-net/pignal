import type { Signal } from '@pignal/core';
import type { MetadataResult, SettingsMap, SignalTypeWithActions } from '@pignal/db';
import { toIso8601 } from './time';

/** Maximum URLs per sitemap file (spec allows 50,000; we use 2,500 for fast responses). */
export const SITEMAP_PAGE_SIZE = 2500;

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate robots.txt — minimal, spec-compliant.
 * All bots inherit from the wildcard section. Per-bot overrides only needed
 * when a specific bot should have different rules.
 */
export function generateRobotsTxt(sourceUrl: string): string {
  return `User-agent: *
Allow: /
Disallow: /pignal
Disallow: /api/
Disallow: /s/

Sitemap: ${sourceUrl}/sitemap.xml`;
}

/**
 * Generate a sitemap index referencing paginated sub-sitemaps.
 * Used when total signal count exceeds SITEMAP_PAGE_SIZE.
 */
export function generateSitemapIndex(
  sourceUrl: string,
  totalSignals: number
): string {
  const pages = Math.ceil(totalSignals / SITEMAP_PAGE_SIZE);
  const sitemaps = Array.from({ length: pages }, (_, i) => {
    return `  <sitemap>
    <loc>${escapeXml(sourceUrl)}/sitemap-${i + 1}.xml</loc>
  </sitemap>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.join('\n')}
</sitemapindex>`;
}

/**
 * Generate a single sitemap page with signal URLs.
 * When isFirstPage is true, includes the homepage URL.
 * Filters out signals without slugs defensively.
 */
export function generateSitemap(
  sourceUrl: string,
  signals: Signal[],
  isFirstPage = true
): string {
  const urls: string[] = [];

  if (isFirstPage) {
    urls.push(`  <url>
    <loc>${escapeXml(sourceUrl)}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`);
  }

  for (const s of signals) {
    if (!s.slug) continue;
    urls.push(`  <url>
    <loc>${escapeXml(sourceUrl)}/signal/${escapeXml(s.slug)}</loc>
    <lastmod>${toIso8601(s.updatedAt)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
}

/**
 * Generate llms.txt per llmstxt.org spec — a guide describing this source,
 * not a signal listing. Helps LLMs understand what this site is and how to access it.
 */
export function generateLlmsTxt(
  settings: SettingsMap,
  types: SignalTypeWithActions[],
  totalSignals: number,
  origin: string
): string {
  const title = settings.source_title || 'My Signals';
  const description = settings.source_description || 'Insights captured from AI conversations';
  const ownerName = settings.owner_name || 'Pignal';

  const typeLines = types.length > 0
    ? types.map((t) => `- **${t.name}**: ${t.description || 'No description'}`).join('\n')
    : '- No signal types configured yet';

  return `# ${title}

> ${description}

This is a [pignal](https://github.com/pignal-net/pignal) signal source — a self-hosted knowledge base of structured insights captured from AI conversations, organized by type and workspace.

## About This Source

- **Owner:** ${ownerName}
- **Published signals:** ${totalSignals}
- **Signal types:** ${types.length}

## Signal Types

${typeLines}

## How to Access Content

| Method | URL | Description |
|--------|-----|-------------|
| Browse | ${origin}/ | HTML source page with all published signals |
| Detailed guide | ${origin}/llms-full.txt | Comprehensive guide with types, actions, workspaces |
| Atom feed | ${origin}/feed.xml | Subscribe to new signals |
| REST API | ${origin}/api/public/source | JSON API for programmatic access |
| MCP | ${origin}/mcp | Model Context Protocol endpoint |
| Single signal | ${origin}/signal/{slug} | Individual signal page (HTML) |
| Raw markdown | ${origin}/signal/{slug}.md | Individual signal as markdown |`;
}

interface QualityGuidelines {
  keySummary?: { tips?: string };
  content?: { tips?: string };
  formatting?: string[];
  avoid?: string[];
}

interface ValidationLimits {
  keySummary?: { min?: number; max?: number };
  content?: { max?: number };
}

function parseJsonSetting<T>(value: string | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

/**
 * Generate llms-full.txt — comprehensive guide about this pignal source.
 * Covers what pignal is, how to use the source effectively, detailed signal types
 * with guidance and validation actions, workspaces, quality guidelines, and all access methods.
 */
export function generateLlmsFullTxt(
  metadata: MetadataResult,
  totalSignals: number,
  origin: string
): string {
  const { types, workspaces, settings } = metadata;
  const title = settings.source_title || 'My Signals';
  const description = settings.source_description || 'Insights captured from AI conversations';
  const ownerName = settings.owner_name || 'Pignal';

  const guidelines = parseJsonSetting<QualityGuidelines>(settings.quality_guidelines, {});
  const limits = parseJsonSetting<ValidationLimits>(settings.validation_limits, {});

  const sections: string[] = [];

  // Header
  sections.push(`# ${title} — Full Guide`);
  sections.push('');
  sections.push(`> ${description}`);
  sections.push('');

  // What is pignal
  sections.push('## What is pignal?');
  sections.push('');
  sections.push('pignal is an open-source, self-hosted knowledge base for capturing structured insights (called "signals") from AI conversations. Each signal has a type, optional workspace, and goes through a visibility lifecycle: private → unlisted → vouched (public).');
  sections.push('');
  sections.push(`This source is owned by **${ownerName}** and currently has **${totalSignals}** published signals across **${types.length}** types.`);
  sections.push('');

  // Signal types with full detail
  sections.push('## Signal Types');
  sections.push('');
  if (types.length === 0) {
    sections.push('No signal types configured yet.');
  } else {
    for (const t of types) {
      sections.push(`### ${t.icon ?? '•'} ${t.name}`);
      sections.push('');
      if (t.description) sections.push(t.description);
      if (t.description) sections.push('');
      if (t.guidance) {
        if (t.guidance.whenToUse) sections.push(`- **When to use:** ${t.guidance.whenToUse}`);
        if (t.guidance.pattern) sections.push(`- **Key summary pattern:** "${t.guidance.pattern}"`);
        if (t.guidance.example) sections.push(`- **Example:** "${t.guidance.example}"`);
        if (t.guidance.contentHints) sections.push(`- **Content tip:** ${t.guidance.contentHints}`);
        sections.push('');
      }
      if (t.actions.length > 0) {
        sections.push('**Validation actions:**');
        for (const a of t.actions) {
          sections.push(`- ${a.label}`);
        }
        sections.push('');
      }
    }
  }

  // Workspaces
  if (workspaces.length > 0) {
    sections.push('## Workspaces');
    sections.push('');
    sections.push('Workspaces organize signals by project or context:');
    sections.push('');
    for (const w of workspaces) {
      sections.push(`- **${w.name}**${w.description ? `: ${w.description}` : ''}`);
    }
    sections.push('');
  }

  // Quality guidelines
  const ktMin = limits.keySummary?.min ?? 20;
  const ktMax = limits.keySummary?.max ?? 140;
  const cMax = limits.content?.max ?? 10000;

  sections.push('## Quality Guidelines');
  sections.push('');
  sections.push(`**Key summary** (${ktMin}–${ktMax} characters): A concise, descriptive title for the signal.`);
  if (guidelines.keySummary?.tips) sections.push(`- ${guidelines.keySummary.tips}`);
  sections.push('');
  sections.push(`**Content** (up to ${cMax.toLocaleString()} characters): The full body of the signal in markdown.`);
  if (guidelines.content?.tips) sections.push(`- ${guidelines.content.tips}`);
  sections.push('');

  if (guidelines.formatting?.length) {
    sections.push('**Formatting guidance:**');
    for (const fmt of guidelines.formatting) {
      sections.push(`- ${fmt}`);
    }
    sections.push('');
  }

  if (guidelines.avoid?.length) {
    sections.push('**Avoid:**');
    for (const item of guidelines.avoid) {
      sections.push(`- ${item}`);
    }
    sections.push('');
  }

  // Access methods
  sections.push('## How to Access This Source');
  sections.push('');
  sections.push(`| Method | URL | Description |`);
  sections.push(`|--------|-----|-------------|`);
  sections.push(`| Browse | ${origin}/ | HTML source page with all published signals |`);
  sections.push(`| Atom feed | ${origin}/feed.xml | Subscribe to new signals |`);
  sections.push(`| REST API | ${origin}/api/public/source | JSON API for programmatic access |`);
  sections.push(`| MCP | ${origin}/mcp | Model Context Protocol endpoint for AI tools |`);
  sections.push(`| Single signal | ${origin}/signal/{slug} | Individual signal page (HTML) |`);
  sections.push(`| Raw markdown | ${origin}/signal/{slug}.md | Individual signal as markdown |`);
  sections.push(`| Summary | ${origin}/llms.txt | Concise source summary for LLMs |`);
  sections.push('');

  // MCP tools
  sections.push('## MCP Tools');
  sections.push('');
  sections.push('Connect to this source via MCP at `' + origin + '/mcp` to use these tools:');
  sections.push('');
  sections.push('- **save_signal** — Create a new signal with type, workspace, key summary, and content');
  sections.push('- **list_signals** — Browse and filter signals by type, workspace, or search query');
  sections.push('- **search_signals** — Full-text search across all signals');
  sections.push('- **validate_signal** — Apply or clear a validation action on a signal');
  sections.push('- **get_metadata** — Retrieve types, workspaces, and quality guidelines');

  return sections.join('\n');
}
