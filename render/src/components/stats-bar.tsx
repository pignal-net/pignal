/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */

interface SourceStats {
  totalItems: number;
  totalTypes: number;
  totalWorkspaces: number;
}

/**
 * Render a statistics bar as an HTML string for directive embedding.
 *
 * @param stats - Source statistics with totalItems, totalTypes, and totalWorkspaces
 */
export function renderStatsBarHtml(stats: SourceStats): string {
  return `<div class="my-6 grid grid-cols-3 gap-4"><div class="text-center p-4 rounded-lg bg-surface border border-border-subtle"><p class="text-2xl font-bold text-primary">${stats.totalItems}</p><p class="text-xs text-muted mt-1">Items</p></div><div class="text-center p-4 rounded-lg bg-surface border border-border-subtle"><p class="text-2xl font-bold text-primary">${stats.totalTypes}</p><p class="text-xs text-muted mt-1">Types</p></div><div class="text-center p-4 rounded-lg bg-surface border border-border-subtle"><p class="text-2xl font-bold text-primary">${stats.totalWorkspaces}</p><p class="text-xs text-muted mt-1">Workspaces</p></div></div>`;
}
