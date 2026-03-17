import type { SignalTypeWithActions, WorkspaceSelect } from '@pignal/db';

interface PublicCounts {
  total: number;
  byType: Record<string, number>;
  byWorkspace: Record<string, number>;
}

interface FilterBarProps {
  types: SignalTypeWithActions[];
  activeTypeId?: string;
  workspaces?: WorkspaceSelect[];
  activeWorkspaceId?: string;
  activeTag?: string;
  mode?: 'categories' | 'workspaces';
  sort?: 'newest' | 'oldest';
  counts?: PublicCounts;
  query?: string;
  /** Base path for URLs. Public: '/', Admin: '/pignal/signals' */
  basePath?: string;
  /** HTMX swap target. Public: '#source-results', Admin: '#signal-list' */
  htmxTarget?: string;
  /** HTMX loading indicator. Public: '#source-loading', Admin: '#search-loading' */
  htmxIndicator?: string;
  /** Show archived filter toggle (admin only) */
  isArchived?: boolean;
  /** Total result count to display */
  totalResults?: number;
}

function buildUrl(basePath: string, params: Record<string, string | undefined>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) qs.set(k, v);
  }
  const s = qs.toString();
  return s ? `${basePath}?${s}` : basePath;
}

export function FilterBar({
  types, activeTypeId, workspaces, activeWorkspaceId, activeTag,
  mode = 'workspaces', sort = 'newest', counts, query,
  basePath = '/',
  htmxTarget = '#source-results',
  htmxIndicator = '#source-loading',
  isArchived,
  totalResults,
}: FilterBarProps) {
  const hasWorkspaces = workspaces && workspaces.length > 0;
  const sortParam = sort === 'oldest' ? 'oldest' : undefined;
  const isAdmin = basePath !== '/';

  // Query param names differ: public uses 'type'/'workspace', admin uses 'typeId'/'workspaceId'
  const typeParam = isAdmin ? 'typeId' : 'type';
  const wsParam = isAdmin ? 'workspaceId' : 'workspace';

  // Build hx-vals for search input: current filter state
  const hxValsObj: Record<string, string> = {};
  if (sort === 'oldest') hxValsObj.sort = 'oldest';
  if (activeTypeId) hxValsObj[typeParam] = activeTypeId;
  if (activeWorkspaceId) hxValsObj[wsParam] = activeWorkspaceId;
  if (activeTag) hxValsObj.tag = activeTag;
  if (mode === 'categories' && !activeTypeId) hxValsObj.mode = 'categories';
  if (isArchived) hxValsObj.isArchived = 'true';
  const hxVals = JSON.stringify(hxValsObj);

  // Sort base preserves current filters
  const sortBase: Record<string, string | undefined> = {};
  if (activeTypeId) sortBase[typeParam] = activeTypeId;
  if (activeWorkspaceId) sortBase[wsParam] = activeWorkspaceId;
  if (activeTag) sortBase.tag = activeTag;
  if (query) sortBase.q = query;
  if (mode === 'categories' && !activeTypeId) sortBase.mode = 'categories';
  if (isArchived) sortBase.isArchived = 'true';

  const newestUrl = buildUrl(basePath, { ...sortBase });
  const oldestUrl = buildUrl(basePath, { ...sortBase, sort: 'oldest' });

  // For admin, search hits the list partial endpoint
  const searchUrl = isAdmin ? `${basePath}/list` : basePath;

  return (
    <nav class="source-filter-bar" aria-label="Filters">
      {activeTag && (
        <div class="filter-bar-tag">
          <a href={basePath} class="filter-tag-chip active" title="Clear tag filter"
            hx-get={basePath} hx-target={htmxTarget} hx-swap="innerHTML" hx-push-url="true" hx-indicator={htmxIndicator}>
            #{activeTag} &times;
          </a>
        </div>
      )}

      {/* Row 1: Search + Sort (matches hub FeedBar) */}
      <div class="feed-bar">
        <input
          type="text"
          name="q"
          class="feed-search"
          placeholder="Search signals..."
          value={query || ''}
          hx-get={searchUrl}
          hx-target={htmxTarget}
          hx-swap="innerHTML"
          hx-trigger="input changed delay:300ms, keyup[key=='Enter']"
          hx-push-url="true"
          hx-indicator={htmxIndicator}
          hx-vals={hxVals}
        />
        <span class="feed-tabs">
          <a href={newestUrl} class={`feed-tab ${sort === 'newest' ? 'feed-tab-active' : ''}`}
            hx-get={newestUrl} hx-target={htmxTarget} hx-swap="innerHTML" hx-push-url="true" hx-indicator={htmxIndicator}>
            Newest
          </a>
          <a href={oldestUrl} class={`feed-tab ${sort === 'oldest' ? 'feed-tab-active' : ''}`}
            hx-get={oldestUrl} hx-target={htmxTarget} hx-swap="innerHTML" hx-push-url="true" hx-indicator={htmxIndicator}>
            Oldest
          </a>
        </span>
      </div>

      {/* Row 2: Mode toggle + Filter chips */}
      <div class="filter-bar-chips">
        {hasWorkspaces && (
          <div class="filter-bar-modes">
            <a
              href={buildUrl(basePath, { sort: sortParam, q: query, isArchived: isArchived ? 'true' : undefined })}
              data-mode="workspaces"
              class={`filter-mode-btn ${mode === 'workspaces' ? 'active' : ''}`}
              hx-get={buildUrl(basePath, { sort: sortParam, q: query, isArchived: isArchived ? 'true' : undefined })}
              hx-target={htmxTarget} hx-swap="innerHTML" hx-push-url="true" hx-indicator={htmxIndicator}
            >
              Workspaces
            </a>
            <a
              href={buildUrl(basePath, { mode: 'categories', sort: sortParam, q: query, isArchived: isArchived ? 'true' : undefined })}
              data-mode="categories"
              class={`filter-mode-btn ${mode === 'categories' ? 'active' : ''}`}
              hx-get={buildUrl(basePath, { mode: 'categories', sort: sortParam, q: query, isArchived: isArchived ? 'true' : undefined })}
              hx-target={htmxTarget} hx-swap="innerHTML" hx-push-url="true" hx-indicator={htmxIndicator}
            >
              Categories
            </a>
          </div>
        )}

        {/* Archived toggle (admin only) */}
        {isArchived !== undefined && (
          <label class="filter-archived-toggle">
            <input type="checkbox" name="isArchived" value="true" checked={isArchived}
              hx-get={searchUrl} hx-trigger="change" hx-target={htmxTarget}
              hx-include="[name='q']"
              hx-indicator={htmxIndicator}
            />
            Archived
          </label>
        )}

        {/* Workspaces chips */}
        {hasWorkspaces && (
          <div class="filter-bar-items" data-chips="workspaces" hidden={mode !== 'workspaces'}>
            <a href={buildUrl(basePath, { sort: sortParam, q: query, isArchived: isArchived ? 'true' : undefined })} class={`filter-chip ${!activeWorkspaceId ? 'active' : ''}`}
              hx-get={buildUrl(basePath, { sort: sortParam, q: query, isArchived: isArchived ? 'true' : undefined })} hx-target={htmxTarget} hx-swap="innerHTML" hx-push-url="true" hx-indicator={htmxIndicator}>
              All{counts ? <span class="filter-chip-count"> ({counts.total})</span> : ''}
            </a>
            {workspaces!.map((ws) => {
              const wsCount = counts?.byWorkspace[ws.id];
              return (
                <a href={buildUrl(basePath, { [wsParam]: ws.id, sort: sortParam, q: query, isArchived: isArchived ? 'true' : undefined })} class={`filter-chip ${activeWorkspaceId === ws.id ? 'active' : ''}`}
                  hx-get={buildUrl(basePath, { [wsParam]: ws.id, sort: sortParam, q: query, isArchived: isArchived ? 'true' : undefined })} hx-target={htmxTarget} hx-swap="innerHTML" hx-push-url="true" hx-indicator={htmxIndicator}>
                  {ws.name}{wsCount !== undefined ? <span class="filter-chip-count"> ({wsCount})</span> : ''}
                </a>
              );
            })}
          </div>
        )}

        {/* Categories chips */}
        <div class="filter-bar-items" data-chips="categories" hidden={mode !== 'categories'}>
          <a href={buildUrl(basePath, { mode: 'categories', sort: sortParam, q: query, isArchived: isArchived ? 'true' : undefined })} class={`filter-chip ${!activeTypeId && !activeTag ? 'active' : ''}`}
            hx-get={buildUrl(basePath, { mode: 'categories', sort: sortParam, q: query, isArchived: isArchived ? 'true' : undefined })} hx-target={htmxTarget} hx-swap="innerHTML" hx-push-url="true" hx-indicator={htmxIndicator}>
            All{counts ? <span class="filter-chip-count"> ({counts.total})</span> : ''}
          </a>
          {types.map((type) => {
            const typeCount = counts?.byType[type.id];
            return (
              <a href={buildUrl(basePath, { [typeParam]: type.id, mode: 'categories', sort: sortParam, q: query, isArchived: isArchived ? 'true' : undefined })} class={`filter-chip ${activeTypeId === type.id ? 'active' : ''}`}
                hx-get={buildUrl(basePath, { [typeParam]: type.id, mode: 'categories', sort: sortParam, q: query, isArchived: isArchived ? 'true' : undefined })} hx-target={htmxTarget} hx-swap="innerHTML" hx-push-url="true" hx-indicator={htmxIndicator}>
                {type.icon ? `${type.icon} ` : ''}{type.name}{typeCount !== undefined ? <span class="filter-chip-count"> ({typeCount})</span> : ''}
              </a>
            );
          })}
        </div>
      </div>

      {totalResults !== undefined && (
        <p class="result-count">{totalResults} signal{totalResults !== 1 ? 's' : ''} found</p>
      )}
    </nav>
  );
}
