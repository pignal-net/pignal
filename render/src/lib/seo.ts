import type { Item } from '@pignal/core';
import type { TemplateSeoHints } from '../types';
import type { SettingsMap } from '@pignal/db';
import { stripMarkdown } from './markdown';

export function resolveOgImage(settings: SettingsMap, sourceUrl: string): string {
  if (settings.source_og_image_url) return settings.source_og_image_url;
  const githubUrl = settings.source_social_github || '';
  const githubUsername = githubUrl.replace(/\/$/, '').split('/').pop() || '';
  return githubUsername
    ? `https://avatars.githubusercontent.com/${githubUsername}?s=400`
    : `${sourceUrl}/og-image.png`;
}

function escapeJsonLd(str: string): string {
  return str.replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

export interface MetaTags {
  title: string;
  description: string;
  canonicalUrl: string;
  ogType: string;
  noIndex?: boolean;
  feedUrl?: string;
  imageUrl?: string;
}

export function buildMetaTags(tags: MetaTags): string {
  const twitterCard = tags.imageUrl ? 'summary_large_image' : 'summary';
  const lines: string[] = [
    `<title>${escapeHtmlAttr(tags.title)}</title>`,
    `<meta name="description" content="${escapeHtmlAttr(tags.description)}">`,
    `<link rel="canonical" href="${escapeHtmlAttr(tags.canonicalUrl)}">`,
    `<meta property="og:type" content="${tags.ogType}">`,
    `<meta property="og:title" content="${escapeHtmlAttr(tags.title)}">`,
    `<meta property="og:description" content="${escapeHtmlAttr(tags.description)}">`,
    `<meta property="og:url" content="${escapeHtmlAttr(tags.canonicalUrl)}">`,
    `<meta name="twitter:card" content="${twitterCard}">`,
    `<meta name="twitter:title" content="${escapeHtmlAttr(tags.title)}">`,
    `<meta name="twitter:description" content="${escapeHtmlAttr(tags.description)}">`,
  ];

  if (tags.imageUrl) {
    lines.push(`<meta property="og:image" content="${escapeHtmlAttr(tags.imageUrl)}">`);
    lines.push(`<meta name="twitter:image" content="${escapeHtmlAttr(tags.imageUrl)}">`);
  }

  if (tags.noIndex) {
    lines.push(`<meta name="robots" content="noindex">`);
  }

  if (tags.feedUrl) {
    lines.push(`<link rel="alternate" type="application/atom+xml" title="Atom Feed" href="${escapeHtmlAttr(tags.feedUrl)}">`);
  }

  return lines.join('\n    ');
}

/** Strip directive syntax from content for use in descriptions/meta tags. */
export function stripDirectives(content: string): string {
  return content.replace(/\{\{[^}]*\}\}/g, '').replace(/\n{3,}/g, '\n\n');
}

export function escapeHtmlAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function buildSourcePostingJsonLd(
  item: Item,
  settings: SettingsMap,
  origin: string,
  description?: string,
  seoHints?: TemplateSeoHints
): string {
  const desc = description ?? stripMarkdown(stripDirectives(item.content)).slice(0, 160);
  const githubUrl = settings.source_social_github || '';
  const domain = new URL(origin).hostname;
  const authorName = settings.owner_name || settings.source_title || domain;
  const schemaType = seoHints?.itemSchemaType ?? 'BlogPosting';
  const isProduct = schemaType === 'Product';

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    // Product uses 'name'; BlogPosting uses 'headline'
    ...(isProduct ? { name: item.keySummary } : { headline: item.keySummary }),
    description: desc,
    author: {
      '@type': 'Person',
      name: authorName,
      ...(githubUrl ? { url: githubUrl, sameAs: githubUrl } : {}),
    },
    datePublished: item.vouchedAt || item.createdAt,
    dateModified: item.updatedAt,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${origin}/item/${item.slug}`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'pignal',
      url: origin,
    },
    ...(isProduct ? {} : { articleSection: item.typeName }),
    ...(item.tags && item.tags.length > 0 ? { keywords: item.tags.join(', ') } : {}),
  };

  return escapeJsonLd(JSON.stringify(data));
}

export function buildSourceJsonLd(settings: SettingsMap, origin: string, seoHints?: TemplateSeoHints): string {
  const githubUrl = settings.source_social_github || '';
  const domain = new URL(origin).hostname;
  const data = {
    '@context': 'https://schema.org',
    '@type': seoHints?.siteSchemaType ?? 'Blog',
    name: settings.source_title || 'My Pignal',
    description: settings.source_description || 'A self-hosted content platform powered by Cloudflare',
    url: origin,
    author: {
      '@type': 'Person',
      name: settings.owner_name || settings.source_title || domain,
      ...(githubUrl ? { url: githubUrl } : {}),
    },
  };

  return escapeJsonLd(JSON.stringify(data));
}
