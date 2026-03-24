import type { SourcePageProps } from '@pignal/templates';
import { Pagination } from '../../components/pagination';
import { JsonLd } from '../../components/json-ld';
import { buildSourceJsonLd, buildMetaTags, escapeHtmlAttr, resolveOgImage } from '../../lib/seo';
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

  const sections = groupByWorkspace(items);

  // Build table of contents from workspace sections
  const hasSections = sections.length > 1 || (sections.length === 1 && sections[0].id !== null);

  // Build workspace sidebar links
  const publicWorkspaces = workspaces.filter((w) => w.visibility === 'public');

  return (
    <AwesomeListLayout title={sourceTitle} head={headContent} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings}>
      <JsonLd data={jsonLd} />

      <div class="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-16 w-full">
        {/* Category navigation bar */}
        {publicWorkspaces.length > 0 && (
          <nav class="flex flex-wrap gap-1 py-3 mb-4 border-b border-border-subtle">
            <a
              href="/"
              class={`inline-block px-2.5 py-1 text-xs rounded transition-colors ${!filters.workspaceId ? 'bg-primary text-white' : 'text-muted hover:bg-surface hover:text-text'}`}
              {...hxProps('/')}
            >
              All
            </a>
            {publicWorkspaces.map((ws) => (
              <a
                href={`/?workspace=${ws.id}`}
                class={`inline-block px-2.5 py-1 text-xs rounded transition-colors ${filters.workspaceId === ws.id ? 'bg-primary text-white' : 'text-muted hover:bg-surface hover:text-text'}`}
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
            <div class="empty-state">
              <svg class="empty-state-icon" width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="6" y="10" width="36" height="28" rx="3"/><path d="M6 22h12l3 4h6l3-4h12"/><path d="M20 18h8M22 14h4"/></svg>
              <p class="empty-state-title">No items found</p>
              <p class="empty-state-description">No {vocabulary.itemPlural} matching this filter.</p>
            </div>
          ) : (
            <>
              {/* Table of contents for sections */}
              {hasSections && !filters.workspaceId && (
                <nav class="mb-6 p-3 sm:p-4 bg-surface border border-border-subtle shadow-card rounded-xl">
                  <strong class="text-xs uppercase tracking-widest text-muted">Contents</strong>
                  <ul class="mt-2 pl-5 list-none">
                    {sections.map((section) => {
                      const anchor = section.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                      return (
                        <li class="text-sm leading-relaxed text-muted"><a href={`#section-${anchor}`} class="text-primary no-underline hover:underline">{section.name}</a> ({section.items.length})</li>
                      );
                    })}
                  </ul>
                </nav>
              )}

              {sections.map((section) => {
                const anchor = section.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                return (
                  <div class="mb-6" id={`section-${anchor}`}>
                    {hasSections && (
                      <h2 class="text-lg font-semibold mb-2 pb-1.5 border-b border-border-subtle">
                        <a href={`#section-${anchor}`} class="no-underline text-text hover:text-primary transition-colors">{section.name}</a>
                      </h2>
                    )}
                    <ul class="list-none p-0 m-0">
                      {section.items.map((item, index) => {
                        const desc = stripMarkdown(item.content).slice(0, 120);
                        const isLast = index === section.items.length - 1;
                        return (
                          <li class={`py-1.5 md:py-2 leading-relaxed ${!isLast ? 'border-b border-dotted border-border-subtle' : ''}`}>
                            {item.slug ? (
                              <a href={`/item/${item.slug}`} class="font-medium text-primary text-sm no-underline hover:underline">{item.keySummary}</a>
                            ) : (
                              <span class="font-medium text-primary text-sm">{item.keySummary}</span>
                            )}
                            {desc && (
                              <span class="text-sm text-muted"> — {desc}{item.content.length > 120 ? '...' : ''}</span>
                            )}
                            {item.tags && item.tags.length > 0 && (
                              <span class="inline-flex gap-1 ml-1.5">
                                {item.tags.slice(0, 3).map((t) => (
                                  <a href={`/?tag=${encodeURIComponent(t)}`} class="text-[0.7rem] text-muted hover:text-primary transition-colors">#{t}</a>
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
