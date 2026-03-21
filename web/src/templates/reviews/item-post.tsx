import type { ItemPostProps } from '@pignal/templates';
import { TypeBadge } from '../../components/type-badge';
import { TableOfContents } from '../../components/table-of-contents';
import { SourceActionBar } from '../../components/source-action-bar';
import { JsonLd } from '../../components/json-ld';
import { buildSourcePostingJsonLd, buildMetaTags } from '../../lib/seo';
import { stripMarkdown } from '../../lib/markdown';
import { formatDate, readingTime } from '../../lib/time';
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
    <span class="reviews-stars reviews-stars--large" title={`${score}/${max}`}>
      {'★'.repeat(fullStars)}
      {hasHalf && <span class="reviews-star-half">★</span>}
      {'☆'.repeat(Math.max(0, emptyStars))}
      <span class="reviews-score-text">{score}/{max}</span>
    </span>
  );
}

export function ReviewsItemPost(props: ItemPostProps) {
  const {
    item,
    settings,
    renderedContent,
    headings,
    sourceUrl,
    sourceAuthor,
    githubUrl,
  } = props;

  const sourceTitle = settings.source_title || 'Reviews';
  const showToc = settings.source_show_toc !== 'false';
  const showReadingTime = settings.source_show_reading_time !== 'false';

  const githubUsername = githubUrl.replace(/\/$/, '').split('/').pop() || '';
  const ogImage = githubUsername
    ? `https://avatars.githubusercontent.com/${githubUsername}?s=400`
    : `${sourceUrl}/og-image.png`;

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
    <ReviewsLayout title={item.keySummary} head={metaTags} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings}>
      <JsonLd data={jsonLd} />

      <div class="source-page source-page--post">
        <main class="source-main">
          <SourceActionBar slug={item.slug ?? undefined} sourceUrl={sourceUrl} />

          <article class="source-article reviews-article">
            <header>
              <div class="source-category">
                <TypeBadge typeName={item.typeName} />
                {item.workspaceName && (
                  <a href={`/?workspace=${item.workspaceId}`} class="workspace-badge">{item.workspaceName}</a>
                )}
              </div>
              <h1>{item.keySummary}</h1>
              {rating && (
                <div class="reviews-rating-block">
                  <StarDisplay score={rating.score} max={rating.max} />
                </div>
              )}
              <div class="post-meta">
                {githubUrl ? (
                  <a href={githubUrl} target="_blank" rel="noopener" class="post-author">
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
                  <span class="validation-badge">
                    {item.validationActionLabel} by {sourceAuthor}
                  </span>
                )}
              </div>
            </header>
            <div class="content reviews-content">
              {raw(renderedContent)}
            </div>
            {item.tags && item.tags.length > 0 && (
              <footer class="item-tags-footer">
                <div class="item-tags">
                  {item.tags.map((t) => (
                    <a href={`/?tag=${encodeURIComponent(t)}`} class="item-tag">#{t}</a>
                  ))}
                </div>
              </footer>
            )}
          </article>
        </main>

        {showToc && <TableOfContents headings={headings} />}
      </div>
    </ReviewsLayout>
  );
}
