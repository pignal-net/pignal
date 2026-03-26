import type { Context } from 'hono';
import type { ItemWithMeta } from '@pignal/db';
import type { WebEnv, WebVars } from '../types';
import type { TFunction } from '@pignal/render/i18n/types';
import type { FilterDropdown, BulkAction, TableColumn } from '../components/managed-list';
import { AppLayout } from '../components/app-layout';
import { PageHeader } from '../components/page-header';
import { ManagedList, FilterDropdownWidget, TableResultsWrapper } from '../components/managed-list';
import type { RowAction } from '../components/feed-item';
import { TableRow, TableCell, TableActions, RowActions } from '../components/feed-item';
import { StatusBadge } from '../components/status-badge';
import { FormDropdown } from '../components/form-dropdown';
import { Pagination } from '@pignal/render/components/pagination';
import { relativeTime } from '@pignal/render/lib/time';
import { getCsrfToken } from '../middleware/csrf';
import { isHtmxRequest, toastTrigger } from '../lib/htmx';

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

function itemColumns(t: TFunction): TableColumn[] {
  return [
    { key: 'title', label: t('items.column.title') },
    { key: 'type', label: t('items.column.type') },
    { key: 'visibility', label: t('items.column.visibility') },
    { key: 'workspace', label: t('items.column.workspace') },
    { key: 'tags', label: t('items.column.tags') },
    { key: 'created', label: t('items.column.created'), class: 'text-muted whitespace-nowrap' },
  ];
}

function ItemTableRow({ item, csrfToken, t }: { item: ItemWithMeta; csrfToken: string; t: TFunction }) {
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
          { label: t('items.action.edit'), hxGet: `/pignal/items/${item.id}/edit-form` },
          visibility === 'vouched'
            ? { label: t('items.action.unvouch'), hxPost: `/pignal/items/${item.id}/vouch?visibility=private`, hxTarget: `#item-${item.id}`, csrf: csrfToken }
            : { label: t('items.action.vouch'), hxPost: `/pignal/items/${item.id}/vouch?visibility=vouched`, hxTarget: `#item-${item.id}`, csrf: csrfToken },
          isPinned
            ? { label: t('items.action.unpin'), hxPost: `/pignal/items/${item.id}/toggle-pin`, hxTarget: `#item-${item.id}`, csrf: csrfToken }
            : { label: t('items.action.pin'), hxPost: `/pignal/items/${item.id}/toggle-pin`, hxTarget: `#item-${item.id}`, csrf: csrfToken },
          isArchived
            ? { label: t('items.action.unarchive'), hxPost: `/pignal/items/${item.id}/toggle-archive`, hxTarget: `#item-${item.id}`, csrf: csrfToken }
            : { label: t('items.action.archive'), hxPost: `/pignal/items/${item.id}/toggle-archive`, hxTarget: `#item-${item.id}`, csrf: csrfToken },
          { label: t('items.action.delete'), hxPost: `/pignal/items/${item.id}/delete`, hxTarget: `#item-${item.id}`, hxSwap: 'delete', hxConfirm: t('items.confirmDelete'), destructive: true, csrf: csrfToken },
        ] satisfies RowAction[]} />
      </TableActions>
    </TableRow>
  );
}

function renderTableResults(items: ItemWithMeta[], total: number, params: ReturnType<typeof parseParams>, csrfToken: string, t: TFunction) {
  const baseUrl = buildBaseUrl(params);
  const cols = itemColumns(t);

  return (
    <>
      <TableResultsWrapper id="items" columns={cols} hasBulk>
        <tbody id="items-feed" class="managed-table-body">
          {total === 0 ? (
            <tr><td colspan={cols.length + 2} class="managed-table-td text-center py-8 text-muted">{t('items.empty')}</td></tr>
          ) : (
            items.map((item) => <ItemTableRow item={item} csrfToken={csrfToken} t={t} />)
          )}
        </tbody>
      </TableResultsWrapper>
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
  const t = c.get('t');
  const locale = c.get('locale');
  const defaultLocale = c.get('defaultLocale');

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
      label: t('items.filter.type'),
      name: 'typeId',
      options: [
        { label: t('common.all'), href: buildBaseUrl({ ...params, typeId: '' }), active: !params.typeId },
        ...types.map((tp) => ({
          label: `${tp.name} (${typeCounts[tp.id] ?? 0})`,
          href: buildBaseUrl({ ...params, typeId: tp.id }),
          active: params.typeId === tp.id,
        })),
      ],
    },
    {
      label: t('items.filter.workspace'),
      name: 'workspaceId',
      options: [
        { label: t('common.all'), href: buildBaseUrl({ ...params, workspaceId: '' }), active: !params.workspaceId },
        ...workspacesData.map((ws) => ({
          label: `${ws.name} (${wsCounts[ws.id] ?? 0})`,
          href: buildBaseUrl({ ...params, workspaceId: ws.id }),
          active: params.workspaceId === ws.id,
        })),
      ],
    },
    {
      label: t('items.filter.status'),
      name: 'isArchived',
      options: [
        { label: t('common.active'), href: buildBaseUrl({ ...params, isArchived: false }), active: !params.isArchived },
        { label: t('common.archived'), href: buildBaseUrl({ ...params, isArchived: true }), active: params.isArchived },
      ],
    },
  ];

  const pushUrlAttr = { 'hx-push-url': 'true' };

  // HTMX partial: return results + OOB-updated filter dropdowns
  if (isHtmxRequest(c)) {
    return c.html(
      <>
        {renderTableResults(result.items, result.total, params, csrfToken, t)}
        {/* OOB: update filter dropdowns with cross-filtered counts */}
        {filterDropdowns.map((dd) => (
          <FilterDropdownWidget dd={dd} id="items" resultsId="items-results" loadingId="items-loading" pushUrlAttr={pushUrlAttr} oob />
        ))}
      </>
    );
  }

  const baseUrl = buildBaseUrl(params);

  const sortTabs = [
    { label: t('common.newest'), value: 'newest', active: params.sort === 'newest', href: buildBaseUrl({ ...params, sort: 'newest' }) },
    { label: t('common.oldest'), value: 'oldest', active: params.sort === 'oldest', href: buildBaseUrl({ ...params, sort: 'oldest' }) },
  ];

  const bulkActions: BulkAction[] = [
    { label: t('items.bulk.archive'), action: '/pignal/items/bulk/archive', confirm: t('items.bulk.confirmArchive') },
    { label: t('items.bulk.unarchive'), action: '/pignal/items/bulk/unarchive' },
    { label: t('items.bulk.vouch'), action: '/pignal/items/bulk/vouch' },
    { label: t('items.bulk.delete'), action: '/pignal/items/bulk/delete', confirm: t('items.bulk.confirmDelete'), destructive: true },
  ];

  return c.html(
    <AppLayout title={t('items.title')} currentPath="/pignal/items" csrfToken={csrfToken} t={t} locale={locale} defaultLocale={defaultLocale}>
      <PageHeader title={t('items.title')} description={t('items.description')} count={result.total} />

      <ManagedList
        id="items"
        searchEndpoint="/pignal/items"
        searchPlaceholder={t('items.searchPlaceholder')}
        query={params.q}
        sortTabs={sortTabs}
        filterDropdowns={filterDropdowns}
        bulkActions={bulkActions}
        csrfToken={csrfToken}
        totalCount={result.total}
        emptyMessage={t('items.empty')}
        pagination={{ total: result.total, limit: params.limit, offset: params.offset, baseUrl }}
        pushUrl
        display="table"
        columns={itemColumns(t)}
      >
        {result.items.map((item) => <ItemTableRow item={item} csrfToken={csrfToken} t={t} />)}
      </ManagedList>
    </AppLayout>
  );
}

export async function editItemFormHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const store = c.get('store');
  const id = c.req.param('id')!;
  const csrfToken = getCsrfToken(c);
  const t = c.get('t');

  const [item, types, workspacesData] = await Promise.all([
    store.get(id),
    store.listTypes(),
    store.listWorkspaces(),
  ]);

  if (!item) {
    c.header('HX-Trigger', toastTrigger(t('items.toast.notFound'), 'error'));
    return c.body(null, 204);
  }

  const tags = item.tags ? item.tags.join(', ') : '';
  const visibility = item.visibility ?? 'private';

  return c.html(
    <div>
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">{t('items.edit.title')}</h3>
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
          {t('items.edit.summary')}
          <input type="text" name="keySummary" value={item.keySummary} required maxlength={500} />
        </label>
        <label class="mb-3 block">
          {t('items.edit.content')}
          <textarea name="content" rows={6}>{item.content}</textarea>
        </label>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
          <label>
            {t('items.edit.type')}
            <FormDropdown
              name="typeId"
              value={item.typeId}
              options={types.map((tp) => ({ value: tp.id, label: tp.name }))}
            />
          </label>
          <label>
            {t('items.edit.workspace')}
            <FormDropdown
              name="workspaceId"
              value={item.workspaceId ?? ''}
              options={workspacesData.map((ws) => ({ value: ws.id, label: ws.name }))}
              placeholder={t('items.edit.workspacePlaceholder')}
            />
          </label>
        </div>
        <label class="mb-3 block">
          {t('items.edit.tags')}
          <input type="text" name="tags" value={tags} placeholder={t('items.edit.tagsPlaceholder')} />
        </label>
        <label class="mb-3 block">
          {t('items.edit.visibility')}
          <FormDropdown
            name="visibility"
            value={visibility}
            options={[
              { value: 'private', label: t('items.edit.visibilityPrivate') },
              { value: 'unlisted', label: t('items.edit.visibilityUnlisted') },
              { value: 'vouched', label: t('items.edit.visibilityVouched') },
            ]}
          />
        </label>
        <button type="submit" class="btn mt-4 w-full">{t('items.edit.saveChanges')}</button>
      </form>
    </div>
  );
}

export async function editItemHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const store = c.get('store');
  const id = c.req.param('id')!;
  const csrfToken = getCsrfToken(c);
  const t = c.get('t');
  const body = await c.req.parseBody();

  const keySummary = (body.keySummary as string || '').trim();
  const content = (body.content as string || '').trim();
  const typeId = (body.typeId as string || '').trim();
  const workspaceId = (body.workspaceId as string || '').trim() || null;
  const tagsStr = (body.tags as string || '').trim();
  const visibility = body.visibility as string || 'private';

  const tags = tagsStr ? tagsStr.split(',').map((tg) => tg.trim()).filter(Boolean) : null;

  try {
    const updated = await store.update(id, {
      keySummary: keySummary || undefined,
      content: content || undefined,
      typeId: typeId || undefined,
      workspaceId,
      tags,
    });

    if (!updated) {
      c.header('HX-Trigger', toastTrigger(t('items.toast.notFound'), 'error'));
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
      c.header('HX-Trigger', toastTrigger(t('items.toast.notFound'), 'error'));
      c.header('HX-Reswap', 'none');
      return c.body(null, 204);
    }

    c.header('HX-Trigger', JSON.stringify({
      closeDialog: true,
      showToast: { message: t('items.toast.updated'), type: 'success' },
    }));
    return c.html(<ItemTableRow item={finalItem} csrfToken={csrfToken} t={t} />);
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
  const t = c.get('t');

  try {
    const deleted = await store.delete(id);
    if (!deleted) {
      c.header('HX-Trigger', toastTrigger(t('items.toast.notFound'), 'error'));
      c.header('HX-Reswap', 'none');
      return c.body(null, 204);
    }
    c.header('HX-Trigger', toastTrigger(t('items.toast.deleted')));
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
  const t = c.get('t');

  try {
    const existing = await store.get(id);
    if (!existing) {
      c.header('HX-Trigger', toastTrigger(t('items.toast.notFound'), 'error'));
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

    c.header('HX-Trigger', toastTrigger(isArchived ? t('items.toast.unarchived') : t('items.toast.archived')));
    return c.html(<ItemTableRow item={updated} csrfToken={csrfToken} t={t} />);
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
  const t = c.get('t');

  try {
    const existing = await store.get(id);
    if (!existing) {
      c.header('HX-Trigger', toastTrigger(t('items.toast.notFound'), 'error'));
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

    c.header('HX-Trigger', toastTrigger(isPinned ? t('items.toast.unpinned') : t('items.toast.pinned')));
    return c.html(<ItemTableRow item={updated} csrfToken={csrfToken} t={t} />);
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
  const t = c.get('t');
  const body = await c.req.parseBody();
  const visibility = (body.visibility as string || c.req.query('visibility') || 'vouched') as 'private' | 'unlisted' | 'vouched';

  try {
    const updated = await store.vouch(id, { visibility });
    if (!updated) {
      c.header('HX-Trigger', toastTrigger(t('items.toast.notFound'), 'error'));
      c.header('HX-Reswap', 'none');
      return c.body(null, 204);
    }

    const label = visibility === 'vouched' ? t('items.toast.vouched') : visibility === 'unlisted' ? t('items.toast.unlisted') : t('items.toast.private');
    c.header('HX-Trigger', toastTrigger(label));
    return c.html(<ItemTableRow item={updated} csrfToken={csrfToken} t={t} />);
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
  const t = c.get('t');
  const body = await c.req.parseBody();
  const ids = Array.isArray(body['ids[]']) ? body['ids[]'] as string[] : [body['ids[]'] as string].filter(Boolean);

  let archived = 0;
  for (const id of ids) {
    const result = await store.archive(id);
    if (result) archived++;
  }

  c.header('HX-Trigger', toastTrigger(t('items.bulk.archivedToast', { count: String(archived) })));

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
  return c.html(renderTableResults(result.items, result.total, params, csrfToken, t));
}

export async function bulkUnarchiveItemsHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const store = c.get('store');
  const csrfToken = getCsrfToken(c);
  const t = c.get('t');
  const body = await c.req.parseBody();
  const ids = Array.isArray(body['ids[]']) ? body['ids[]'] as string[] : [body['ids[]'] as string].filter(Boolean);

  let unarchived = 0;
  for (const id of ids) {
    const result = await store.unarchive(id);
    if (result) unarchived++;
  }

  c.header('HX-Trigger', toastTrigger(t('items.bulk.unarchivedToast', { count: String(unarchived) })));

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
  return c.html(renderTableResults(result.items, result.total, params, csrfToken, t));
}

export async function bulkVouchItemsHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const store = c.get('store');
  const csrfToken = getCsrfToken(c);
  const t = c.get('t');
  const body = await c.req.parseBody();
  const ids = Array.isArray(body['ids[]']) ? body['ids[]'] as string[] : [body['ids[]'] as string].filter(Boolean);

  let vouched = 0;
  for (const id of ids) {
    const result = await store.vouch(id, { visibility: 'vouched' });
    if (result) vouched++;
  }

  c.header('HX-Trigger', toastTrigger(t('items.bulk.vouchedToast', { count: String(vouched) })));

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
  return c.html(renderTableResults(result.items, result.total, params, csrfToken, t));
}

export async function bulkDeleteItemsHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const store = c.get('store');
  const csrfToken = getCsrfToken(c);
  const t = c.get('t');
  const body = await c.req.parseBody();
  const ids = Array.isArray(body['ids[]']) ? body['ids[]'] as string[] : [body['ids[]'] as string].filter(Boolean);

  let deleted = 0;
  for (const id of ids) {
    const result = await store.delete(id);
    if (result) deleted++;
  }

  c.header('HX-Trigger', toastTrigger(t('items.bulk.deletedToast', { count: String(deleted) })));

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
  return c.html(renderTableResults(result.items, result.total, params, csrfToken, t));
}
