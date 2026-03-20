import type { ItemTypeWithActions, WorkspaceSelect } from '@pignal/db';

interface FilterCounts {
  total: number;
  byType: Record<string, number>;
  byWorkspace: Record<string, number>;
  byWorkspaceType: Record<string, Record<string, number>>;
}

interface FilterBarProps {
  types: ItemTypeWithActions[];
  activeTypeId?: string;
  workspaces?: WorkspaceSelect[];
  activeWorkspaceId?: string;
  activeTag?: string;
  sort?: 'newest' | 'oldest';
  counts?: FilterCounts;
  query?: string;
  /** Base path for URLs. Public: '/', Admin: '/pignal/items' */
  basePath?: string;
  /** HTMX swap target. Public: '#source-results', Admin: '#item-list' */
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
  sort = 'newest', counts, query,
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
  if (isArchived) hxValsObj.isArchived = 'true';
  const hxVals = JSON.stringify(hxValsObj);

  // Sort base preserves current filters
  const sortBase: Record<string, string | undefined> = {};
  if (activeTypeId) sortBase[typeParam] = activeTypeId;
  if (activeWorkspaceId) sortBase[wsParam] = activeWorkspaceId;
  if (activeTag) sortBase.tag = activeTag;
  if (query) sortBase.q = query;
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

      {/* Row 1: Search + Sort */}
      <div class="feed-bar">
        <input
          type="text"
          name="q"
          class="feed-search"
          placeholder="Search items..."
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

      {/* Row 2: Workspace chips with type dropdowns */}
      {hasWorkspaces && (
      <div class="filter-bar-chips">
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

        {/* Workspace chips with hover dropdowns — hide empty workspaces */}
        {workspaces!.map((ws) => {
          const wsTypes = counts?.byWorkspaceType[ws.id] ?? {};
          const typesWithSignals = types.filter((t) => (wsTypes[t.id] ?? 0) > 0);

          // Skip workspaces with no types that have signals
          if (typesWithSignals.length === 0) return null;

          const wsCount = counts?.byWorkspace[ws.id];
          const isActiveWs = activeWorkspaceId === ws.id;
          const wsUrl = buildUrl(basePath, { [wsParam]: ws.id, sort: sortParam, q: query, isArchived: isArchived ? 'true' : undefined });
          const clearUrl = buildUrl(basePath, { sort: sortParam, q: query, isArchived: isArchived ? 'true' : undefined });
          const chipUrl = isActiveWs ? clearUrl : wsUrl;

          return (
            <div class="ws-dropdown">
              <a href={chipUrl}
                class={`filter-chip ${isActiveWs ? 'active' : ''}`}
                hx-get={chipUrl} hx-target={htmxTarget} hx-swap="innerHTML" hx-push-url="true" hx-indicator={htmxIndicator}>
                {ws.name}{wsCount !== undefined ? <span class="filter-chip-count"> ({wsCount})</span> : ''}
              </a>
              <div class="ws-dropdown-menu">
                {typesWithSignals.map((type) => {
                  const typeUrl = buildUrl(basePath, { [wsParam]: ws.id, [typeParam]: type.id, sort: sortParam, q: query, isArchived: isArchived ? 'true' : undefined });
                  const isActiveType = isActiveWs && activeTypeId === type.id;
                  return (
                    <a href={typeUrl}
                      class={`ws-dropdown-item ${isActiveType ? 'active' : ''}`}
                      hx-get={typeUrl} hx-target={htmxTarget} hx-swap="innerHTML" hx-push-url="true" hx-indicator={htmxIndicator}>
                      <span>{type.icon ? `${type.icon} ` : ''}{type.name}</span>
                      <span class="ws-dropdown-count">{wsTypes[type.id]}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      )}

      {totalResults !== undefined && (
        <p class="result-count">{totalResults} item{totalResults !== 1 ? 's' : ''} found</p>
      )}
    </nav>
  );
}
