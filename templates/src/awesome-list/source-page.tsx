/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */
import type { SourcePageProps } from '../types';
import { Pagination } from '@pignal/render/components/pagination';
import { EmptyState } from '@pignal/render/components/empty-state';
import { JsonLd } from '@pignal/render/components/json-ld';
import { buildSourceJsonLd, buildMetaTags, escapeHtmlAttr, resolveOgImage } from '@pignal/render/lib/seo';
import { stripMarkdown } from '@pignal/render/lib/markdown';
import { AwesomeListLayout } from './layout';

const HX_TARGET = '#source-results';
const HX_INDICATOR = '#source-loading';
const HX_SWAP = 'innerHTML';

function hxProps(url: string) {
  return { 'hx-get': url, 'hx-target': HX_TARGET, 'hx-swap': HX_SWAP, 'hx-push-url': 'true', 'hx-indicator': HX_INDICATOR };
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
    t,
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
    <AwesomeListLayout title={sourceTitle} head={headContent} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings} visitor={props.visitor}>
      <JsonLd data={jsonLd} />

      <div class="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-16 w-full">
        {/* Category navigation bar with filter-chip styling */}
        {publicWorkspaces.length > 0 && (
          <nav class="flex flex-wrap gap-1.5 py-3 mb-5 border-b border-border-subtle" aria-label={`Filter by ${vocabulary.workspace}`}>
            <a
              href="/"
              class={`filter-chip ${!filters.workspaceId ? 'active' : ''}`}
              {...hxProps('/')}
            >
              All
            </a>
            {publicWorkspaces.map((ws) => (
              <a
                href={`/?workspace=${ws.id}`}
                class={`filter-chip ${filters.workspaceId === ws.id ? 'active' : ''}`}
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
        <div id="source-results" aria-live="polite">
          {items.length === 0 ? (
            <EmptyState
              icon="search"
              title={`No ${vocabulary.itemPlural} found`}
              description="Try adjusting your search or filters."
            />
          ) : (
            <>
              {/* Table of contents for sections */}
              {hasSections && !filters.workspaceId && (
                <nav class="mb-6 p-3 sm:p-4 bg-surface border border-border-subtle shadow-card rounded-xl" aria-label="Table of contents">
                  <strong class="text-xs uppercase tracking-widest text-muted">Contents</strong>
                  <ul class="mt-2 pl-5 list-none">
                    {sections.map((section) => {
                      const anchor = section.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                      return (
                        <li class="text-sm leading-relaxed text-muted">
                          <a href={`#section-${anchor}`} class="text-primary no-underline hover:underline transition-colors">{section.name}</a>
                          <span class="text-xs ml-1 opacity-70">({section.items.length})</span>
                        </li>
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
                          <li class={`card-hover py-2 md:py-2.5 px-2 rounded-lg leading-relaxed transition-colors hover:bg-primary/4 ${!isLast ? 'border-b border-dotted border-border-subtle' : ''}`}>
                            {item.slug ? (
                              <a href={`/item/${item.slug}`} class="font-medium text-primary text-sm no-underline hover:underline inline-flex items-center gap-1">
                                {item.keySummary}
                                <svg class="w-3 h-3 opacity-40 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17l9.2-9.2M17 17V7H7" /></svg>
                              </a>
                            ) : (
                              <span class="font-medium text-primary text-sm">{item.keySummary}</span>
                            )}
                            {desc && (
                              <span class="text-sm text-muted"> — {desc}</span>
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
                htmxTarget={HX_TARGET}
                t={t}
              />
            </>
          )}
        </div>
      </div>
    </AwesomeListLayout>
  );
}
