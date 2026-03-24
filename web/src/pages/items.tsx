import type { Context } from 'hono';
import type { ItemStoreRpc, ItemWithMeta } from '@pignal/db';
import type { WebEnv } from '../types';
import type { FilterDropdown, BulkAction, TableColumn } from '../components/managed-list';
import { AppLayout } from '../components/app-layout';
import { PageHeader } from '../components/page-header';
import { ManagedList, FilterDropdownWidget } from '../components/managed-list';
import type { RowAction } from '../components/feed-item';
import { TableRow, TableCell, TableActions, RowActions } from '../components/feed-item';
import { StatusBadge } from '../components/status-badge';
import { FormDropdown } from '../components/form-dropdown';
import { Pagination } from '../components/pagination';
import { relativeTime } from '../lib/time';
import { getCsrfToken } from '../middleware/csrf';
import { isHtmxRequest, toastTrigger } from '../lib/htmx';

type WebVars = { store: ItemStoreRpc };

function parseParams(c: Context) {
  const q = c.req.query('q') || '';
  const sort = c.req.query('sort') === 'oldest' ? 'oldest' as const : 'newest' as const;
  const typeId = c.req.query('typeId') || '';
  const workspaceId = c.req.query('workspaceId') || '';
  const isArchived = c.req.query('isArchived') === 'true';
  const limit = Math.min(parseInt(c.req.query('limit') ?? '20', 10) || 20, 100);
  const offset = parseInt(c.req.query('offset') ?? '0', 10) || 0;
  return { q, sort, typeId, workspaceId, isArchived, limit, offset };
}

function buildBaseUrl(params: ReturnType<typeof parseParams>): string {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.sort === 'oldest') qs.set('sort', 'oldest');
  if (params.typeId) qs.set('typeId', params.typeId);
  if (params.workspaceId) qs.set('workspaceId', params.workspaceId);
  if (params.isArchived) qs.set('isArchived', 'true');
  const s = qs.toString();
  return '/pignal/items' + (s ? `?${s}` : '');
}

const VISIBILITY_STYLES: Record<string, string> = {
  private: 'text-muted border border-border bg-muted/10',
  unlisted: 'text-warning border border-warning-border bg-warning-bg',
  vouched: 'text-success border border-success-border bg-success-bg',
};

const itemColumns: TableColumn[] = [
  { key: 'title', label: 'Title' },
  { key: 'type', label: 'Type' },
  { key: 'visibility', label: 'Visibility' },
  { key: 'workspace', label: 'Workspace' },
  { key: 'tags', label: 'Tags' },
  { key: 'created', label: 'Created', class: 'text-muted whitespace-nowrap' },
];

function ItemTableRow({ item, csrfToken }: { item: ItemWithMeta; csrfToken: string }) {
  const visibility = item.visibility ?? 'private';
  const isArchived = item.isArchived === 1;
  const isPinned = !!item.pinnedAt;
  const tags = item.tags ?? [];

  return (
    <TableRow id={`item-${item.id}`} bulkValue={item.id}>
      <TableCell>
        <a href={`/pignal/items/${item.id}`} class="font-medium text-text hover:text-primary">{item.keySummary}</a>
      </TableCell>
      <TableCell><StatusBadge status={item.typeName ?? 'default'} /></TableCell>
      <TableCell><StatusBadge status={visibility} styles={VISIBILITY_STYLES} /></TableCell>
      <TableCell class="text-muted">{item.workspaceName ?? '\u2014'}</TableCell>
      <TableCell class="text-muted text-xs">{tags.length > 0 ? tags.join(', ') : '\u2014'}</TableCell>
      <TableCell class="text-muted whitespace-nowrap">{relativeTime(item.createdAt)}</TableCell>
      <TableActions>
        <RowActions actions={[
          { label: 'Edit', hxGet: `/pignal/items/${item.id}/edit-form` },
          visibility === 'vouched'
            ? { label: 'Unvouch', hxPost: `/pignal/items/${item.id}/vouch?visibility=private`, hxTarget: `#item-${item.id}`, csrf: csrfToken }
            : { label: 'Vouch', hxPost: `/pignal/items/${item.id}/vouch?visibility=vouched`, hxTarget: `#item-${item.id}`, csrf: csrfToken },
          isPinned
            ? { label: 'Unpin', hxPost: `/pignal/items/${item.id}/toggle-pin`, hxTarget: `#item-${item.id}`, csrf: csrfToken }
            : { label: 'Pin', hxPost: `/pignal/items/${item.id}/toggle-pin`, hxTarget: `#item-${item.id}`, csrf: csrfToken },
          isArchived
            ? { label: 'Unarchive', hxPost: `/pignal/items/${item.id}/toggle-archive`, hxTarget: `#item-${item.id}`, csrf: csrfToken }
            : { label: 'Archive', hxPost: `/pignal/items/${item.id}/toggle-archive`, hxTarget: `#item-${item.id}`, csrf: csrfToken },
          { label: 'Delete', hxPost: `/pignal/items/${item.id}/delete`, hxTarget: `#item-${item.id}`, hxSwap: 'delete', hxConfirm: 'Delete this item permanently?', destructive: true, csrf: csrfToken },
        ] satisfies RowAction[]} />
      </TableActions>
    </TableRow>
  );
}

function renderTableResults(items: ItemWithMeta[], total: number, params: ReturnType<typeof parseParams>, csrfToken: string) {
  const baseUrl = buildBaseUrl(params);

  return (
    <>
      <tbody id="items-feed" class="managed-table-body">
        {total === 0 ? (
          <tr><td colspan={itemColumns.length + 2} class="managed-table-td text-center py-8 text-muted">No items found.</td></tr>
        ) : (
          items.map((item) => <ItemTableRow item={item} csrfToken={csrfToken} />)
        )}
      </tbody>
      {total > params.limit && (
        <Pagination
          total={total}
          limit={params.limit}
          offset={params.offset}
          baseUrl={baseUrl}
          htmxTarget="#items-results"
          htmxIndicator="#items-loading"
        />
      )}
    </>
  );
}

export async function itemsPage(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const store = c.get('store');
  const params = parseParams(c);
  const csrfToken = getCsrfToken(c);

  c.header('Vary', 'HX-Request');

  // Shared data fetch for both full page and HTMX partial
  const [types, workspacesData, result, counts] = await Promise.all([
    store.listTypes(),
    store.listWorkspaces(),
    store.list({
      q: params.q || undefined,
      typeId: params.typeId || undefined,
      workspaceId: params.workspaceId || undefined,
      isArchived: params.isArchived,
      limit: params.limit,
      offset: params.offset,
      sort: params.sort,
    }),
    store.listCounts({ q: params.q || undefined, isArchived: params.isArchived }),
  ]);

  // Cross-filtered counts: when a workspace is selected, type counts should reflect that workspace
  const typeCounts: Record<string, number> = {};
  if (params.workspaceId) {
    // Use byWorkspaceType to get type counts within the selected workspace
    const wsTypeCounts = counts.byWorkspaceType[params.workspaceId] ?? {};
    for (const t of types) {
      typeCounts[t.id] = wsTypeCounts[t.id] ?? 0;
    }
  } else {
    for (const t of types) {
      typeCounts[t.id] = counts.byType[t.id] ?? 0;
    }
  }

  // Cross-filtered workspace counts: when a type is selected, workspace counts should reflect that type
  const wsCounts: Record<string, number> = {};
  if (params.typeId) {
    for (const ws of workspacesData) {
      wsCounts[ws.id] = counts.byWorkspaceType[ws.id]?.[params.typeId] ?? 0;
    }
  } else {
    for (const ws of workspacesData) {
      wsCounts[ws.id] = counts.byWorkspace[ws.id] ?? 0;
    }
  }

  const filterDropdowns: FilterDropdown[] = [
    {
      label: 'Type',
      name: 'typeId',
      options: [
        { label: 'All', href: buildBaseUrl({ ...params, typeId: '' }), active: !params.typeId },
        ...types.map((t) => ({
          label: `${t.name} (${typeCounts[t.id] ?? 0})`,
          href: buildBaseUrl({ ...params, typeId: t.id }),
          active: params.typeId === t.id,
        })),
      ],
    },
    {
      label: 'Workspace',
      name: 'workspaceId',
      options: [
        { label: 'All', href: buildBaseUrl({ ...params, workspaceId: '' }), active: !params.workspaceId },
        ...workspacesData.map((ws) => ({
          label: `${ws.name} (${wsCounts[ws.id] ?? 0})`,
          href: buildBaseUrl({ ...params, workspaceId: ws.id }),
          active: params.workspaceId === ws.id,
        })),
      ],
    },
    {
      label: 'Status',
      name: 'isArchived',
      options: [
        { label: 'Active', href: buildBaseUrl({ ...params, isArchived: false }), active: !params.isArchived },
        { label: 'Archived', href: buildBaseUrl({ ...params, isArchived: true }), active: params.isArchived },
      ],
    },
  ];

  const pushUrlAttr = { 'hx-push-url': 'true' };

  // HTMX partial: return results + OOB-updated filter dropdowns
  if (isHtmxRequest(c)) {
    return c.html(
      <>
        {renderTableResults(result.items, result.total, params, csrfToken)}
        {/* OOB: update filter dropdowns with cross-filtered counts */}
        {filterDropdowns.map((dd) => (
          <FilterDropdownWidget dd={dd} id="items" resultsId="items-results" loadingId="items-loading" pushUrlAttr={pushUrlAttr} oob />
        ))}
      </>
    );
  }

  const baseUrl = buildBaseUrl(params);

  const sortTabs = [
    { label: 'Newest', value: 'newest', active: params.sort === 'newest', href: buildBaseUrl({ ...params, sort: 'newest' }) },
    { label: 'Oldest', value: 'oldest', active: params.sort === 'oldest', href: buildBaseUrl({ ...params, sort: 'oldest' }) },
  ];

  const bulkActions: BulkAction[] = [
    { label: 'Archive', action: '/pignal/items/bulk/archive', confirm: 'Archive selected items?' },
    { label: 'Unarchive', action: '/pignal/items/bulk/unarchive' },
    { label: 'Vouch', action: '/pignal/items/bulk/vouch' },
    { label: 'Delete', action: '/pignal/items/bulk/delete', confirm: 'Delete selected items permanently?', destructive: true },
  ];

  return c.html(
    <AppLayout title="Items" currentPath="/pignal/items" csrfToken={csrfToken}>
      <PageHeader title="Items" description="Manage all your content" count={result.total} />

      <ManagedList
        id="items"
        searchEndpoint="/pignal/items"
        searchPlaceholder="Search items..."
        query={params.q}
        sortTabs={sortTabs}
        filterDropdowns={filterDropdowns}
        bulkActions={bulkActions}
        csrfToken={csrfToken}
        totalCount={result.total}
        emptyMessage="No items found."
        pagination={{ total: result.total, limit: params.limit, offset: params.offset, baseUrl }}
        pushUrl
        display="table"
        columns={itemColumns}
      >
        {result.items.map((item) => <ItemTableRow item={item} csrfToken={csrfToken} />)}
      </ManagedList>
    </AppLayout>
  );
}

export async function editItemFormHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const store = c.get('store');
  const id = c.req.param('id')!;
  const csrfToken = getCsrfToken(c);

  const [item, types, workspacesData] = await Promise.all([
    store.get(id),
    store.listTypes(),
    store.listWorkspaces(),
  ]);

  if (!item) {
    c.header('HX-Trigger', toastTrigger('Item not found', 'error'));
    return c.body(null, 204);
  }

  const tags = item.tags ? item.tags.join(', ') : '';
  const visibility = item.visibility ?? 'private';

  return c.html(
    <div>
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">Edit Item</h3>
        <button type="button" class="dialog-close" data-close-dialog>&times;</button>
      </div>
      <form
        method="post"
        action={`/pignal/items/${id}/edit`}
        hx-post={`/pignal/items/${id}/edit`}
        hx-target={`#item-${id}`}
        hx-swap="outerHTML"
      >
        <input type="hidden" name="_csrf" value={csrfToken} />
        <label class="mb-3 block">
          Summary
          <input type="text" name="keySummary" value={item.keySummary} required maxlength={500} />
        </label>
        <label class="mb-3 block">
          Content
          <textarea name="content" rows={6}>{item.content}</textarea>
        </label>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
          <label>
            Type
            <FormDropdown
              name="typeId"
              value={item.typeId}
              options={types.map((t) => ({ value: t.id, label: t.name }))}
            />
          </label>
          <label>
            Workspace
            <FormDropdown
              name="workspaceId"
              value={item.workspaceId ?? ''}
              options={workspacesData.map((ws) => ({ value: ws.id, label: ws.name }))}
              placeholder="None"
            />
          </label>
        </div>
        <label class="mb-3 block">
          Tags (comma-separated)
          <input type="text" name="tags" value={tags} placeholder="react, hooks, typescript" />
        </label>
        <label class="mb-3 block">
          Visibility
          <FormDropdown
            name="visibility"
            value={visibility}
            options={[
              { value: 'private', label: 'Private' },
              { value: 'unlisted', label: 'Unlisted' },
              { value: 'vouched', label: 'Vouched (public)' },
            ]}
          />
        </label>
        <button type="submit" class="btn mt-4 w-full">Save Changes</button>
      </form>
    </div>
  );
}

export async function editItemHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const store = c.get('store');
  const id = c.req.param('id')!;
  const csrfToken = getCsrfToken(c);
  const body = await c.req.parseBody();

  const keySummary = (body.keySummary as string || '').trim();
  const content = (body.content as string || '').trim();
  const typeId = (body.typeId as string || '').trim();
  const workspaceId = (body.workspaceId as string || '').trim() || null;
  const tagsStr = (body.tags as string || '').trim();
  const visibility = body.visibility as string || 'private';

  const tags = tagsStr ? tagsStr.split(',').map((t) => t.trim()).filter(Boolean) : null;

  try {
    const updated = await store.update(id, {
      keySummary: keySummary || undefined,
      content: content || undefined,
      typeId: typeId || undefined,
      workspaceId,
      tags,
    });

    if (!updated) {
      c.header('HX-Trigger', toastTrigger('Item not found', 'error'));
      c.header('HX-Reswap', 'none');
      return c.body(null, 204);
    }

    // Handle visibility change separately via vouch
    const currentVisibility = updated.visibility ?? 'private';
    if (visibility !== currentVisibility) {
      await store.vouch(id, { visibility: visibility as 'private' | 'unlisted' | 'vouched' });
    }

    const finalItem = await store.get(id);
    if (!finalItem) {
      c.header('HX-Trigger', toastTrigger('Item not found after update', 'error'));
      c.header('HX-Reswap', 'none');
      return c.body(null, 204);
    }

    c.header('HX-Trigger', JSON.stringify({
      closeDialog: true,
      showToast: { message: 'Item updated', type: 'success' },
    }));
    return c.html(<ItemTableRow item={finalItem} csrfToken={csrfToken} />);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update item';
    c.header('HX-Trigger', toastTrigger(msg, 'error'));
    c.header('HX-Reswap', 'none');
    return c.body(null, 204);
  }
}

export async function deleteItemHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const store = c.get('store');
  const id = c.req.param('id')!;

  try {
    const deleted = await store.delete(id);
    if (!deleted) {
      c.header('HX-Trigger', toastTrigger('Item not found', 'error'));
      c.header('HX-Reswap', 'none');
      return c.body(null, 204);
    }
    c.header('HX-Trigger', toastTrigger('Item deleted'));
    return c.html('');
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to delete item';
    c.header('HX-Trigger', toastTrigger(msg, 'error'));
    c.header('HX-Reswap', 'none');
    return c.body(null, 204);
  }
}

export async function toggleArchiveHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const store = c.get('store');
  const id = c.req.param('id')!;
  const csrfToken = getCsrfToken(c);

  try {
    const existing = await store.get(id);
    if (!existing) {
      c.header('HX-Trigger', toastTrigger('Item not found', 'error'));
      c.header('HX-Reswap', 'none');
      return c.body(null, 204);
    }

    const isArchived = existing.isArchived === 1;
    const updated = isArchived ? await store.unarchive(id) : await store.archive(id);

    if (!updated) {
      c.header('HX-Trigger', toastTrigger('Failed to update item', 'error'));
      c.header('HX-Reswap', 'none');
      return c.body(null, 204);
    }

    c.header('HX-Trigger', toastTrigger(isArchived ? 'Item unarchived' : 'Item archived'));
    return c.html(<ItemTableRow item={updated} csrfToken={csrfToken} />);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update item';
    c.header('HX-Trigger', toastTrigger(msg, 'error'));
    c.header('HX-Reswap', 'none');
    return c.body(null, 204);
  }
}

export async function togglePinHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const store = c.get('store');
  const id = c.req.param('id')!;
  const csrfToken = getCsrfToken(c);

  try {
    const existing = await store.get(id);
    if (!existing) {
      c.header('HX-Trigger', toastTrigger('Item not found', 'error'));
      c.header('HX-Reswap', 'none');
      return c.body(null, 204);
    }

    const isPinned = !!existing.pinnedAt;
    const updated = isPinned ? await store.unpin(id) : await store.pin(id);

    if (!updated) {
      c.header('HX-Trigger', toastTrigger('Failed to update item', 'error'));
      c.header('HX-Reswap', 'none');
      return c.body(null, 204);
    }

    c.header('HX-Trigger', toastTrigger(isPinned ? 'Item unpinned' : 'Item pinned'));
    return c.html(<ItemTableRow item={updated} csrfToken={csrfToken} />);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update item';
    c.header('HX-Trigger', toastTrigger(msg, 'error'));
    c.header('HX-Reswap', 'none');
    return c.body(null, 204);
  }
}

export async function vouchItemHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const store = c.get('store');
  const id = c.req.param('id')!;
  const csrfToken = getCsrfToken(c);
  const body = await c.req.parseBody();
  const visibility = (body.visibility as string || c.req.query('visibility') || 'vouched') as 'private' | 'unlisted' | 'vouched';

  try {
    const updated = await store.vouch(id, { visibility });
    if (!updated) {
      c.header('HX-Trigger', toastTrigger('Item not found', 'error'));
      c.header('HX-Reswap', 'none');
      return c.body(null, 204);
    }

    const label = visibility === 'vouched' ? 'Item vouched' : visibility === 'unlisted' ? 'Item set to unlisted' : 'Item set to private';
    c.header('HX-Trigger', toastTrigger(label));
    return c.html(<ItemTableRow item={updated} csrfToken={csrfToken} />);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update visibility';
    c.header('HX-Trigger', toastTrigger(msg, 'error'));
    c.header('HX-Reswap', 'none');
    return c.body(null, 204);
  }
}

export async function bulkArchiveItemsHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const store = c.get('store');
  const csrfToken = getCsrfToken(c);
  const body = await c.req.parseBody();
  const ids = Array.isArray(body['ids[]']) ? body['ids[]'] as string[] : [body['ids[]'] as string].filter(Boolean);

  let archived = 0;
  for (const id of ids) {
    const result = await store.archive(id);
    if (result) archived++;
  }

  c.header('HX-Trigger', toastTrigger(`${archived} item(s) archived`));

  // Re-fetch and render updated list
  const params = parseParams(c);
  const result = await store.list({
    q: params.q || undefined,
    typeId: params.typeId || undefined,
    workspaceId: params.workspaceId || undefined,
    isArchived: params.isArchived,
    limit: params.limit,
    offset: params.offset,
    sort: params.sort,
  });
  return c.html(renderTableResults(result.items, result.total, params, csrfToken));
}

export async function bulkUnarchiveItemsHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const store = c.get('store');
  const csrfToken = getCsrfToken(c);
  const body = await c.req.parseBody();
  const ids = Array.isArray(body['ids[]']) ? body['ids[]'] as string[] : [body['ids[]'] as string].filter(Boolean);

  let unarchived = 0;
  for (const id of ids) {
    const result = await store.unarchive(id);
    if (result) unarchived++;
  }

  c.header('HX-Trigger', toastTrigger(`${unarchived} item(s) unarchived`));

  const params = parseParams(c);
  const result = await store.list({
    q: params.q || undefined,
    typeId: params.typeId || undefined,
    workspaceId: params.workspaceId || undefined,
    isArchived: params.isArchived,
    limit: params.limit,
    offset: params.offset,
    sort: params.sort,
  });
  return c.html(renderTableResults(result.items, result.total, params, csrfToken));
}

export async function bulkVouchItemsHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const store = c.get('store');
  const csrfToken = getCsrfToken(c);
  const body = await c.req.parseBody();
  const ids = Array.isArray(body['ids[]']) ? body['ids[]'] as string[] : [body['ids[]'] as string].filter(Boolean);

  let vouched = 0;
  for (const id of ids) {
    const result = await store.vouch(id, { visibility: 'vouched' });
    if (result) vouched++;
  }

  c.header('HX-Trigger', toastTrigger(`${vouched} item(s) vouched`));

  const params = parseParams(c);
  const result = await store.list({
    q: params.q || undefined,
    typeId: params.typeId || undefined,
    workspaceId: params.workspaceId || undefined,
    isArchived: params.isArchived,
    limit: params.limit,
    offset: params.offset,
    sort: params.sort,
  });
  return c.html(renderTableResults(result.items, result.total, params, csrfToken));
}

export async function bulkDeleteItemsHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const store = c.get('store');
  const csrfToken = getCsrfToken(c);
  const body = await c.req.parseBody();
  const ids = Array.isArray(body['ids[]']) ? body['ids[]'] as string[] : [body['ids[]'] as string].filter(Boolean);

  let deleted = 0;
  for (const id of ids) {
    const result = await store.delete(id);
    if (result) deleted++;
  }

  c.header('HX-Trigger', toastTrigger(`${deleted} item(s) deleted`));

  const params = parseParams(c);
  const result = await store.list({
    q: params.q || undefined,
    typeId: params.typeId || undefined,
    workspaceId: params.workspaceId || undefined,
    isArchived: params.isArchived,
    limit: params.limit,
    offset: params.offset,
    sort: params.sort,
  });
  return c.html(renderTableResults(result.items, result.total, params, csrfToken));
}
