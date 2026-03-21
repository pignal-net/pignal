import type { SourcePageProps } from '@pignal/templates';
import { FilterBar } from '../../components/type-sidebar';
import { Pagination } from '../../components/pagination';
import { TypeBadge } from '../../components/type-badge';
import { JsonLd } from '../../components/json-ld';
import { buildSourceJsonLd, buildMetaTags, escapeHtmlAttr } from '../../lib/seo';
import { formatDate } from '../../lib/time';
import { stripMarkdown } from '../../lib/markdown';
import { ReviewsLayout } from './layout';

/**
 * Extract a numeric rating from item content.
 * Looks for patterns like "Rating: 4/5", "Score: 8/10", "★★★★☆", etc.
 */
function extractRating(content: string): { score: number; max: number } | null {
  // Match "Rating: X/Y" or "Score: X/Y"
  const ratingMatch = content.match(/(?:rating|score|grade)\s*[:=]\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+)/i);
  if (ratingMatch) {
    return { score: parseFloat(ratingMatch[1]), max: parseInt(ratingMatch[2], 10) };
  }

  // Count filled stars
  const starMatch = content.match(/[★]{1,5}/);
  if (starMatch) {
    return { score: starMatch[0].length, max: 5 };
  }

  return null;
}

function StarDisplay({ score, max }: { score: number; max: number }) {
  // Normalize to 5-star scale
  const normalized = (score / max) * 5;
  const fullStars = Math.floor(normalized);
  const hasHalf = normalized - fullStars >= 0.25 && normalized - fullStars < 0.75;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return (
    <span class="reviews-stars" title={`${score}/${max}`}>
      {'★'.repeat(fullStars)}
      {hasHalf && <span class="reviews-star-half">★</span>}
      {'☆'.repeat(Math.max(0, emptyStars))}
      <span class="reviews-score-text">{score}/{max}</span>
    </span>
  );
}

export function ReviewsSourcePage(props: SourcePageProps) {
  const {
    items,
    types,
    workspaces,
    counts,
    settings,
    filters,
    pagination,
    paginationBase,
    sourceUrl,
    vocabulary,
  } = props;

  const sourceTitle = settings.source_title || 'Reviews';
  const sourceDescription = settings.source_description || '';

  const activeType = filters.typeId ? types.find((t) => t.id === filters.typeId) : undefined;
  const activeWorkspace = filters.workspaceId ? workspaces.find((w) => w.id === filters.workspaceId) : undefined;

  let pageTitle = sourceTitle;
  if (activeType) pageTitle = `${activeType.name} | ${sourceTitle}`;
  else if (activeWorkspace) pageTitle = `${activeWorkspace.name} | ${sourceTitle}`;
  else if (filters.tag) pageTitle = `#${filters.tag} | ${sourceTitle}`;

  const githubUrl = settings.source_social_github || '';
  const githubUsername = githubUrl.replace(/\/$/, '').split('/').pop() || '';
  const ogImage = githubUsername
    ? `https://avatars.githubusercontent.com/${githubUsername}?s=400`
    : `${sourceUrl}/og-image.png`;

  const jsonLd = buildSourceJsonLd(settings, sourceUrl, props.seo);
  const metaTags = buildMetaTags({
    title: pageTitle,
    description: sourceDescription,
    canonicalUrl: sourceUrl || '/',
    ogType: 'website',
    feedUrl: `${sourceUrl}/feed.xml`,
    imageUrl: ogImage,
  });

  const filterParams = new URLSearchParams();
  if (filters.typeId) filterParams.set('type', filters.typeId);
  if (filters.workspaceId) filterParams.set('workspace', filters.workspaceId);
  if (filters.tag) filterParams.set('tag', filters.tag);
  if (filters.q) filterParams.set('q', filters.q);
  if (filters.sort === 'oldest') filterParams.set('sort', 'oldest');
  const filterQs = filterParams.toString();

  const totalPages = Math.ceil(pagination.total / pagination.limit);
  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
  let relLinks = '';
  const safeSourceUrl = escapeHtmlAttr(sourceUrl);
  const baseUrl = filterQs ? `${safeSourceUrl}/?${escapeHtmlAttr(filterQs)}` : `${safeSourceUrl}/`;
  const sep = filterQs ? '&amp;' : '?';
  if (currentPage > 1) {
    relLinks += `\n    <link rel="prev" href="${baseUrl}${sep}offset=${(currentPage - 2) * pagination.limit}">`;
  }
  if (currentPage < totalPages) {
    relLinks += `\n    <link rel="next" href="${baseUrl}${sep}offset=${currentPage * pagination.limit}">`;
  }

  const headContent = `${metaTags}${relLinks}`;

  return (
    <ReviewsLayout title={sourceTitle} head={headContent} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings}>
      <JsonLd data={jsonLd} />

      <div class="source-page source-page--feed">
        <FilterBar types={types} activeTypeId={filters.typeId} workspaces={workspaces} activeWorkspaceId={filters.workspaceId} activeTag={filters.tag} sort={filters.sort} counts={counts} query={filters.q} />

        <div id="source-loading" class="source-loading htmx-indicator">
          <span class="app-spinner" />
        </div>
        <div id="source-results">
          {items.length === 0 ? (
            <p class="empty-state">No {vocabulary.itemPlural} matching this filter.</p>
          ) : (
            <>
              <div class="reviews-feed">
                {items.map((item) => {
                  const rating = extractRating(item.content);
                  const preview = stripMarkdown(item.content).slice(0, 180);

                  return (
                    <article class="reviews-card">
                      <div class="reviews-card-header">
                        <div class="reviews-card-meta">
                          <TypeBadge typeName={item.typeName} />
                          {item.workspaceName && (
                            <span class="workspace-badge">{item.workspaceName}</span>
                          )}
                          <time datetime={item.vouchedAt || item.createdAt}>
                            {formatDate(item.vouchedAt || item.createdAt)}
                          </time>
                        </div>
                        {rating && <StarDisplay score={rating.score} max={rating.max} />}
                      </div>
                      <div class="reviews-card-body">
                        <h3>
                          {item.slug ? (
                            <a href={`/item/${item.slug}`}>{item.keySummary}</a>
                          ) : (
                            item.keySummary
                          )}
                        </h3>
                        <p class="reviews-card-description">{preview}{item.content.length > 180 ? '...' : ''}</p>
                      </div>
                      {item.tags && item.tags.length > 0 && (
                        <div class="reviews-card-tags">
                          {item.tags.map((t) => (
                            <a href={`/?tag=${encodeURIComponent(t)}`} class="item-tag">#{t}</a>
                          ))}
                        </div>
                      )}
                      <div class="reviews-card-footer">
                        {item.slug && <a href={`/item/${item.slug}`}>Read full {vocabulary.item} &rarr;</a>}
                      </div>
                    </article>
                  );
                })}
              </div>
              <Pagination
                total={pagination.total}
                limit={pagination.limit}
                offset={pagination.offset}
                baseUrl={paginationBase}
              />
            </>
          )}
        </div>
      </div>
    </ReviewsLayout>
  );
}
