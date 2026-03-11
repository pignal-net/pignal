import type { Signal } from '@pignal/core';
import type { SettingsMap } from '@pignal/db';
import { stripMarkdown } from './markdown';

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
}

export function buildMetaTags(tags: MetaTags): string {
  const lines: string[] = [
    `<title>${escapeHtmlAttr(tags.title)}</title>`,
    `<meta name="description" content="${escapeHtmlAttr(tags.description)}">`,
    `<link rel="canonical" href="${escapeHtmlAttr(tags.canonicalUrl)}">`,
    `<meta property="og:type" content="${tags.ogType}">`,
    `<meta property="og:title" content="${escapeHtmlAttr(tags.title)}">`,
    `<meta property="og:description" content="${escapeHtmlAttr(tags.description)}">`,
    `<meta property="og:url" content="${escapeHtmlAttr(tags.canonicalUrl)}">`,
    `<meta name="twitter:card" content="summary">`,
    `<meta name="twitter:title" content="${escapeHtmlAttr(tags.title)}">`,
    `<meta name="twitter:description" content="${escapeHtmlAttr(tags.description)}">`,
  ];

  if (tags.noIndex) {
    lines.push(`<meta name="robots" content="noindex">`);
  }

  if (tags.feedUrl) {
    lines.push(`<link rel="alternate" type="application/atom+xml" title="Atom Feed" href="${escapeHtmlAttr(tags.feedUrl)}">`);
  }

  return lines.join('\n    ');
}

export function escapeHtmlAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function buildSourcePostingJsonLd(
  signal: Signal,
  settings: SettingsMap,
  origin: string,
  description?: string
): string {
  const desc = description ?? stripMarkdown(signal.content).slice(0, 160);
  const githubUrl = settings.source_social_github || '';
  const domain = new URL(origin).hostname;
  const authorName = settings.owner_name || settings.source_title || domain;
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: signal.keySummary,
    description: desc,
    author: {
      '@type': 'Person',
      name: authorName,
      ...(githubUrl ? { url: githubUrl, sameAs: githubUrl } : {}),
    },
    datePublished: signal.vouchedAt || signal.createdAt,
    dateModified: signal.updatedAt,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${origin}/signal/${signal.slug}`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'pignal',
      url: origin,
    },
    articleSection: signal.typeName,
    ...(signal.validationActionLabel ? {
      review: {
        '@type': 'Review',
        author: { '@type': 'Person', name: authorName },
        reviewBody: `${signal.validationActionLabel} by ${authorName}`,
      },
      editorialNote: `Human-validated: ${signal.validationActionLabel}`,
    } : {}),
    creativeWorkStatus: 'Published',
  };

  return escapeJsonLd(JSON.stringify(data));
}

export function buildSourceJsonLd(settings: SettingsMap, origin: string): string {
  const githubUrl = settings.source_social_github || '';
  const domain = new URL(origin).hostname;
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: settings.source_title || 'My Signals',
    description: settings.source_description || 'Insights captured from AI conversations',
    url: origin,
    author: {
      '@type': 'Person',
      name: settings.owner_name || settings.source_title || domain,
      ...(githubUrl ? { url: githubUrl } : {}),
    },
  };

  return escapeJsonLd(JSON.stringify(data));
}
