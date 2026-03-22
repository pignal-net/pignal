import type { SourcePageProps } from '@pignal/templates';
import { FilterBar } from '../../components/type-sidebar';
import { FeedResults } from '../../components/item-feed';
import { JsonLd } from '../../components/json-ld';
import { buildSourceJsonLd, buildMetaTags, escapeHtmlAttr } from '../../lib/seo';
import { BlogLayout } from './layout';

export function BlogSourcePage(props: SourcePageProps) {
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
  } = props;

  const showReadingTime = settings.source_show_reading_time !== 'false';
  const cardStyle = settings.source_card_style;
  const sourceTitle = settings.source_title || 'My Pignal';
  const sourceDescription = settings.source_description || 'A self-hosted content platform powered by Cloudflare';

  const activeType = filters.typeId ? types.find((t) => t.id === filters.typeId) : undefined;
  const activeWorkspace = filters.workspaceId ? workspaces.find((w) => w.id === filters.workspaceId) : undefined;

  // Build page title
  let pageTitle = sourceTitle;
  if (activeType) pageTitle = `${activeType.name} | ${sourceTitle}`;
  else if (activeWorkspace) pageTitle = `${activeWorkspace.name} | ${sourceTitle}`;
  else if (filters.tag) pageTitle = `#${filters.tag} | ${sourceTitle}`;

  // Derive OG image: prefer GitHub avatar (direct URL, no redirect), fall back to branded PNG
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

  // Build pagination rel links
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
    <BlogLayout title={sourceTitle} head={headContent} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings}>
      <JsonLd data={jsonLd} />

      <div class={`max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-16 w-full flex flex-col${cardStyle === 'grid' ? ' source-page--grid-cards' : ''}`}>
        {!filters.typeId && !filters.workspaceId && !filters.tag && !filters.q && pagination.offset === 0 && (
          <div class="mb-10">
            <h1 class="text-3xl sm:text-4xl font-bold tracking-tight mb-2">{sourceTitle}</h1>
            {sourceDescription && <p class="text-lg text-muted max-w-2xl leading-relaxed">{sourceDescription}</p>}
          </div>
        )}
        <FilterBar types={types} activeTypeId={filters.typeId} workspaces={workspaces} activeWorkspaceId={filters.workspaceId} activeTag={filters.tag} sort={filters.sort} counts={counts} query={filters.q} />

        <div id="source-loading" class="source-loading htmx-indicator">
          <span class="app-spinner" />
        </div>
        <div id="source-results">
          <FeedResults
            items={items}
            total={pagination.total}
            limit={pagination.limit}
            offset={pagination.offset}
            paginationBase={paginationBase}
            sort={filters.sort}
            basePath="/item"
            tagBasePath="/"
            showReadingTime={showReadingTime}
            emptyMessage="No vouched items matching this filter."
          />
        </div>
      </div>
    </BlogLayout>
  );
}
