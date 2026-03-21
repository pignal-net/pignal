import type { SourcePageProps } from '@pignal/templates';
import { Pagination } from '../../components/pagination';
import { JsonLd } from '../../components/json-ld';
import { buildSourceJsonLd, buildMetaTags, escapeHtmlAttr } from '../../lib/seo';
import { stripMarkdown } from '../../lib/markdown';
import { ServicesLayout } from './layout';

const HX_TARGET = '#source-results';
const HX_INDICATOR = '#source-loading';
const HX_SWAP = 'innerHTML';

function buildFilterUrl(params: Record<string, string | undefined>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) qs.set(k, v);
  }
  const s = qs.toString();
  return s ? `/?${s}` : '/';
}

function hxProps(url: string) {
  return {
    'hx-get': url,
    'hx-target': HX_TARGET,
    'hx-swap': HX_SWAP,
    'hx-push-url': 'true',
    'hx-indicator': HX_INDICATOR,
  };
}

export function ServicesSourcePage(props: SourcePageProps) {
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

  const sourceTitle = settings.source_title || 'My Services';
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
  const sortParam = filters.sort === 'oldest' ? 'oldest' : undefined;

  const hxValsObj: Record<string, string> = {};
  if (filters.sort === 'oldest') hxValsObj.sort = 'oldest';
  if (filters.typeId) hxValsObj.type = filters.typeId;
  if (filters.workspaceId) hxValsObj.workspace = filters.workspaceId;
  if (filters.tag) hxValsObj.tag = filters.tag;
  const hxVals = JSON.stringify(hxValsObj);

  const typesWithItems = types.filter((t) => (counts.byType[t.id] ?? 0) > 0);
  const workspacesWithItems = workspaces.filter((w) => (counts.byWorkspace[w.id] ?? 0) > 0);

  const newestUrl = buildFilterUrl({ type: filters.typeId, workspace: filters.workspaceId, tag: filters.tag, q: filters.q });
  const oldestUrl = buildFilterUrl({ type: filters.typeId, workspace: filters.workspaceId, tag: filters.tag, q: filters.q, sort: 'oldest' });

  // Group items by tier (type)
  const grouped: Record<string, { type: typeof types[0]; items: typeof items }> = {};
  const ungrouped: typeof items = [];
  for (const item of items) {
    if (item.typeId) {
      if (!grouped[item.typeId]) {
        const type = types.find((t) => t.id === item.typeId);
        if (type) grouped[item.typeId] = { type, items: [] };
      }
      if (grouped[item.typeId]) {
        grouped[item.typeId].items.push(item);
      } else {
        ungrouped.push(item);
      }
    } else {
      ungrouped.push(item);
    }
  }

  return (
    <ServicesLayout title={sourceTitle} head={headContent} sourceTitle={sourceTitle} sourceUrl={sourceUrl} settings={settings}>
      <JsonLd data={jsonLd} />

      <div class="services-page">
        {/* Search */}
        <div class="services-search">
          <input
            type="text"
            name="q"
            placeholder={`Search ${vocabulary.itemPlural}...`}
            value={filters.q || ''}
            hx-get="/"
            hx-target={HX_TARGET}
            hx-swap={HX_SWAP}
            hx-trigger="input changed delay:300ms, keyup[key=='Enter']"
            hx-push-url="true"
            hx-indicator={HX_INDICATOR}
            hx-vals={hxVals}
          />
        </div>

        {/* Package filter chips */}
        {workspacesWithItems.length > 0 && (
          <div class="services-filters">
            {(() => {
              const allUrl = buildFilterUrl({ type: filters.typeId, q: filters.q, sort: sortParam });
              return (
                <a href={allUrl} class={`services-chip ${!filters.workspaceId ? 'active' : ''}`} {...hxProps(allUrl)}>
                  All {vocabulary.workspacePlural}
                </a>
              );
            })()}
            {workspacesWithItems.map((ws) => {
              const url = buildFilterUrl({ workspace: filters.workspaceId === ws.id ? undefined : ws.id, type: filters.typeId, q: filters.q, sort: sortParam });
              return (
                <a href={url} class={`services-chip ${filters.workspaceId === ws.id ? 'active' : ''}`} {...hxProps(url)}>
                  {ws.name}
                  <span class="services-chip-count">{counts.byWorkspace[ws.id] ?? 0}</span>
                </a>
              );
            })}
          </div>
        )}

        {/* Tier filter chips */}
        {typesWithItems.length > 1 && (
          <div class="services-filters">
            {(() => {
              const allUrl = buildFilterUrl({ workspace: filters.workspaceId, q: filters.q, sort: sortParam });
              return (
                <a href={allUrl} class={`services-chip ${!filters.typeId ? 'active' : ''}`} {...hxProps(allUrl)}>
                  All {vocabulary.typePlural}
                </a>
              );
            })()}
            {typesWithItems.map((type) => {
              const url = buildFilterUrl({ type: filters.typeId === type.id ? undefined : type.id, workspace: filters.workspaceId, q: filters.q, sort: sortParam });
              return (
                <a href={url} class={`services-chip ${filters.typeId === type.id ? 'active' : ''}`} {...hxProps(url)}>
                  {type.icon ? `${type.icon} ` : ''}{type.name}
                  <span class="services-chip-count">{counts.byType[type.id] ?? 0}</span>
                </a>
              );
            })}
          </div>
        )}

        {/* Active tag */}
        {filters.tag && (
          <div class="services-active-tag">
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

        {/* Header bar */}
        <div class="services-header-bar">
          <span class="services-result-count">
            {pagination.total} {pagination.total === 1 ? vocabulary.item : vocabulary.itemPlural}
            {activeType && <> in {activeType.name}</>}
            {activeWorkspace && <> in {activeWorkspace.name}</>}
          </span>
          <div class="services-sort">
            <a href={newestUrl} class={`services-sort-tab ${filters.sort === 'newest' ? 'active' : ''}`} {...hxProps(newestUrl)}>
              Newest
            </a>
            <a href={oldestUrl} class={`services-sort-tab ${filters.sort === 'oldest' ? 'active' : ''}`} {...hxProps(oldestUrl)}>
              Oldest
            </a>
          </div>
        </div>

        <div id="source-loading" class="source-loading htmx-indicator">
          <span class="app-spinner" />
        </div>
        <div id="source-results">
          {items.length === 0 ? (
            <p class="services-empty">No {vocabulary.itemPlural} found.</p>
          ) : (
            <>
              {/* Grouped by tier */}
              {types.filter((t) => grouped[t.id]).map((type) => (
                <>
                  <div class="services-tier-header">
                    {type.icon && <span class="services-tier-icon">{type.icon}</span>}
                    {type.name}
                  </div>
                  <div class="services-grid">
                    {grouped[type.id].items.map((item) => {
                      const desc = stripMarkdown(item.content).slice(0, 150);
                      return (
                        <div class="services-card">
                          <div class="services-card-header">
                            <h3><a href={`/item/${item.slug}`}>{item.keySummary}</a></h3>
                            <span class="services-tier-badge">{item.typeName}</span>
                          </div>
                          {desc && <div class="services-card-description">{desc}</div>}
                          <div class="services-card-footer">
                            <div>
                              {item.workspaceName && <span class="services-package-label">{item.workspaceName}</span>}
                            </div>
                            <div style="display:flex;align-items:center;gap:0.5rem">
                              {item.validationActionLabel && (
                                <span class="services-availability-badge">{item.validationActionLabel}</span>
                              )}
                              <a href={`/item/${item.slug}`}>Details</a>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ))}
              {ungrouped.length > 0 && (
                <>
                  <div class="services-tier-header">Other</div>
                  <div class="services-grid">
                    {ungrouped.map((item) => {
                      const desc = stripMarkdown(item.content).slice(0, 150);
                      return (
                        <div class="services-card">
                          <div class="services-card-header">
                            <h3><a href={`/item/${item.slug}`}>{item.keySummary}</a></h3>
                          </div>
                          {desc && <div class="services-card-description">{desc}</div>}
                          <div class="services-card-footer">
                            <div>
                              {item.workspaceName && <span class="services-package-label">{item.workspaceName}</span>}
                            </div>
                            <a href={`/item/${item.slug}`}>Details</a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
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
    </ServicesLayout>
  );
}
