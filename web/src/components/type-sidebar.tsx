import type { SignalTypeWithActions, WorkspaceSelect } from '@pignal/db';

interface FilterBarProps {
  types: SignalTypeWithActions[];
  activeTypeId?: string;
  workspaces?: WorkspaceSelect[];
  activeWorkspaceId?: string;
  activeTag?: string;
  mode?: 'categories' | 'workspaces';
  sort?: 'newest' | 'oldest';
}

function buildUrl(params: Record<string, string | undefined>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) qs.set(k, v);
  }
  const s = qs.toString();
  return s ? `/?${s}` : '/';
}

export function FilterBar({ types, activeTypeId, workspaces, activeWorkspaceId, activeTag, mode = 'categories', sort = 'newest' }: FilterBarProps) {
  const hasWorkspaces = workspaces && workspaces.length > 0;

  // Preserve current filter state when toggling sort
  const sortBase: Record<string, string | undefined> = {};
  if (activeTypeId) sortBase.type = activeTypeId;
  if (activeWorkspaceId) sortBase.workspace = activeWorkspaceId;
  if (activeTag) sortBase.tag = activeTag;
  if (mode === 'workspaces' && !activeWorkspaceId) sortBase.mode = 'workspaces';

  const newestUrl = buildUrl({ ...sortBase });
  const oldestUrl = buildUrl({ ...sortBase, sort: 'oldest' });

  // Preserve sort when picking a filter chip
  const sortParam = sort === 'oldest' ? 'oldest' : undefined;

  return (
    <nav class="filter-bar" aria-label="Filters">
      {activeTag && (
        <div class="filter-bar-tag">
          <a href="/" class="filter-tag-chip active" title="Clear tag filter">
            #{activeTag} &times;
          </a>
        </div>
      )}

      <div class="filter-bar-top">
        {hasWorkspaces && (
          <div class="filter-bar-modes">
            <a
              href={buildUrl({ sort: sortParam })}
              class={`filter-mode-btn ${mode === 'categories' ? 'active' : ''}`}
            >
              Categories
            </a>
            <a
              href={buildUrl({ mode: 'workspaces', sort: sortParam })}
              class={`filter-mode-btn ${mode === 'workspaces' ? 'active' : ''}`}
            >
              Workspaces
            </a>
          </div>
        )}

        <div class="filter-bar-sort">
          <a href={newestUrl} class={`filter-sort-btn ${sort === 'newest' ? 'active' : ''}`}>Newest</a>
          <a href={oldestUrl} class={`filter-sort-btn ${sort === 'oldest' ? 'active' : ''}`}>Oldest</a>
        </div>
      </div>

      <div class="filter-bar-items">
        {mode === 'categories' ? (
          <>
            <a href={buildUrl({ sort: sortParam })} class={`filter-chip ${!activeTypeId && !activeTag ? 'active' : ''}`}>All</a>
            {types.map((type) => (
              <a
                href={buildUrl({ type: type.id, sort: sortParam })}
                class={`filter-chip ${activeTypeId === type.id ? 'active' : ''}`}
              >
                {type.icon ? `${type.icon} ` : ''}{type.name}
              </a>
            ))}
          </>
        ) : (
          <>
            <a href={buildUrl({ mode: 'workspaces', sort: sortParam })} class={`filter-chip ${!activeWorkspaceId ? 'active' : ''}`}>All</a>
            {workspaces!.map((ws) => (
              <a
                href={buildUrl({ workspace: ws.id, sort: sortParam })}
                class={`filter-chip ${activeWorkspaceId === ws.id ? 'active' : ''}`}
              >
                {ws.name}
              </a>
            ))}
          </>
        )}
      </div>
    </nav>
  );
}
