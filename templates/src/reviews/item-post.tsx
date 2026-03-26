/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */
import type { ItemPostProps } from '../types';
import { TypeBadge } from '@pignal/render/components/type-badge';

import { SourceActionBar } from '@pignal/render/components/source-action-bar';
import { JsonLd } from '@pignal/render/components/json-ld';
import { buildSourcePostingJsonLd, buildMetaTags, resolveOgImage } from '@pignal/render/lib/seo';
import { stripMarkdown } from '@pignal/render/lib/markdown';
import { formatDate, readingTime } from '@pignal/render/lib/time';
import { raw } from 'hono/html';
import { ReviewsLayout } from './layout';

/**
 * Extract a numeric rating from item content.
 */
function extractRating(content: string): { score: number; max: number } | null {
  const ratingMatch = content.match(/(?:rating|score|grade)\s*[:=]\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+)/i);
  if (ratingMatch) {
    return { score: parseFloat(ratingMatch[1]), max: parseInt(ratingMatch[2], 10) };
  }
  const starMatch = content.match(/[★]{1,5}/);
  if (starMatch) {
    return { score: starMatch[0].length, max: 5 };
  }
  return null;
}

function StarDisplay({ score, max }: { score: number; max: number }) {
  const normalized = (score / max) * 5;
  const fullStars = Math.floor(normalized);
  const hasHalf = normalized - fullStars >= 0.25 && normalized - fullStars < 0.75;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return (
    <span class="inline-flex items-center gap-px text-primary text-xl tracking-wider" role="img" aria-label={`Rating: ${score} out of ${max}`} title={`${score}/${max}`}>
      {'★'.repeat(fullStars)}
      {hasHalf && <span class="opacity-40">★</span>}
      {'☆'.repeat(Math.max(0, emptyStars))}
      <span class="text-sm text-muted ml-1.5" aria-hidden="true">{score}/{max}</span>
    </span>
  );
}

export function ReviewsItemPost(props: ItemPostProps) {
  const {
    item,
    settings,
    renderedContent,
    headings: _headings,
    sourceUrl,
    sourceAuthor,
    githubUrl,
  } = props;

  const sourceTitle = settings.source_title || 'Reviews';
  const showReadingTime = settings.source_show_reading_time !== 'false';

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

  const rating = extractRating(item.content);

  return (
    <ReviewsLayout title={item.keySummary} head={metaTags} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings} t={props.t} locale={props.locale} defaultLocale={props.defaultLocale} visitor={props.visitor}>
      <JsonLd data={jsonLd} />

      <div class="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-16 w-full">
        <main class="min-w-0 max-w-full break-words">
          <SourceActionBar slug={item.slug ?? undefined} sourceUrl={sourceUrl} t={props.t} />

          <article class="source-article min-w-0 max-w-full">
            <header>
              <div class="mb-4">
                <TypeBadge typeName={item.typeName} />
                {item.workspaceName && (
                  <a href={`/?workspace=${item.workspaceId}`} class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary ml-2">{item.workspaceName}</a>
                )}
              </div>
              <h1 class="text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-4">{item.keySummary}</h1>
              {rating && (
                <div class="my-2 mb-3">
                  <StarDisplay score={rating.score} max={rating.max} />
                </div>
              )}
              <div class="flex items-center gap-2.5 flex-wrap text-sm text-muted">
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
                {showReadingTime && <span>{readingTime(item.content)}</span>}
                {item.validationActionLabel && (
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-success/80 bg-success/10">
                    {item.validationActionLabel} by {sourceAuthor}
                  </span>
                )}
              </div>
            </header>
            <div class="content mt-8">
              {raw(renderedContent)}
            </div>
            {item.tags && item.tags.length > 0 && (
              <footer class="mt-10 pt-6 border-t border-border-subtle">
                <div class="flex flex-wrap gap-2">
                  {item.tags.map((t) => (
                    <a href={`/?tag=${encodeURIComponent(t)}`} class="inline-block px-3 py-1 rounded-full text-sm font-medium text-muted no-underline border border-border-subtle hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-colors">#{t}</a>
                  ))}
                </div>
              </footer>
            )}
          </article>
        </main>
      </div>
    </ReviewsLayout>
  );
}
