import type { SourcePageProps } from '@pignal/templates';
import { FilterBar } from '../../components/type-sidebar';
import { Pagination } from '../../components/pagination';
import { TypeBadge } from '../../components/type-badge';
import { JsonLd } from '../../components/json-ld';
import { EmptyState } from '../../components/empty-state';
import { buildSourceJsonLd, buildMetaTags, escapeHtmlAttr, resolveOgImage } from '../../lib/seo';
import { formatDate } from '../../lib/time';
import { stripMarkdown } from '../../lib/markdown';
import { ReviewsLayout } from './layout';

/**
 * Extract a numeric rating from item content.
 * Looks for patterns like "Rating: 4/5", "Score: 8/10", etc.
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
    <span class="inline-flex items-center gap-px text-primary text-base tracking-wider" role="img" aria-label={`Rating: ${score} out of ${max}`} title={`${score}/${max}`}>
      {'★'.repeat(fullStars)}
      {hasHalf && <span class="opacity-40">★</span>}
      {'☆'.repeat(Math.max(0, emptyStars))}
      <span class="text-xs text-muted ml-1.5" aria-hidden="true">{score}/{max}</span>
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
    t,
  } = props;

  const sourceTitle = settings.source_title || 'Reviews';
  const sourceDescription = settings.source_description || '';

  const activeType = filters.typeId ? types.find((t) => t.id === filters.typeId) : undefined;
  const activeWorkspace = filters.workspaceId ? workspaces.find((w) => w.id === filters.workspaceId) : undefined;

  let pageTitle = sourceTitle;
  if (activeType) pageTitle = `${activeType.name} | ${sourceTitle}`;
  else if (activeWorkspace) pageTitle = `${activeWorkspace.name} | ${sourceTitle}`;
  else if (filters.tag) pageTitle = `#${filters.tag} | ${sourceTitle}`;

  const ogImage = resolveOgImage(settings, sourceUrl);

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
    <ReviewsLayout title={sourceTitle} head={headContent} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings} visitor={props.visitor}>
      <JsonLd data={jsonLd} />

      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-16 w-full flex flex-col">
        <FilterBar types={types} activeTypeId={filters.typeId} workspaces={workspaces} activeWorkspaceId={filters.workspaceId} activeTag={filters.tag} sort={filters.sort} counts={counts} query={filters.q} t={t} />

        <div id="source-loading" class="source-loading htmx-indicator">
          <span class="app-spinner" />
        </div>
        <div id="source-results">
          {items.length === 0 ? (
            <EmptyState
              icon="search"
              title={`No ${vocabulary.itemPlural} found`}
              description={`No ${vocabulary.itemPlural} matching this filter.`}
            />
          ) : (
            <>
              <div class="flex flex-col gap-6 py-4">
                {items.map((item) => {
                  const rating = extractRating(item.content);
                  const preview = stripMarkdown(item.content).slice(0, 180);

                  return (
                    <article class="card-hover border border-border-subtle shadow-card rounded-xl overflow-hidden bg-surface">
                      <div class="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-surface/50 flex-wrap gap-2 sm:flex-nowrap">
                        <div class="flex items-center gap-2 flex-wrap text-xs text-muted">
                          <TypeBadge typeName={item.typeName} />
                          {item.workspaceName && (
                            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">{item.workspaceName}</span>
                          )}
                          <time datetime={item.vouchedAt || item.createdAt}>
                            {formatDate(item.vouchedAt || item.createdAt)}
                          </time>
                        </div>
                        {rating && <StarDisplay score={rating.score} max={rating.max} />}
                      </div>
                      <div class="px-4 py-3">
                        <h3 class="text-base sm:text-lg font-semibold leading-snug mb-2">
                          {item.slug ? (
                            <a href={`/item/${item.slug}`} class="no-underline text-text hover:text-primary transition-colors">{item.keySummary}</a>
                          ) : (
                            item.keySummary
                          )}
                        </h3>
                        <p class="text-sm text-muted m-0 leading-relaxed line-clamp-3">{preview}{item.content.length > 180 ? '...' : ''}</p>
                      </div>
                      {item.tags && item.tags.length > 0 && (
                        <div class="px-4 pb-2 flex flex-wrap gap-1.5">
                          {item.tags.map((t) => (
                            <a href={`/?tag=${encodeURIComponent(t)}`} class="inline-block px-3 py-1 rounded-full text-sm font-medium text-muted no-underline border border-border-subtle hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-colors">#{t}</a>
                          ))}
                        </div>
                      )}
                      <div class="flex items-center justify-end px-4 py-2.5 border-t border-border-subtle text-sm">
                        {item.slug && <a href={`/item/${item.slug}`} class="text-primary font-medium no-underline hover:underline">Read full {vocabulary.item} &rarr;</a>}
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
                htmxTarget="#source-results"
                t={t}
              />
            </>
          )}
        </div>
      </div>
    </ReviewsLayout>
  );
}
