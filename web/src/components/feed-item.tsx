import type { Child } from 'hono/jsx';

export function FeedItem({ id, children }: { id: string; children: Child }) {
  return <li class="feed-item" id={id}>{children}</li>;
}

export function FeedItemTitle({ children, bulkValue }: { children: Child; bulkValue?: string }) {
  return (
    <div class="feed-item-title-row">
      {bulkValue !== undefined && (
        <input type="checkbox" class="feed-item-check native-check" name="ids[]" value={bulkValue} data-bulk-select />
      )}
      {children}
    </div>
  );
}

export function FeedItemMeta({ children }: { children: Child }) {
  return <div class="feed-item-meta">{children}</div>;
}

export function FeedItemSep() {
  return <span class="feed-item-meta-sep" />;
}

export function FeedItemActions({ children }: { children: Child }) {
  return <div class="feed-item-actions">{children}</div>;
}

// --- Table mode components ---

export function TableRow({ id, children, bulkValue }: { id: string; children: Child; bulkValue?: string }) {
  return (
    <tr class="managed-table-row" id={id}>
      {bulkValue !== undefined && (
        <td class="managed-table-check">
          <input type="checkbox" class="native-check" name="ids[]" value={bulkValue} data-bulk-select />
        </td>
      )}
      {children}
    </tr>
  );
}

export function TableCell({ children, class: cls }: { children: Child; class?: string }) {
  return <td class={`managed-table-td ${cls ?? ''}`}>{children}</td>;
}

export function TableActions({ children }: { children: Child }) {
  return <td class="managed-table-td managed-table-actions">{children}</td>;
}

/** Action definition for RowActions. */
export interface RowAction {
  label: string;
  /** HTMX GET (e.g., edit form dialog) */
  hxGet?: string;
  /** HTMX POST (e.g., delete, toggle) */
  hxPost?: string;
  /** Regular link href */
  href?: string;
  /** HTMX target element */
  hxTarget?: string;
  /** HTMX swap strategy */
  hxSwap?: string;
  /** Confirm message (triggers custom confirm dialog) */
  hxConfirm?: string;
  /** Destructive action (red styling) */
  destructive?: boolean;
  /** CSRF token (for POST actions) */
  csrf?: string;
}

/**
 * Row actions — inline buttons or "Actions ▾" dropdown.
 * - 2 or fewer: show as inline outline buttons
 * - More than 2: show a single "Actions ▾" dropdown (same style as filter dropdowns)
 */
export function RowActions({ actions, maxVisible = 2 }: { actions: RowAction[]; maxVisible?: number }) {
  if (actions.length === 0) return null;

  if (actions.length <= maxVisible) {
    return (
      <div class="flex items-center gap-1 justify-end">
        {actions.map((a) => renderActionButton(a))}
      </div>
    );
  }

  return (
    <div class="flex items-center gap-1 justify-end">
      <div class="form-dropdown form-dropdown-compact row-actions-dd">
        <button type="button" class="form-dropdown-trigger" aria-haspopup="listbox">
          <span class="form-dropdown-label">Actions</span>
        </button>
        <ul role="listbox" class="form-dropdown-list">
          {actions.map((a) => (
            <li>{renderActionLink(a)}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Render an action as an inline outline button. */
function renderActionButton(a: RowAction) {
  const cls = `outline btn-sm${a.destructive ? ' text-error' : ''}`;

  if (a.href) {
    return <a href={a.href} class={cls}>{a.label}</a>;
  }

  if (a.hxPost) {
    return (
      <form method="post" action={a.hxPost}
        hx-post={a.hxPost}
        hx-target={a.hxTarget}
        hx-swap={a.hxSwap ?? 'outerHTML'}
        {...(a.hxConfirm ? { 'hx-confirm': a.hxConfirm } : {})}>
        {a.csrf && <input type="hidden" name="_csrf" value={a.csrf} />}
        <button type="submit" class={cls}>{a.label}</button>
      </form>
    );
  }

  if (a.hxGet) {
    return (
      <button type="button" class={cls}
        hx-get={a.hxGet}
        hx-target={a.hxTarget ?? '#app-dialog-content'}
        hx-swap={a.hxSwap ?? 'innerHTML'}>
        {a.label}
      </button>
    );
  }

  return <span class={cls}>{a.label}</span>;
}

/** Render an action as a plain dropdown menu item (no button styling). */
function renderActionLink(a: RowAction) {
  const cls = a.destructive ? 'dropdown-item dropdown-item-danger' : 'dropdown-item';

  if (a.href) {
    return <a href={a.href} class={cls}>{a.label}</a>;
  }

  if (a.hxPost) {
    return (
      <form method="post" action={a.hxPost}
        hx-post={a.hxPost}
        hx-target={a.hxTarget}
        hx-swap={a.hxSwap ?? 'outerHTML'}
        {...(a.hxConfirm ? { 'hx-confirm': a.hxConfirm } : {})}>
        {a.csrf && <input type="hidden" name="_csrf" value={a.csrf} />}
        <input type="submit" class={cls} value={a.label} />
      </form>
    );
  }

  if (a.hxGet) {
    return (
      <a href="#" class={cls}
        hx-get={a.hxGet}
        hx-target={a.hxTarget ?? '#app-dialog-content'}
        hx-swap={a.hxSwap ?? 'innerHTML'}>
        {a.label}
      </a>
    );
  }

  return <span class={cls}>{a.label}</span>;
}
