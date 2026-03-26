/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */
import type { SourcePageProps } from '../types';
import { Pagination } from '@pignal/render/components/pagination';
import { EmptyState } from '@pignal/render/components/empty-state';
import { JsonLd } from '@pignal/render/components/json-ld';
import { buildSourceJsonLd, buildMetaTags, escapeHtmlAttr, resolveOgImage } from '@pignal/render/lib/seo';
import { formatDate, readingTime } from '@pignal/render/lib/time';
import { WritingLayout } from './layout';

export function WritingSourcePage(props: SourcePageProps) {
  const {
    items,
    settings,
    filters,
    pagination,
    paginationBase,
    sourceUrl,
    vocabulary,
    t,
  } = props;

  const showReadingTime = settings.source_show_reading_time !== 'false';
  const sourceTitle = settings.source_title || 'Writing';
  const sourceDescription = settings.source_description || '';

  let pageTitle = sourceTitle;
  if (filters.tag) pageTitle = `#${filters.tag} | ${sourceTitle}`;

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
    <WritingLayout title={sourceTitle} head={headContent} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings} visitor={props.visitor}>
      <JsonLd data={jsonLd} />

      <div class="max-w-[680px] mx-auto px-4 sm:px-6 py-8 w-full">
        {/* No FilterBar — pure reading experience */}

        <div id="source-loading" class="source-loading htmx-indicator">
          <span class="app-spinner" />
        </div>
        <div id="source-results">
          {items.length === 0 ? (
            <EmptyState
              icon="file"
              title={`No ${vocabulary.itemPlural} yet`}
              description={`Published ${vocabulary.itemPlural} will appear here.`}
            />
          ) : (
            <>
              <div class="flex flex-col">
                {items.map((item, index) => (
                  <article class={`py-5 border-b border-border-subtle card-hover${index === 0 ? ' pt-0' : ''}`}>
                    <h2 class="font-serif text-xl sm:text-[1.3rem] font-normal leading-snug mb-1">
                      {item.slug ? (
                        <a href={`/item/${item.slug}`} class="no-underline text-text hover:text-primary transition-colors">{item.keySummary}</a>
                      ) : (
                        item.keySummary
                      )}
                    </h2>
                    <div class="flex items-center gap-3 text-xs text-muted">
                      <time datetime={item.vouchedAt || item.createdAt}>
                        {formatDate(item.vouchedAt || item.createdAt)}
                      </time>
                      {showReadingTime && (
                        <span>{readingTime(item.content)}</span>
                      )}
                    </div>
                  </article>
                ))}
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
    </WritingLayout>
  );
}
