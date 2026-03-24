import type { SourcePageProps } from '@pignal/templates';
import { FilterBar } from '../../components/type-sidebar';
import { Pagination } from '../../components/pagination';
import { TypeBadge } from '../../components/type-badge';
import { JsonLd } from '../../components/json-ld';
import { buildSourceJsonLd, buildMetaTags, escapeHtmlAttr, resolveOgImage } from '../../lib/seo';
import { formatDate } from '../../lib/time';
import { stripMarkdown } from '../../lib/markdown';
import { PodcastLayout } from './layout';

/**
 * Extract duration from content. Looks for patterns like "Duration: 45 min",
 * "Length: 1:23:45", "runtime: 30m", etc.
 */
function extractDuration(content: string): string | null {
  // Match "Duration: X min" or "Duration: Xm"
  const minMatch = content.match(/(?:duration|length|runtime|time)\s*[:=]\s*(\d+)\s*(?:min|m)\b/i);
  if (minMatch) {
    const mins = parseInt(minMatch[1], 10);
    if (mins >= 60) {
      return `${Math.floor(mins / 60)}h ${mins % 60}m`;
    }
    return `${mins} min`;
  }

  // Match "Duration: H:MM:SS" or "Duration: MM:SS"
  const timeMatch = content.match(/(?:duration|length|runtime|time)\s*[:=]\s*(\d{1,2}:\d{2}(?::\d{2})?)/i);
  if (timeMatch) {
    return timeMatch[1];
  }

  return null;
}

export function PodcastSourcePage(props: SourcePageProps) {
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

  const sourceTitle = settings.source_title || 'Podcast';
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

  // Calculate episode numbers
  const totalEpisodes = pagination.total;
  const startEpisodeNum = filters.sort === 'oldest'
    ? pagination.offset + 1
    : totalEpisodes - pagination.offset;

  return (
    <PodcastLayout title={sourceTitle} head={headContent} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings}>
      <JsonLd data={jsonLd} />

      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-16 w-full flex flex-col">
        <FilterBar types={types} activeTypeId={filters.typeId} workspaces={workspaces} activeWorkspaceId={filters.workspaceId} activeTag={filters.tag} sort={filters.sort} counts={counts} query={filters.q} />

        <div id="source-loading" class="source-loading htmx-indicator">
          <span class="app-spinner" />
        </div>
        <div id="source-results">
          {items.length === 0 ? (
            <div class="empty-state">
              <svg class="empty-state-icon" width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="6" y="10" width="36" height="28" rx="3"/><path d="M6 22h12l3 4h6l3-4h12"/><path d="M20 18h8M22 14h4"/></svg>
              <p class="empty-state-title">No items found</p>
              <p class="empty-state-description">No {vocabulary.itemPlural} matching this filter.</p>
            </div>
          ) : (
            <>
              <div class="flex flex-col gap-6 py-4">
                {items.map((item, index) => {
                  const episodeNum = filters.sort === 'oldest'
                    ? startEpisodeNum + index
                    : startEpisodeNum - index;
                  const duration = extractDuration(item.content);
                  const preview = stripMarkdown(item.content).slice(0, 150);

                  return (
                    <article class="flex flex-col sm:flex-row border border-border-subtle shadow-card rounded-xl overflow-hidden bg-surface hover:shadow-card-hover transition-shadow">
                      <div class="flex items-center justify-center sm:min-w-16 md:min-w-[4.5rem] px-4 py-2 sm:py-4 bg-primary shrink-0 sm:flex-col">
                        <span class="text-xs font-bold uppercase tracking-widest text-white text-center leading-tight">EP {episodeNum}</span>
                      </div>
                      <div class="flex-1 min-w-0 px-4 py-3">
                        <div class="mb-1">
                          <div class="flex items-center gap-2 flex-wrap text-xs text-muted">
                            <TypeBadge typeName={item.typeName} />
                            <time datetime={item.vouchedAt || item.createdAt}>
                              {formatDate(item.vouchedAt || item.createdAt)}
                            </time>
                            {duration && (
                              <span class="inline-flex items-center gap-1 text-xs font-medium text-primary">
                                <span class="w-1.5 h-1.5 rounded-full bg-primary/50" />
                                {duration}
                              </span>
                            )}
                          </div>
                        </div>
                        <h3 class="text-base sm:text-lg font-semibold leading-snug my-1">
                          {item.slug ? (
                            <a href={`/item/${item.slug}`} class="no-underline text-text hover:text-primary transition-colors">{item.keySummary}</a>
                          ) : (
                            item.keySummary
                          )}
                        </h3>
                        <p class="text-sm text-muted m-0 mb-2 leading-relaxed line-clamp-2">{preview}{item.content.length > 150 ? '...' : ''}</p>
                        {item.tags && item.tags.length > 0 && (
                          <div class="flex flex-wrap gap-1.5 mb-1.5">
                            {item.tags.map((t) => (
                              <a href={`/?tag=${encodeURIComponent(t)}`} class="text-[0.7rem] text-primary hover:underline">#{t}</a>
                            ))}
                          </div>
                        )}
                        <div class="text-sm">
                          {item.slug && <a href={`/item/${item.slug}`} class="text-primary font-medium no-underline hover:underline">View show notes &rarr;</a>}
                        </div>
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
    </PodcastLayout>
  );
}
