import type { SourcePageProps } from '@pignal/templates';
import type { Item } from '@pignal/templates';
import { Pagination } from '../../components/pagination';
import { JsonLd } from '../../components/json-ld';
import { buildSourceJsonLd, buildMetaTags, escapeHtmlAttr } from '../../lib/seo';
import { stripMarkdown } from '../../lib/markdown';
import { formatDate } from '../../lib/time';
import { ResumeLayout } from './layout';

/* HTMX constants */
const HX_TARGET = '#source-results';
const HX_INDICATOR = '#source-loading';

function hxProps(url: string) {
  return {
    'hx-get': url,
    'hx-target': HX_TARGET,
    'hx-swap': 'innerHTML',
    'hx-push-url': 'true',
    'hx-indicator': HX_INDICATOR,
  };
}

function buildFilterUrl(params: Record<string, string | undefined>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) qs.set(k, v);
  }
  const s = qs.toString();
  return s ? `/?${s}` : '/';
}

/** Group items by typeId, preserving type display order */
function groupByType(items: Item[], types: { id: string; name: string; icon: string | null }[]): { typeId: string; typeName: string; typeIcon: string | null; items: Item[] }[] {
  const groups = new Map<string, Item[]>();
  for (const item of items) {
    const list = groups.get(item.typeId) || [];
    list.push(item);
    groups.set(item.typeId, list);
  }

  // Order by types array order, then any remaining
  const result: { typeId: string; typeName: string; typeIcon: string | null; items: Item[] }[] = [];
  for (const type of types) {
    const typeItems = groups.get(type.id);
    if (typeItems && typeItems.length > 0) {
      result.push({ typeId: type.id, typeName: type.name, typeIcon: type.icon, items: typeItems });
      groups.delete(type.id);
    }
  }
  // Any ungrouped types (shouldn't happen, but safe)
  for (const [typeId, typeItems] of groups) {
    if (typeItems.length > 0) {
      result.push({ typeId, typeName: typeItems[0].typeName, typeIcon: null, items: typeItems });
    }
  }
  return result;
}

/** Collect all unique tags from items for the skills display */
function collectTags(items: Item[]): string[] {
  const tagSet = new Set<string>();
  for (const item of items) {
    if (item.tags) {
      for (const t of item.tags) tagSet.add(t);
    }
  }
  return Array.from(tagSet).sort();
}

export function ResumeSourcePage(props: SourcePageProps) {
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

  const sourceTitle = settings.source_title || 'My Resume';
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
  const baseUrlStr = filterQs ? `${safeSourceUrl}/?${escapeHtmlAttr(filterQs)}` : `${safeSourceUrl}/`;
  const sep = filterQs ? '&amp;' : '?';
  if (currentPage > 1) {
    relLinks += `\n    <link rel="prev" href="${baseUrlStr}${sep}offset=${(currentPage - 2) * pagination.limit}">`;
  }
  if (currentPage < totalPages) {
    relLinks += `\n    <link rel="next" href="${baseUrlStr}${sep}offset=${currentPage * pagination.limit}">`;
  }

  const headContent = `${metaTags}${relLinks}`;

  // Collect all skills (tags) for the hero section
  const allSkills = collectTags(items);

  // Filter which types/workspaces have items
  const typesWithItems = types.filter((t) => (counts.byType[t.id] ?? 0) > 0);
  const workspacesWithItems = workspaces.filter((w) => (counts.byWorkspace[w.id] ?? 0) > 0);

  // Group items by type for section rendering
  const sections = groupByType(items, types);

  // Build sort param for filter URLs
  const sortParam = filters.sort === 'oldest' ? 'oldest' : undefined;

  return (
    <ResumeLayout title={sourceTitle} head={headContent} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings}>
      <JsonLd data={jsonLd} />

      <div class="text-center px-4 pt-10 pb-8 border-b-2 border-border-subtle mb-8">
        {githubUsername && (
          <img
            src={`https://avatars.githubusercontent.com/${githubUsername}?s=192`}
            alt={sourceTitle}
            class="w-24 h-24 rounded-full mb-4 border-[3px] border-border-subtle mx-auto max-sm:w-[72px] max-sm:h-[72px]"
            width="96"
            height="96"
          />
        )}
        <h1 class="text-3xl max-sm:text-2xl font-bold m-0 mb-1 leading-tight tracking-tight text-text">{sourceTitle}</h1>
        {sourceDescription && <p class="text-lg max-sm:text-base text-muted m-0 mb-4 leading-relaxed max-w-[600px] mx-auto">{sourceDescription}</p>}

        <div class="flex justify-center items-center gap-4 flex-wrap text-sm">
          {githubUrl && (
            <a href={githubUrl} target="_blank" rel="noopener" class="text-primary no-underline inline-flex items-center gap-1 hover:underline">GitHub</a>
          )}
          {settings.source_social_twitter && (
            <a href={settings.source_social_twitter} target="_blank" rel="noopener" class="text-primary no-underline inline-flex items-center gap-1 hover:underline">Twitter</a>
          )}
          {settings.source_social_linkedin && (
            <a href={settings.source_social_linkedin} target="_blank" rel="noopener" class="text-primary no-underline inline-flex items-center gap-1 hover:underline">LinkedIn</a>
          )}
          {settings.source_url && (
            <a href={settings.source_url} target="_blank" rel="noopener" class="text-primary no-underline inline-flex items-center gap-1 hover:underline">Website</a>
          )}
        </div>

        {allSkills.length > 0 && (
          <div class="flex justify-center flex-wrap gap-1.5 mt-4">
            {allSkills.map((skill) => {
              const url = buildFilterUrl({ tag: skill, workspace: filters.workspaceId, sort: sortParam });
              return (
                <a href={url} class="inline-block px-2.5 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary tracking-wide no-underline" {...hxProps(url)}>{skill}</a>
              );
            })}
          </div>
        )}
      </div>

      {/* Profile tabs (workspace filter) */}
      {workspacesWithItems.length > 0 && (
        <div class="flex justify-center gap-2 flex-wrap mb-6 px-4">
          {(() => {
            const url = buildFilterUrl({ type: filters.typeId, tag: filters.tag, q: filters.q, sort: sortParam });
            return (
              <a href={url} class={`inline-block px-4 py-1.5 text-[0.8rem] font-medium rounded-full border no-underline transition-all ${!filters.workspaceId ? 'bg-primary border-primary text-white' : 'border-border text-muted hover:border-primary hover:text-primary'}`} {...hxProps(url)}>
                All {vocabulary.workspacePlural}
              </a>
            );
          })()}
          {workspacesWithItems.map((ws) => {
            const url = buildFilterUrl({
              workspace: filters.workspaceId === ws.id ? undefined : ws.id,
              type: filters.typeId,
              tag: filters.tag,
              q: filters.q,
              sort: sortParam,
            });
            return (
              <a href={url} class={`inline-block px-4 py-1.5 text-[0.8rem] font-medium rounded-full border no-underline transition-all ${filters.workspaceId === ws.id ? 'bg-primary border-primary text-white' : 'border-border text-muted hover:border-primary hover:text-primary'}`} {...hxProps(url)}>
                {ws.name}
              </a>
            );
          })}
        </div>
      )}

      {/* Section filter chips */}
      {typesWithItems.length > 1 && (
        <div class="flex justify-center gap-1.5 flex-wrap mb-8 px-4">
          {(() => {
            const url = buildFilterUrl({ workspace: filters.workspaceId, tag: filters.tag, q: filters.q, sort: sortParam });
            return (
              <a href={url} class={`inline-block px-3 py-1 text-xs font-medium rounded-full border no-underline transition-all ${!filters.typeId ? 'bg-text border-text text-surface' : 'border-border text-muted hover:border-text hover:text-text'}`} {...hxProps(url)}>
                All <span class="font-normal opacity-70 ml-0.5">({counts.total})</span>
              </a>
            );
          })()}
          {typesWithItems.map((type) => {
            const url = buildFilterUrl({ type: type.id, workspace: filters.workspaceId, tag: filters.tag, q: filters.q, sort: sortParam });
            return (
              <a href={url} class={`inline-block px-3 py-1 text-xs font-medium rounded-full border no-underline transition-all ${filters.typeId === type.id ? 'bg-text border-text text-surface' : 'border-border text-muted hover:border-text hover:text-text'}`} {...hxProps(url)}>
                {type.icon ? `${type.icon} ` : ''}{type.name}
                <span class="font-normal opacity-70 ml-0.5">({counts.byType[type.id] ?? 0})</span>
              </a>
            );
          })}
        </div>
      )}

      {/* Active tag filter badge */}
      {filters.tag && (
        <div class="text-center mb-6">
          {(() => {
            const url = buildFilterUrl({ type: filters.typeId, workspace: filters.workspaceId, q: filters.q, sort: sortParam });
            return (
              <a href={url} class="inline-block px-3 py-1 text-[0.8rem] rounded-full bg-primary/10 text-primary no-underline hover:line-through" {...hxProps(url)}>
                #{filters.tag} &times;
              </a>
            );
          })()}
        </div>
      )}

      <div id="source-loading" class="source-loading htmx-indicator">
        <span class="app-spinner" />
      </div>
      <div id="source-results">
        <ResumeResults
          items={items}
          sections={sections}
          total={pagination.total}
          limit={pagination.limit}
          offset={pagination.offset}
          paginationBase={paginationBase}
          vocabulary={vocabulary}
          filters={filters}
        />
      </div>
    </ResumeLayout>
  );
}

/** Inner results component used both in full page and partial */
function ResumeResults(props: {
  items: Item[];
  sections: { typeId: string; typeName: string; typeIcon: string | null; items: Item[] }[];
  total: number;
  limit: number;
  offset: number;
  paginationBase: string;
  vocabulary: SourcePageProps['vocabulary'];
  filters: SourcePageProps['filters'];
}) {
  const { items, sections, total, limit, offset, paginationBase, vocabulary, filters } = props;
  const sortParam = filters.sort === 'oldest' ? 'oldest' : undefined;

  if (items.length === 0) {
    return (
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="10" width="36" height="28" rx="3"/><path d="M6 22h12l3 4h6l3-4h12"/><path d="M20 18h8M22 14h4"/></svg>
        </div>
        <p class="empty-state-title">{`No ${vocabulary.itemPlural} found`}</p>
        <p class="empty-state-description">Try adjusting your filters or search query.</p>
      </div>
    );
  }

  return (
    <>
      <div class="max-w-[740px] mx-auto px-4 max-sm:px-2">
        {sections.map((section) => (
          <div class="mb-10">
            <div class="flex items-center gap-3 mb-4 pb-2 border-b-2 border-primary">
              {section.typeIcon && <span class="text-lg shrink-0">{section.typeIcon}</span>}
              <h2 class="text-xs font-bold uppercase tracking-wider text-primary m-0">{section.typeName}</h2>
              <span class="text-[0.7rem] font-normal text-muted ml-auto">{section.items.length} {section.items.length === 1 ? vocabulary.item : vocabulary.itemPlural}</span>
            </div>
            <div class="flex flex-col relative pl-5 before:content-[''] before:absolute before:left-[3px] before:top-2 before:bottom-2 before:w-0.5 before:bg-border-subtle">
              {section.items.map((item) => {
                const description = stripMarkdown(item.content).slice(0, 200);
                const dateStr = item.vouchedAt || item.createdAt;
                return (
                  <div class="relative py-3 pl-3 before:content-[''] before:absolute before:-left-5 before:top-[1.15rem] before:w-2 before:h-2 before:rounded-full before:border-2 before:border-surface before:z-[1] before:bg-border-subtle first:before:bg-primary">
                    <div class="flex justify-between items-baseline gap-3 flex-wrap max-sm:flex-col max-sm:gap-0.5 mb-1">
                      <h3 class="text-[0.95rem] font-semibold m-0 leading-snug text-text">
                        {item.slug ? (
                          <a href={`/item/${item.slug}`} class="text-inherit no-underline hover:text-primary">{item.keySummary}</a>
                        ) : (
                          item.keySummary
                        )}
                      </h3>
                      <time class="text-xs text-muted whitespace-nowrap shrink-0" datetime={dateStr}>{formatDate(dateStr)}</time>
                    </div>
                    {description && (
                      <p class="text-sm text-muted leading-relaxed m-0 mt-1 line-clamp-3">{description}</p>
                    )}
                    <div class="flex items-center gap-2 flex-wrap mt-1.5">
                      {item.validationActionLabel && (
                        <span class="inline-block px-2 py-0.5 text-[0.65rem] font-semibold rounded-xl bg-primary/10 text-primary uppercase tracking-wide">{item.validationActionLabel}</span>
                      )}
                      {item.workspaceName && (
                        <span class="inline-block px-2 py-0.5 text-[0.65rem] font-semibold rounded-xl bg-primary/10 text-primary uppercase tracking-wide">{item.workspaceName}</span>
                      )}
                      {item.tags && item.tags.slice(0, 5).map((t) => {
                        const url = buildFilterUrl({ tag: t, type: filters.typeId, workspace: filters.workspaceId, sort: sortParam });
                        return (
                          <a href={url} class="inline-block px-1.5 py-0.5 text-[0.65rem] rounded-full bg-muted/8 border border-border-subtle text-muted no-underline hover:text-text" {...hxProps(url)}>
                            {t}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <Pagination
        total={total}
        limit={limit}
        offset={offset}
        baseUrl={paginationBase}
        htmxTarget={HX_TARGET}
      />
    </>
  );
}
