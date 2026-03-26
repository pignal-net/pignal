import type { Context } from 'hono';
import type { WorkspaceSelect } from '@pignal/db';
import type { WebEnv, WebVars } from '../types';
import type { TFunction } from '@pignal/render/i18n/types';
import type { BulkAction, TableColumn } from '../components/managed-list';
import { AppLayout } from '../components/app-layout';
import { PageHeader } from '../components/page-header';
import { ManagedList, TableResultsWrapper } from '../components/managed-list';
import type { RowAction } from '../components/feed-item';
import { TableRow, TableCell, TableActions, RowActions } from '../components/feed-item';
import { StatusBadge } from '../components/status-badge';
import { FormDropdown } from '../components/form-dropdown';
import { Pagination } from '@pignal/render/components/pagination';
import { relativeTime } from '@pignal/render/lib/time';
import { getCsrfToken } from '../middleware/csrf';
import { isHtmxRequest, toastTrigger } from '../lib/htmx';

const VISIBILITY_STYLES: Record<string, string> = {
  public: 'text-success border border-success-border bg-success-bg',
  private: 'text-muted border border-border bg-muted/10',
};

function parseParams(c: Context) {
  const q = c.req.query('q') || '';
  const sort = c.req.query('sort') === 'oldest' ? 'oldest' as const : 'newest' as const;
  const limit = Math.min(parseInt(c.req.query('limit') ?? '20', 10) || 20, 100);
  const offset = parseInt(c.req.query('offset') ?? '0', 10) || 0;
  return { q, sort, limit, offset };
}

function buildBaseUrl(params: ReturnType<typeof parseParams>): string {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.sort === 'oldest') qs.set('sort', 'oldest');
  const s = qs.toString();
  return '/pignal/workspaces' + (s ? `?${s}` : '');
}

function sortWorkspaces(list: WorkspaceSelect[], sort: string): WorkspaceSelect[] {
  return [...list].sort((a, b) => {
    if (sort === 'oldest') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function filterWorkspaces(list: WorkspaceSelect[], q: string): WorkspaceSelect[] {
  if (!q) return list;
  const lower = q.toLowerCase();
  return list.filter((ws) =>
    ws.name.toLowerCase().includes(lower) ||
    (ws.description && ws.description.toLowerCase().includes(lower))
  );
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max) + '...';
}

function workspaceColumns(t: TFunction): TableColumn[] {
  return [
    { key: 'name', label: t('workspaces.column.name') },
    { key: 'visibility', label: t('workspaces.column.visibility') },
    { key: 'description', label: t('workspaces.column.description') },
    { key: 'default', label: t('workspaces.column.default') },
    { key: 'created', label: t('workspaces.column.created'), class: 'text-muted whitespace-nowrap' },
  ];
}

function WorkspaceTableRow({ workspace, csrfToken, t }: { workspace: WorkspaceSelect; csrfToken: string; t: TFunction }) {
  const isDefault = workspace.isDefault === 1;
  const description = workspace.description ? truncate(workspace.description, 80) : null;

  return (
    <TableRow id={`ws-${workspace.id}`} bulkValue={isDefault ? undefined : workspace.id}>
      <TableCell>
        <span class="font-medium text-text">{workspace.name}</span>
      </TableCell>
      <TableCell><StatusBadge status={workspace.visibility} styles={VISIBILITY_STYLES} /></TableCell>
      <TableCell class="text-muted">{description ?? '\u2014'}</TableCell>
      <TableCell>{isDefault ? <span class="text-xs text-muted">{t('workspaces.defaultYes')}</span> : '\u2014'}</TableCell>
      <TableCell class="text-muted whitespace-nowrap">{relativeTime(workspace.createdAt)}</TableCell>
      <TableActions>
        <RowActions actions={[
          { label: t('workspaces.action.edit'), hxGet: `/pignal/workspaces/${workspace.id}/edit-form` },
          ...(!isDefault ? [
            {
              label: workspace.visibility === 'public' ? t('workspaces.action.makePrivate') : t('workspaces.action.makePublic'),
              hxPost: `/pignal/workspaces/${workspace.id}/toggle-visibility`,
              hxTarget: `#ws-${workspace.id}`,
              csrf: csrfToken,
            },
            {
              label: t('workspaces.action.delete'),
              hxPost: `/pignal/workspaces/${workspace.id}/delete`,
              hxTarget: `#ws-${workspace.id}`,
              hxSwap: 'delete',
              hxConfirm: t('workspaces.confirmDelete'),
              destructive: true,
              csrf: csrfToken,
            },
          ] satisfies RowAction[] : []),
        ]} />
      </TableActions>
    </TableRow>
  );
}

function renderTableResults(list: WorkspaceSelect[], total: number, params: ReturnType<typeof parseParams>, csrfToken: string, t: TFunction) {
  const baseUrl = buildBaseUrl(params);
  const cols = workspaceColumns(t);

  return (
    <>
      <TableResultsWrapper id="workspaces" columns={cols} hasBulk>
        <tbody id="workspaces-feed" class="managed-table-body">
          {total === 0 ? (
            <tr><td colspan={cols.length + 2} class="managed-table-td text-center py-8 text-muted">{t('workspaces.empty')}</td></tr>
          ) : (
            list.map((ws) => <WorkspaceTableRow workspace={ws} csrfToken={csrfToken} t={t} />)
          )}
        </tbody>
      </TableResultsWrapper>
      {total > params.limit && (
        <Pagination
          total={total}
          limit={params.limit}
          offset={params.offset}
          baseUrl={baseUrl}
          htmxTarget="#workspaces-results"
          htmxIndicator="#workspaces-loading"
        />
      )}
    </>
  );
}

export async function workspacesPage(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const store = c.get('store');
  const csrfToken = getCsrfToken(c);
  const t = c.get('t');
  const locale = c.get('locale');
  const defaultLocale = c.get('defaultLocale');
  const params = parseParams(c);

  c.header('Vary', 'HX-Request');

  const allWorkspaces = await store.listWorkspaces();
  const filtered = filterWorkspaces(allWorkspaces, params.q);
  const sorted = sortWorkspaces(filtered, params.sort);
  const total = sorted.length;
  const paged = sorted.slice(params.offset, params.offset + params.limit);

  if (isHtmxRequest(c)) {
    return c.html(renderTableResults(paged, total, params, csrfToken, t));
  }

  const sortTabs = [
    { label: t('common.newest'), value: 'newest', active: params.sort === 'newest', href: buildBaseUrl({ ...params, sort: 'newest' }) },
    { label: t('common.oldest'), value: 'oldest', active: params.sort === 'oldest', href: buildBaseUrl({ ...params, sort: 'oldest' }) },
  ];

  const bulkActions: BulkAction[] = [
    { label: t('workspaces.bulk.delete'), action: '/pignal/workspaces/bulk/delete', confirm: t('workspaces.bulk.confirmDelete'), destructive: true },
  ];

  return c.html(
    <AppLayout title={t('workspaces.title')} currentPath="/pignal/workspaces" csrfToken={csrfToken} t={t} locale={locale} defaultLocale={defaultLocale} visitor={c.get("visitor")}>
      <PageHeader title={t('workspaces.title')} description={t('workspaces.description')} count={total} />

      <ManagedList
        id="workspaces"
        searchEndpoint="/pignal/workspaces"
        searchPlaceholder={t('workspaces.searchPlaceholder')}
        query={params.q}
        sortTabs={sortTabs}
        bulkActions={bulkActions}
        csrfToken={csrfToken}
        totalCount={total}
        emptyMessage={t('workspaces.emptyMessage')}
        pagination={{ total, limit: params.limit, offset: params.offset, baseUrl: buildBaseUrl(params) }}
        pushUrl
        display="table"
        columns={workspaceColumns(t)}
        addButton={
          <button
            class="outline btn-sm"
            hx-get="/pignal/workspaces/add-form"
            hx-target="#app-dialog-content"
          >
            {t('common.add')}
          </button>
        }
      >
        {paged.map((ws) => <WorkspaceTableRow workspace={ws} csrfToken={csrfToken} t={t} />)}
      </ManagedList>
    </AppLayout>
  );
}

export async function addWorkspaceFormHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const csrfToken = getCsrfToken(c);
  const t = c.get('t');

  return c.html(
    <div>
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">{t('workspaces.create.title')}</h3>
        <button type="button" class="dialog-close" data-close-dialog>&times;</button>
      </div>
      <form
        method="post"
        action="/pignal/workspaces"
        hx-post="/pignal/workspaces"
        hx-target="#workspaces-feed"
        hx-swap="afterbegin"
      >
        <input type="hidden" name="_csrf" value={csrfToken} />
        <label class="mb-3 block">
          {t('workspaces.create.name')}
          <input type="text" name="name" required maxlength={100} placeholder={t('workspaces.create.namePlaceholder')} />
        </label>
        <label class="mb-3 block">
          {t('workspaces.create.description')}
          <textarea name="description" rows={3} maxlength={500} placeholder={t('workspaces.create.descriptionPlaceholder')} />
        </label>
        <label class="mb-3 block">
          {t('workspaces.create.visibility')}
          <FormDropdown
            name="visibility"
            value="private"
            options={[
              { value: 'private', label: t('workspaces.visibility.private') },
              { value: 'public', label: t('workspaces.visibility.public') },
            ]}
          />
        </label>
        <button type="submit" class="btn mt-4 w-full">{t('workspaces.create.button')}</button>
      </form>
    </div>
  );
}

export async function createWorkspaceHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const store = c.get('store');
  const csrfToken = getCsrfToken(c);
  const t = c.get('t');
  const body = await c.req.parseBody();

  const name = (body.name as string || '').trim();
  const description = (body.description as string || '').trim();
  const visibility = (body.visibility as string || 'private') === 'public' ? 'public' as const : 'private' as const;

  if (!name) {
    c.header('HX-Trigger', toastTrigger(t('workspaces.error.nameRequired'), 'error'));
    c.header('HX-Reswap', 'none');
    return c.body(null, 204);
  }

  try {
    const created = await store.createWorkspace({
      id: crypto.randomUUID(),
      name,
      description: description || undefined,
      visibility,
    });

    c.header('HX-Trigger', JSON.stringify({
      closeDialog: true,
      showToast: { message: t('workspaces.toast.created'), type: 'success' },
    }));
    return c.html(<WorkspaceTableRow workspace={created} csrfToken={csrfToken} t={t} />);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create workspace';
    c.header('HX-Trigger', toastTrigger(msg, 'error'));
    c.header('HX-Reswap', 'none');
    return c.body(null, 204);
  }
}

export async function editWorkspaceFormHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const store = c.get('store');
  const id = c.req.param('id')!;
  const csrfToken = getCsrfToken(c);
  const t = c.get('t');

  const workspace = await store.getWorkspace(id);
  if (!workspace) {
    c.header('HX-Trigger', toastTrigger(t('workspaces.toast.notFound'), 'error'));
    return c.body(null, 204);
  }

  return c.html(
    <div>
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">{t('workspaces.edit.title')}</h3>
        <button type="button" class="dialog-close" data-close-dialog>&times;</button>
      </div>
      <form
        method="post"
        action={`/pignal/workspaces/${id}/edit`}
        hx-post={`/pignal/workspaces/${id}/edit`}
        hx-target={`#ws-${id}`}
        hx-swap="outerHTML"
      >
        <input type="hidden" name="_csrf" value={csrfToken} />
        <label class="mb-3 block">
          {t('workspaces.create.name')}
          <input type="text" name="name" value={workspace.name} required maxlength={100} />
        </label>
        <label class="mb-3 block">
          {t('workspaces.create.description')}
          <textarea name="description" rows={3} maxlength={500}>{workspace.description ?? ''}</textarea>
        </label>
        <label class="mb-3 block">
          {t('workspaces.create.visibility')}
          <FormDropdown
            name="visibility"
            value={workspace.visibility}
            options={[
              { value: 'private', label: t('workspaces.visibility.private') },
              { value: 'public', label: t('workspaces.visibility.public') },
            ]}
          />
        </label>
        <button type="submit" class="btn mt-4 w-full">{t('workspaces.edit.saveChanges')}</button>
      </form>
    </div>
  );
}

export async function editWorkspaceHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const store = c.get('store');
  const id = c.req.param('id')!;
  const csrfToken = getCsrfToken(c);
  const t = c.get('t');
  const body = await c.req.parseBody();

  const name = (body.name as string || '').trim();
  const description = (body.description as string || '').trim();
  const visibility = (body.visibility as string || 'private') === 'public' ? 'public' as const : 'private' as const;

  if (!name) {
    c.header('HX-Trigger', toastTrigger(t('workspaces.error.nameRequired'), 'error'));
    c.header('HX-Reswap', 'none');
    return c.body(null, 204);
  }

  try {
    const updated = await store.updateWorkspace(id, {
      name,
      description: description || undefined,
      visibility,
    });

    if (!updated) {
      c.header('HX-Trigger', toastTrigger(t('workspaces.toast.notFound'), 'error'));
      c.header('HX-Reswap', 'none');
      return c.body(null, 204);
    }

    c.header('HX-Trigger', JSON.stringify({
      closeDialog: true,
      showToast: { message: t('workspaces.toast.updated'), type: 'success' },
    }));
    return c.html(<WorkspaceTableRow workspace={updated} csrfToken={csrfToken} t={t} />);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update workspace';
    c.header('HX-Trigger', toastTrigger(msg, 'error'));
    c.header('HX-Reswap', 'none');
    return c.body(null, 204);
  }
}

export async function toggleVisibilityHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const store = c.get('store');
  const id = c.req.param('id')!;
  const csrfToken = getCsrfToken(c);
  const t = c.get('t');

  try {
    const existing = await store.getWorkspace(id);
    if (!existing) {
      c.header('HX-Trigger', toastTrigger(t('workspaces.toast.notFound'), 'error'));
      c.header('HX-Reswap', 'none');
      return c.body(null, 204);
    }

    const newVisibility = existing.visibility === 'public' ? 'private' as const : 'public' as const;
    const updated = await store.updateWorkspace(id, { visibility: newVisibility });

    if (!updated) {
      c.header('HX-Trigger', toastTrigger('Failed to update workspace', 'error'));
      c.header('HX-Reswap', 'none');
      return c.body(null, 204);
    }

    c.header('HX-Trigger', toastTrigger(newVisibility === 'public' ? t('workspaces.toast.setToPublic') : t('workspaces.toast.setToPrivate')));
    return c.html(<WorkspaceTableRow workspace={updated} csrfToken={csrfToken} t={t} />);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update workspace';
    c.header('HX-Trigger', toastTrigger(msg, 'error'));
    c.header('HX-Reswap', 'none');
    return c.body(null, 204);
  }
}

export async function deleteWorkspaceHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const store = c.get('store');
  const id = c.req.param('id')!;
  const t = c.get('t');

  try {
    const deleted = await store.deleteWorkspace(id);
    if (!deleted) {
      c.header('HX-Trigger', toastTrigger(t('workspaces.toast.notFound'), 'error'));
      c.header('HX-Reswap', 'none');
      return c.body(null, 204);
    }
    c.header('HX-Trigger', toastTrigger(t('workspaces.toast.deleted')));
    return c.html('');
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to delete workspace';
    c.header('HX-Trigger', toastTrigger(msg, 'error'));
    c.header('HX-Reswap', 'none');
    return c.body(null, 204);
  }
}

export async function bulkDeleteWorkspacesHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const store = c.get('store');
  const csrfToken = getCsrfToken(c);
  const t = c.get('t');
  const body = await c.req.parseBody();
  const ids = Array.isArray(body['ids[]']) ? body['ids[]'] as string[] : [body['ids[]'] as string].filter(Boolean);

  let deleted = 0;
  for (const id of ids) {
    const result = await store.deleteWorkspace(id);
    if (result) deleted++;
  }

  c.header('HX-Trigger', toastTrigger(t('workspaces.bulk.deletedToast', { count: String(deleted) })));

  const params = parseParams(c);
  const allWorkspaces = await store.listWorkspaces();
  const filtered = filterWorkspaces(allWorkspaces, params.q);
  const sorted = sortWorkspaces(filtered, params.sort);
  const total = sorted.length;
  const paged = sorted.slice(params.offset, params.offset + params.limit);

  return c.html(renderTableResults(paged, total, params, csrfToken, t));
}
