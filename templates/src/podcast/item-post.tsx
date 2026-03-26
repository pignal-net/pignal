/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */
import type { ItemPostProps } from '../types';
import { TypeBadge } from '@pignal/render/components/type-badge';
import { SourceActionBar } from '@pignal/render/components/source-action-bar';
import { JsonLd } from '@pignal/render/components/json-ld';
import { buildSourcePostingJsonLd, buildMetaTags, resolveOgImage } from '@pignal/render/lib/seo';
import { stripMarkdown } from '@pignal/render/lib/markdown';
import { formatDate } from '@pignal/render/lib/time';
import { raw } from 'hono/html';
import { PodcastLayout } from './layout';

/**
 * Extract duration from content.
 */
function extractDuration(content: string): string | null {
  const minMatch = content.match(/(?:duration|length|runtime|time)\s*[:=]\s*(\d+)\s*(?:min|m)\b/i);
  if (minMatch) {
    const mins = parseInt(minMatch[1], 10);
    if (mins >= 60) {
      return `${Math.floor(mins / 60)}h ${mins % 60}m`;
    }
    return `${mins} min`;
  }
  const timeMatch = content.match(/(?:duration|length|runtime|time)\s*[:=]\s*(\d{1,2}:\d{2}(?::\d{2})?)/i);
  if (timeMatch) {
    return timeMatch[1];
  }
  return null;
}

export function PodcastItemPost(props: ItemPostProps) {
  const {
    item,
    settings,
    renderedContent,
    sourceUrl,
    sourceAuthor,
    githubUrl,
  } = props;

  const sourceTitle = settings.source_title || 'Podcast';

  const ogImage = resolveOgImage(settings, sourceUrl);

  const description = stripMarkdown(item.content).slice(0, 160);
  const jsonLd = buildSourcePostingJsonLd(item, settings, sourceUrl, description, props.seo);
  const metaTags = buildMetaTags({
    title: `${item.keySummary} | ${sourceTitle}`,
    description,
    canonicalUrl: `${sourceUrl}/item/${item.slug}`,
    ogType: 'article',
    feedUrl: `${sourceUrl}/feed.xml`,
    imageUrl: ogImage,
  });

  const duration = extractDuration(item.content);

  return (
    <PodcastLayout title={item.keySummary} head={metaTags} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings} visitor={props.visitor}>
      <JsonLd data={jsonLd} />

      <div class="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-16 w-full fade-in-page">
        <main class="min-w-0 max-w-full break-words">
          <SourceActionBar slug={item.slug ?? undefined} sourceUrl={sourceUrl} t={props.t} />

          <article class="source-article min-w-0 max-w-full">
            <header class="mb-4">
              <div class="mb-4 flex items-center gap-2 flex-wrap">
                <TypeBadge typeName={item.typeName} />
                {item.workspaceName && (
                  <a href={`/?workspace=${item.workspaceId}`} class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary no-underline hover:bg-primary/15 transition-colors">{item.workspaceName}</a>
                )}
              </div>
              <h1 class="text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-4">{item.keySummary}</h1>
              <div class="flex items-center gap-3 flex-wrap text-sm text-muted">
                {githubUrl ? (
                  <a href={githubUrl} target="_blank" rel="noopener" class="font-medium text-text hover:text-primary transition-colors">
                    {sourceAuthor}
                  </a>
                ) : (
                  <span>{sourceAuthor}</span>
                )}
                <time datetime={item.vouchedAt || item.createdAt}>
                  {formatDate(item.vouchedAt || item.createdAt)}
                </time>
                {duration && (
                  <span class="inline-flex items-center gap-1 text-sm font-medium text-primary" aria-label={`Duration: ${duration}`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    {duration}
                  </span>
                )}
                {item.validationActionLabel && (
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-success/80 bg-success/10">
                    {item.validationActionLabel} by {sourceAuthor}
                  </span>
                )}
              </div>
            </header>

            <div class="flex items-center gap-3 p-4 mb-6 bg-surface-raised border border-border-subtle shadow-card rounded-xl text-sm text-muted">
              <div class="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-inverse shrink-0 text-base" aria-hidden="true">&#9654;</div>
              <span>Audio player not available in preview</span>
            </div>

            <div class="content leading-relaxed">
              <h2 class="text-sm uppercase tracking-widest text-muted mb-4 pb-2 border-b border-border-subtle font-semibold">Show Notes</h2>
              {raw(renderedContent)}
            </div>
            {item.tags && item.tags.length > 0 && (
              <footer class="mt-10 pt-6 border-t border-border-subtle">
                <div class="flex flex-wrap gap-2">
                  {item.tags.map((t) => (
                    <a href={`/?tag=${encodeURIComponent(t)}`} class="inline-flex items-center rounded-full text-sm px-2.5 py-0.5 no-underline text-muted hover:bg-primary/5 hover:text-primary transition-colors border border-border-subtle">#{t}</a>
                  ))}
                </div>
              </footer>
            )}
          </article>
        </main>
        {/* No table of contents for podcast — show notes are the content */}
      </div>
    </PodcastLayout>
  );
}
