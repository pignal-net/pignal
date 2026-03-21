import type { SourcePageProps } from '@pignal/templates';
import { Pagination } from '../../components/pagination';
import { JsonLd } from '../../components/json-ld';
import { buildSourceJsonLd, buildMetaTags, escapeHtmlAttr } from '../../lib/seo';
import { stripMarkdown } from '../../lib/markdown';
import { AwesomeListLayout } from './layout';

const HX_TARGET = '#source-results';
const HX_INDICATOR = '#source-loading';
function hxProps(url: string) {
  return { 'hx-get': url, 'hx-target': HX_TARGET, 'hx-swap': 'innerHTML', 'hx-push-url': 'true', 'hx-indicator': HX_INDICATOR };
}

/**
 * Group items by workspace for section headings.
 * Items without a workspace go under "Uncategorized".
 */
function groupByWorkspace(items: SourcePageProps['items']): { id: string | null; name: string; items: SourcePageProps['items'] }[] {
  const groups = new Map<string, { id: string | null; name: string; items: SourcePageProps['items'] }>();

  for (const item of items) {
    const key = item.workspaceId || '__uncategorized__';
    const existing = groups.get(key);
    if (existing) {
      existing.items.push(item);
    } else {
      groups.set(key, {
        id: item.workspaceId,
        name: item.workspaceName || 'Uncategorized',
        items: [item],
      });
    }
  }

  return [...groups.values()];
}

export function AwesomeListSourcePage(props: SourcePageProps) {
  const {
    items,
    workspaces,
    settings,
    filters,
    pagination,
    paginationBase,
    sourceUrl,
    vocabulary,
  } = props;

  const sourceTitle = settings.source_title || 'Awesome List';
  const sourceDescription = settings.source_description || '';

  let pageTitle = sourceTitle;
  if (filters.tag) pageTitle = `#${filters.tag} | ${sourceTitle}`;
  else if (filters.workspaceId) {
    const ws = workspaces.find((w) => w.id === filters.workspaceId);
    if (ws) pageTitle = `${ws.name} | ${sourceTitle}`;
  }

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

  const sections = groupByWorkspace(items);

  // Build table of contents from workspace sections
  const hasSections = sections.length > 1 || (sections.length === 1 && sections[0].id !== null);

  // Build workspace sidebar links
  const publicWorkspaces = workspaces.filter((w) => w.visibility === 'public');

  return (
    <AwesomeListLayout title={sourceTitle} head={headContent} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings}>
      <JsonLd data={jsonLd} />

      <div class="source-page awesome-list-page">
        {/* Category sidebar as top nav for awesome-list */}
        {publicWorkspaces.length > 0 && (
          <nav class="awesome-list-nav">
            <a
              href="/"
              class={!filters.workspaceId ? 'awesome-list-nav-link awesome-list-nav-active' : 'awesome-list-nav-link'}
              {...hxProps('/')}
            >
              All
            </a>
            {publicWorkspaces.map((ws) => (
              <a
                href={`/?workspace=${ws.id}`}
                class={filters.workspaceId === ws.id ? 'awesome-list-nav-link awesome-list-nav-active' : 'awesome-list-nav-link'}
                {...hxProps(`/?workspace=${ws.id}`)}
              >
                {ws.name}
              </a>
            ))}
          </nav>
        )}

        <div id="source-loading" class="source-loading htmx-indicator">
          <span class="app-spinner" />
        </div>
        <div id="source-results">
          {items.length === 0 ? (
            <p class="empty-state">No {vocabulary.itemPlural} matching this filter.</p>
          ) : (
            <>
              {/* Table of contents for sections */}
              {hasSections && !filters.workspaceId && (
                <nav class="awesome-list-toc">
                  <strong>Contents</strong>
                  <ul>
                    {sections.map((section) => {
                      const anchor = section.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                      return (
                        <li><a href={`#section-${anchor}`}>{section.name}</a> ({section.items.length})</li>
                      );
                    })}
                  </ul>
                </nav>
              )}

              {sections.map((section) => {
                const anchor = section.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                return (
                  <div class="awesome-list-section" id={`section-${anchor}`}>
                    {hasSections && (
                      <h2 class="awesome-list-section-header">
                        <a href={`#section-${anchor}`}>{section.name}</a>
                      </h2>
                    )}
                    <ul class="awesome-list-items">
                      {section.items.map((item) => {
                        const desc = stripMarkdown(item.content).slice(0, 120);
                        return (
                          <li class="awesome-list-item">
                            {item.slug ? (
                              <a href={`/item/${item.slug}`} class="awesome-list-item-title">{item.keySummary}</a>
                            ) : (
                              <span class="awesome-list-item-title">{item.keySummary}</span>
                            )}
                            {desc && (
                              <span class="awesome-list-item-desc"> — {desc}{item.content.length > 120 ? '...' : ''}</span>
                            )}
                            {item.tags && item.tags.length > 0 && (
                              <span class="awesome-list-item-tags">
                                {item.tags.slice(0, 3).map((t) => (
                                  <a href={`/?tag=${encodeURIComponent(t)}`} class="item-tag">#{t}</a>
                                ))}
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
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
    </AwesomeListLayout>
  );
}
