/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */
import type { ItemTypeWithActions, WorkspaceSelect } from '@pignal/db';
import type { TFunction } from '../i18n/types';

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
  t?: TFunction;
}

function buildUrl(basePath: string, params: Record<string, string | undefined>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) qs.set(k, v);
  }
  const s = qs.toString();
  return s ? `${basePath}?${s}` : basePath;
}

const identity = (key: string) => key;

export function FilterBar({
  types, activeTypeId, workspaces, activeWorkspaceId, activeTag,
  sort = 'newest', counts, query,
  basePath = '/',
  htmxTarget = '#source-results',
  htmxIndicator = '#source-loading',
  isArchived,
  totalResults,
  t: tProp,
}: FilterBarProps) {
  const t = tProp ?? identity;
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

  const searchPlaceholder = `${t('common.search')}...`;

  return (
    <nav class="source-filter-bar flex flex-col gap-0 mb-6" aria-label="Filters">
      {activeTag && (
        <div class="filter-bar-tag flex items-center gap-2 mb-1">
          <a href={basePath} class="filter-tag-chip active inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium no-underline bg-primary text-primary-inverse"
            hx-get={basePath} hx-target={htmxTarget} hx-swap="innerHTML" hx-push-url="true" hx-indicator={htmxIndicator}>
            #{activeTag} &times;
          </a>
        </div>
      )}

      {/* Row 1: Search + Sort */}
      <div class="feed-bar flex flex-col sm:flex-row sm:items-center gap-2 py-1.5 mb-1 border-b border-border">
        <input
          type="text"
          name="q"
          class="feed-search flex-1 sm:max-w-[50%] h-10 m-0 px-2.5 py-1 text-sm border border-border rounded-lg bg-surface text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary-focus"
          placeholder={searchPlaceholder}
          value={query || ''}
          hx-get={searchUrl}
          hx-target={htmxTarget}
          hx-swap="innerHTML"
          hx-trigger="input changed delay:300ms, keyup[key=='Enter']"
          hx-push-url="true"
          hx-indicator={htmxIndicator}
          hx-vals={hxVals}
        />
        <div class="feed-tabs flex bg-surface-hover rounded-lg p-0.5 border border-border shrink-0">
          <a href={newestUrl} class={`feed-tab px-3 py-1.5 rounded-md text-xs font-medium transition-all ${sort === 'newest' ? 'feed-tab-active bg-surface text-text shadow-xs' : 'text-muted hover:text-text'}`}
            hx-get={newestUrl} hx-target={htmxTarget} hx-swap="innerHTML" hx-push-url="true" hx-indicator={htmxIndicator}>
            {t('common.newest')}
          </a>
          <a href={oldestUrl} class={`feed-tab px-3 py-1.5 rounded-md text-xs font-medium transition-all ${sort === 'oldest' ? 'feed-tab-active bg-surface text-text shadow-xs' : 'text-muted hover:text-text'}`}
            hx-get={oldestUrl} hx-target={htmxTarget} hx-swap="innerHTML" hx-push-url="true" hx-indicator={htmxIndicator}>
            {t('common.oldest')}
          </a>
        </div>
      </div>

      {/* Row 2: Workspace chips with type dropdowns */}
      {hasWorkspaces && (
      <div class="filter-bar-chips flex items-center flex-wrap gap-2 py-1.5">
        {/* Archived toggle (admin only) */}
        {isArchived !== undefined && (
          <label class="filter-archived-toggle inline-flex items-center gap-1 text-xs text-muted cursor-pointer shrink-0 m-0">
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
          const typesWithSignals = types.filter((tp) => (wsTypes[tp.id] ?? 0) > 0);

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
                class={`filter-chip px-3 py-1.5 rounded-full text-sm font-medium ${isActiveWs ? 'active' : ''}`}
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
        <p class="text-sm text-muted mb-3">{totalResults} item{totalResults !== 1 ? 's' : ''} found</p>
      )}
    </nav>
  );
}
