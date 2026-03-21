import type { SourcePageProps, Item } from '@pignal/templates';
import type { TemplateVocabulary } from '@pignal/templates';
import { Pagination } from '../../components/pagination';
import { TypeBadge } from '../../components/type-badge';
import { JsonLd } from '../../components/json-ld';
import { buildSourceJsonLd, buildMetaTags, escapeHtmlAttr } from '../../lib/seo';
import { stripMarkdown } from '../../lib/markdown';
import { formatDate } from '../../lib/time';
import { RecipesLayout } from './layout';

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

export function RecipeCard({ item, vocabulary }: { item: Item; vocabulary: TemplateVocabulary }) {
  const detailUrl = `/item/${item.slug}`;
  const preview = stripMarkdown(item.content).slice(0, 100);
  const icon = item.typeName ? item.typeName.charAt(0).toUpperCase() : '?';

  return (
    <article class="recipes-card">
      <div class="recipes-card-image">
        <span>{icon}</span>
        <div class="recipes-card-badge">
          <TypeBadge typeName={item.typeName} />
        </div>
      </div>
      <div class="recipes-card-body">
        <h3><a href={detailUrl}>{item.keySummary}</a></h3>
        <div class="recipes-card-meta">
          <span class="recipes-card-meta-item">Recipe</span>
          {item.workspaceName && (
            <span class="recipes-card-meta-item">{item.workspaceName}</span>
          )}
        </div>
        <p class="recipes-card-description">{preview}{item.content.length > 100 ? '...' : ''}</p>
        {item.tags && item.tags.length > 0 && (
          <div class="recipes-card-tags">
            {item.tags.slice(0, 3).map((t) => {
              const tagUrl = `/?tag=${encodeURIComponent(t)}`;
              return (
                <a href={tagUrl} class="item-tag" {...hxProps(tagUrl)}>#{t}</a>
              );
            })}
          </div>
        )}
      </div>
      <div class="recipes-card-footer">
        <time datetime={item.vouchedAt || item.createdAt}>
          {formatDate(item.vouchedAt || item.createdAt)}
        </time>
        <a href={detailUrl}>View {vocabulary.item} &rarr;</a>
      </div>
    </article>
  );
}

export function RecipesSourcePage(props: SourcePageProps) {
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

  const sourceTitle = settings.source_title || `My ${vocabulary.itemPlural.charAt(0).toUpperCase() + vocabulary.itemPlural.slice(1)}`;
  const sourceDescription = settings.source_description || `Browse ${vocabulary.itemPlural}`;

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
  const sortParam = filters.sort === 'oldest' ? 'oldest' : undefined;

  // Build hx-vals for search input
  const hxValsObj: Record<string, string> = {};
  if (filters.sort === 'oldest') hxValsObj.sort = 'oldest';
  if (filters.typeId) hxValsObj.type = filters.typeId;
  if (filters.workspaceId) hxValsObj.workspace = filters.workspaceId;
  if (filters.tag) hxValsObj.tag = filters.tag;
  const hxVals = JSON.stringify(hxValsObj);

  // Filter types/workspaces that have items
  const typesWithItems = types.filter((t) => (counts.byType[t.id] ?? 0) > 0);
  const workspacesWithItems = workspaces.filter((w) => (counts.byWorkspace[w.id] ?? 0) > 0);

  // Pre-build URLs for sort tabs
  const newestUrl = buildFilterUrl({ type: filters.typeId, workspace: filters.workspaceId, tag: filters.tag, q: filters.q });
  const oldestUrl = buildFilterUrl({ type: filters.typeId, workspace: filters.workspaceId, tag: filters.tag, q: filters.q, sort: 'oldest' });

  return (
    <RecipesLayout title={sourceTitle} head={headContent} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings}>
      <JsonLd data={jsonLd} />

      <div class="recipes-page">
        {/* Sidebar: cuisines + cookbooks */}
        <aside class="recipes-sidebar">
          <div class="recipes-search">
            <input
              type="text"
              name="q"
              placeholder={`Search ${vocabulary.itemPlural}...`}
              value={filters.q || ''}
              hx-get="/"
              hx-target={HX_TARGET}
              hx-swap="innerHTML"
              hx-trigger="input changed delay:300ms, keyup[key=='Enter']"
              hx-push-url="true"
              hx-indicator={HX_INDICATOR}
              hx-vals={hxVals}
            />
          </div>

          {typesWithItems.length > 0 && (
            <div class="recipes-sidebar-section">
              <div class="recipes-sidebar-title">{vocabulary.typePlural}</div>
              <ul class="recipes-sidebar-list">
                <li>
                  {(() => {
                    const url = buildFilterUrl({ workspace: filters.workspaceId, q: filters.q, sort: sortParam });
                    return (
                      <a href={url} class={`recipes-sidebar-link ${!filters.typeId ? 'active' : ''}`} {...hxProps(url)}>
                        <span>All</span>
                        <span class="recipes-sidebar-count">{counts.total}</span>
                      </a>
                    );
                  })()}
                </li>
                {typesWithItems.map((type) => {
                  const url = buildFilterUrl({ type: type.id, workspace: filters.workspaceId, q: filters.q, sort: sortParam });
                  return (
                    <li>
                      <a href={url} class={`recipes-sidebar-link ${filters.typeId === type.id ? 'active' : ''}`} {...hxProps(url)}>
                        <span>{type.icon ? `${type.icon} ` : ''}{type.name}</span>
                        <span class="recipes-sidebar-count">{counts.byType[type.id] ?? 0}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {workspacesWithItems.length > 0 && (
            <div class="recipes-sidebar-section">
              <div class="recipes-sidebar-title">{vocabulary.workspacePlural}</div>
              <ul class="recipes-sidebar-list">
                {workspacesWithItems.map((ws) => {
                  const url = buildFilterUrl({ workspace: filters.workspaceId === ws.id ? undefined : ws.id, type: filters.typeId, q: filters.q, sort: sortParam });
                  return (
                    <li>
                      <a href={url} class={`recipes-sidebar-link ${filters.workspaceId === ws.id ? 'active' : ''}`} {...hxProps(url)}>
                        <span>{ws.name}</span>
                        <span class="recipes-sidebar-count">{counts.byWorkspace[ws.id] ?? 0}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </aside>

        {/* Main content area */}
        <div>
          {filters.tag && (
            <div class="recipes-active-tag">
              {(() => {
                const url = buildFilterUrl({ type: filters.typeId, workspace: filters.workspaceId, q: filters.q, sort: sortParam });
                return (
                  <a href={url} title="Clear tag filter" {...hxProps(url)}>
                    #{filters.tag} &times;
                  </a>
                );
              })()}
            </div>
          )}

          <div class="recipes-header-bar">
            <span class="recipes-result-count">
              {pagination.total} {pagination.total === 1 ? vocabulary.item : vocabulary.itemPlural}
              {activeType && <> in {activeType.name}</>}
              {activeWorkspace && <> in {activeWorkspace.name}</>}
            </span>
            <div class="recipes-sort">
              <a href={newestUrl} class={`recipes-sort-tab ${filters.sort === 'newest' ? 'active' : ''}`} {...hxProps(newestUrl)}>
                Newest
              </a>
              <a href={oldestUrl} class={`recipes-sort-tab ${filters.sort === 'oldest' ? 'active' : ''}`} {...hxProps(oldestUrl)}>
                Oldest
              </a>
            </div>
          </div>

          <div id="source-loading" class="source-loading htmx-indicator">
            <span class="app-spinner" />
          </div>
          <div id="source-results">
            {items.length === 0 ? (
              <p class="recipes-empty">No {vocabulary.itemPlural} found.</p>
            ) : (
              <>
                <div class="recipes-grid">
                  {items.map((item) => (
                    <RecipeCard item={item} vocabulary={vocabulary} />
                  ))}
                </div>
                <Pagination
                  total={pagination.total}
                  limit={pagination.limit}
                  offset={pagination.offset}
                  baseUrl={paginationBase}
                  htmxTarget={HX_TARGET}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </RecipesLayout>
  );
}
