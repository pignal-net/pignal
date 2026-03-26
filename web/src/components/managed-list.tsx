import type { Child } from 'hono/jsx';
import { Pagination } from '@pignal/render/components/pagination';

export interface SortTab {
  label: string;
  value: string;
  active: boolean;
  href: string;
}

export interface FilterLink {
  label: string;
  href: string;
}

/** Render a single filter dropdown. Exported for OOB re-rendering. */
export function FilterDropdownWidget({ dd, id, resultsId, loadingId, pushUrlAttr, oob }: {
  dd: FilterDropdown;
  id: string;
  resultsId: string;
  loadingId: string;
  pushUrlAttr: Record<string, string>;
  oob?: boolean;
}) {
  const active = dd.options.find((o) => o.active);
  const triggerLabel = active ? `${dd.label}: ${active.label}` : dd.label;
  const filterId = `${id}-filter-${dd.name}`;
  // Hide options with 0 count (but always show "All" and the active option)
  const visibleOptions = dd.options.filter((opt) => {
    if (opt.active) return true;
    if (opt.label === 'All' || opt.label === 'Active' || opt.label === 'Archived') return true;
    // Hide zero-count options: check if label ends with "(0)"
    if (opt.label.endsWith('(0)')) return false;
    return true;
  });

  return (
    <div class="form-dropdown form-dropdown-compact" id={filterId} {...(oob ? { 'hx-swap-oob': 'outerHTML' } : {})}>
      <button type="button" class="form-dropdown-trigger" aria-haspopup="listbox">
        <span class="form-dropdown-label">{triggerLabel}</span>
      </button>
      <ul role="listbox" class="form-dropdown-list">
        {visibleOptions.map((opt) => (
          <li>
            <a
              href={opt.href}
              data-value={`${dd.label}: ${opt.label}`}
              data-label={`${dd.label}: ${opt.label}`}
              aria-selected={opt.active ? 'true' : undefined}
              hx-get={opt.href}
              hx-target={`#${resultsId}`}
              hx-swap="innerHTML"
              hx-indicator={`#${loadingId}`}
              {...pushUrlAttr}
            >
              {opt.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface FilterDropdown {
  label: string;
  name: string;
  options: Array<{ label: string; href: string; active: boolean }>;
}

export interface BulkAction {
  label: string;
  action: string;
  confirm?: string;
  destructive?: boolean;
}

export interface TableColumn {
  key: string;
  label: string;
  class?: string;
  headerClass?: string;
}

/** Reusable table shell (wrap + table + thead). Used by ManagedList and HTMX partials. */
export function TableResultsWrapper({ id, columns, hasBulk, children }: {
  id: string;
  columns: TableColumn[];
  hasBulk?: boolean;
  children: Child;
}) {
  return (
    <div class="managed-table-wrap">
      <table class="managed-table">
        <thead>
          <tr>
            {hasBulk && (
              <th class="managed-table-check">
                <input type="checkbox" class="native-check" data-bulk-select-all={id} />
              </th>
            )}
            {columns.map((col) => (
              <th class={`managed-table-th ${col.headerClass ?? ''}`}>{col.label}</th>
            ))}
            <th class="managed-table-th managed-table-actions" />
          </tr>
        </thead>
        {children}
      </table>
    </div>
  );
}

export interface ManagedListProps {
  id: string;
  children: Child;
  searchEndpoint?: string;
  searchPlaceholder?: string;
  query?: string;
  extraParams?: Record<string, string>;
  sortTabs?: SortTab[];
  filterLinks?: FilterLink[];
  filterDropdowns?: FilterDropdown[];
  activeFilter?: string;
  activeFilterClearHref?: string;
  bulkActions?: BulkAction[];
  csrfToken?: string;
  totalCount: number;
  emptyMessage?: string;
  pagination?: { total: number; limit: number; offset: number; baseUrl: string };
  addButton?: Child;
  pushUrl?: boolean;
  display?: 'list' | 'table';
  columns?: TableColumn[];
}

export function ManagedList(props: ManagedListProps) {
  const {
    id, children,
    searchEndpoint, searchPlaceholder, query, extraParams,
    sortTabs, filterLinks, filterDropdowns,
    activeFilter, activeFilterClearHref,
    bulkActions, csrfToken,
    totalCount, emptyMessage, pagination, addButton, pushUrl,
    display, columns,
  } = props;

  const resultsId = `${id}-results`;
  const loadingId = `${id}-loading`;
  const hasBulk = bulkActions && bulkActions.length > 0;
  const pushUrlAttr: Record<string, string> = pushUrl ? { 'hx-push-url': 'true' } : {};

  return (
    <div data-managed-list={id}>
      {/* Toolbar: [Search] [Filter Dropdowns...] [Sort Tabs] [Add Button] */}
      <div class="feed-bar">
        {searchEndpoint && (
          <input
            type="text"
            name="q"
            value={query}
            placeholder={searchPlaceholder || 'Search...'}
            class="feed-search"
            hx-get={searchEndpoint}
            hx-target={`#${resultsId}`}
            hx-swap="innerHTML"
            hx-trigger="input changed delay:300ms, keyup[key=='Enter']"
            hx-include="this"
            hx-indicator={`#${loadingId}`}
            {...pushUrlAttr}
            {...(extraParams ? { 'hx-vals': JSON.stringify(extraParams) } : {})}
          />
        )}
        {/* Filter dropdowns (compact, inline with search) */}
        {filterDropdowns && filterDropdowns.map((dd) => (
          <FilterDropdownWidget dd={dd} id={id} resultsId={resultsId} loadingId={loadingId} pushUrlAttr={pushUrlAttr} />
        ))}
        {/* Filter links (simple tabs) */}
        {filterLinks && filterLinks.length > 0 && !activeFilter && (
          <span class="feed-tabs">
            {filterLinks.map((link) => (
              <a
                href={link.href}
                class="feed-tab"
                hx-get={link.href}
                hx-target={`#${resultsId}`}
                hx-swap="innerHTML"
                hx-indicator={`#${loadingId}`}
                {...pushUrlAttr}
              >
                {link.label}
              </a>
            ))}
          </span>
        )}
        {/* Sort tabs pushed to right */}
        {sortTabs && sortTabs.length > 0 && (
          <span class="feed-tabs ml-auto">
            {sortTabs.map((tab) => (
              <a
                href={tab.href}
                class={`feed-tab ${tab.active ? 'feed-tab-active' : ''}`}
                hx-get={tab.href}
                hx-target={`#${resultsId}`}
                hx-swap="innerHTML"
                hx-indicator={`#${loadingId}`}
                {...pushUrlAttr}
              >
                {tab.label}
              </a>
            ))}
          </span>
        )}
        {addButton}
      </div>

      {/* Active filter bar */}
      {activeFilter && activeFilterClearHref && (
        <div class="active-filter">
          <span class="active-filter-label">Filtering:</span>
          <span class="font-semibold">{activeFilter}</span>
          <a
            class="active-filter-clear"
            href={activeFilterClearHref}
            title="Clear filter"
            hx-get={activeFilterClearHref}
            hx-target={`#${resultsId}`}
            hx-swap="innerHTML"
            hx-indicator={`#${loadingId}`}
            {...pushUrlAttr}
          >
            &times;
          </a>
        </div>
      )}

      {/* Bulk action bar */}
      {hasBulk && (
        <div class="bulk-bar" hidden>
          {display !== 'table' && (
            <label class="bulk-select-all">
              <input type="checkbox" class="native-check" data-bulk-select-all={id} /> Select all
            </label>
          )}
          <span class="bulk-info">
            <span class="bulk-count">0</span> selected
          </span>
          {bulkActions.map((action) => (
            <button
              class={`btn-sm ${action.destructive ? 'outline text-error' : ''}`}
              hx-post={action.action}
              hx-include={`[data-managed-list="${id}"] [data-bulk-select]:checked`}
              hx-vals={JSON.stringify({ _csrf: csrfToken })}
              hx-target={`#${resultsId}`}
              hx-swap="innerHTML"
              {...(action.confirm ? { 'hx-confirm': action.confirm } : {})}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      <div id={loadingId} class="feed-loading htmx-indicator">
        <span class="app-spinner" />
      </div>

      {display === 'table' ? (
        <div id={resultsId}>
          <TableResultsWrapper id={id} columns={columns!} hasBulk={hasBulk}>
            <tbody id={`${id}-feed`} class="managed-table-body">
              {totalCount === 0
                ? <tr><td colspan={(columns!.length + (hasBulk ? 2 : 1))} class="managed-table-td text-center py-8 text-muted">{emptyMessage || 'No items yet.'}</td></tr>
                : children}
            </tbody>
          </TableResultsWrapper>
          {pagination && pagination.total > pagination.limit && (
            <Pagination {...pagination} htmxTarget={`#${resultsId}`} htmxIndicator={`#${loadingId}`} />
          )}
        </div>
      ) : (
        <div id={resultsId}>
          <ol class="feed-list" id={`${id}-feed`}>
            {totalCount === 0 ? (
              <li class="empty-state" id={`${id}-empty`}>{emptyMessage || 'No items yet.'}</li>
            ) : children}
          </ol>
          {pagination && pagination.total > pagination.limit && (
            <Pagination {...pagination} htmxTarget={`#${resultsId}`} htmxIndicator={`#${loadingId}`} />
          )}
        </div>
      )}
    </div>
  );
}
