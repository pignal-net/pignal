import type { Context } from 'hono';
import type { ItemStoreRpc, WorkspaceSelect } from '@pignal/db';
import type { WebEnv } from '../types';
import type { BulkAction, TableColumn } from '../components/managed-list';
import { AppLayout } from '../components/app-layout';
import { PageHeader } from '../components/page-header';
import { ManagedList } from '../components/managed-list';
import type { RowAction } from '../components/feed-item';
import { TableRow, TableCell, TableActions, RowActions } from '../components/feed-item';
import { StatusBadge } from '../components/status-badge';
import { FormDropdown } from '../components/form-dropdown';
import { Pagination } from '../components/pagination';
import { relativeTime } from '../lib/time';
import { getCsrfToken } from '../middleware/csrf';
import { isHtmxRequest, toastTrigger } from '../lib/htmx';

type WebVars = { store: ItemStoreRpc };

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

const workspaceColumns: TableColumn[] = [
  { key: 'name', label: 'Name' },
  { key: 'visibility', label: 'Visibility' },
  { key: 'description', label: 'Description' },
  { key: 'default', label: 'Default' },
  { key: 'created', label: 'Created', class: 'text-muted whitespace-nowrap' },
];

function WorkspaceTableRow({ workspace, csrfToken }: { workspace: WorkspaceSelect; csrfToken: string }) {
  const isDefault = workspace.isDefault === 1;
  const description = workspace.description ? truncate(workspace.description, 80) : null;

  return (
    <TableRow id={`ws-${workspace.id}`} bulkValue={isDefault ? undefined : workspace.id}>
      <TableCell>
        <span class="font-medium text-text">{workspace.name}</span>
      </TableCell>
      <TableCell><StatusBadge status={workspace.visibility} styles={VISIBILITY_STYLES} /></TableCell>
      <TableCell class="text-muted">{description ?? '\u2014'}</TableCell>
      <TableCell>{isDefault ? <span class="text-xs text-muted">Yes</span> : '\u2014'}</TableCell>
      <TableCell class="text-muted whitespace-nowrap">{relativeTime(workspace.createdAt)}</TableCell>
      <TableActions>
        <RowActions actions={[
          { label: 'Edit', hxGet: `/pignal/workspaces/${workspace.id}/edit-form` },
          ...(!isDefault ? [
            {
              label: workspace.visibility === 'public' ? 'Make Private' : 'Make Public',
              hxPost: `/pignal/workspaces/${workspace.id}/toggle-visibility`,
              hxTarget: `#ws-${workspace.id}`,
              csrf: csrfToken,
            },
            {
              label: 'Delete',
              hxPost: `/pignal/workspaces/${workspace.id}/delete`,
              hxTarget: `#ws-${workspace.id}`,
              hxSwap: 'delete',
              hxConfirm: 'Delete this workspace?',
              destructive: true,
              csrf: csrfToken,
            },
          ] satisfies RowAction[] : []),
        ]} />
      </TableActions>
    </TableRow>
  );
}

function renderTableResults(list: WorkspaceSelect[], total: number, params: ReturnType<typeof parseParams>, csrfToken: string) {
  const baseUrl = buildBaseUrl(params);

  return (
    <>
      <tbody id="workspaces-feed" class="managed-table-body">
        {total === 0 ? (
          <tr><td colspan={workspaceColumns.length + 2} class="managed-table-td text-center py-8 text-muted">No workspaces found.</td></tr>
        ) : (
          list.map((ws) => <WorkspaceTableRow workspace={ws} csrfToken={csrfToken} />)
        )}
      </tbody>
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
  const params = parseParams(c);

  c.header('Vary', 'HX-Request');

  const allWorkspaces = await store.listWorkspaces();
  const filtered = filterWorkspaces(allWorkspaces, params.q);
  const sorted = sortWorkspaces(filtered, params.sort);
  const total = sorted.length;
  const paged = sorted.slice(params.offset, params.offset + params.limit);

  if (isHtmxRequest(c)) {
    return c.html(renderTableResults(paged, total, params, csrfToken));
  }

  const sortTabs = [
    { label: 'Newest', value: 'newest', active: params.sort === 'newest', href: buildBaseUrl({ ...params, sort: 'newest' }) },
    { label: 'Oldest', value: 'oldest', active: params.sort === 'oldest', href: buildBaseUrl({ ...params, sort: 'oldest' }) },
  ];

  const bulkActions: BulkAction[] = [
    { label: 'Delete', action: '/pignal/workspaces/bulk/delete', confirm: 'Delete selected workspaces?', destructive: true },
  ];

  return c.html(
    <AppLayout title="Workspaces" currentPath="/pignal/workspaces" csrfToken={csrfToken}>
      <PageHeader title="Workspaces" description="Organize content into collections" count={total} />

      <ManagedList
        id="workspaces"
        searchEndpoint="/pignal/workspaces"
        searchPlaceholder="Search workspaces..."
        query={params.q}
        sortTabs={sortTabs}
        bulkActions={bulkActions}
        csrfToken={csrfToken}
        totalCount={total}
        emptyMessage="No workspaces yet. Create one to organize your content."
        pagination={{ total, limit: params.limit, offset: params.offset, baseUrl: buildBaseUrl(params) }}
        pushUrl
        display="table"
        columns={workspaceColumns}
        addButton={
          <button
            class="outline btn-sm"
            hx-get="/pignal/workspaces/add-form"
            hx-target="#app-dialog-content"
          >
            + Add
          </button>
        }
      >
        {paged.map((ws) => <WorkspaceTableRow workspace={ws} csrfToken={csrfToken} />)}
      </ManagedList>
    </AppLayout>
  );
}

export async function addWorkspaceFormHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const csrfToken = getCsrfToken(c);

  return c.html(
    <div>
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">Create Workspace</h3>
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
          Name
          <input type="text" name="name" required maxlength={100} placeholder="e.g., Engineering" />
        </label>
        <label class="mb-3 block">
          Description
          <textarea name="description" rows={3} maxlength={500} placeholder="What this workspace is for" />
        </label>
        <label class="mb-3 block">
          Visibility
          <FormDropdown
            name="visibility"
            value="private"
            options={[
              { value: 'private', label: 'Private' },
              { value: 'public', label: 'Public' },
            ]}
          />
        </label>
        <button type="submit" class="btn mt-4 w-full">Create Workspace</button>
      </form>
    </div>
  );
}

export async function createWorkspaceHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const store = c.get('store');
  const csrfToken = getCsrfToken(c);
  const body = await c.req.parseBody();

  const name = (body.name as string || '').trim();
  const description = (body.description as string || '').trim();
  const visibility = (body.visibility as string || 'private') === 'public' ? 'public' as const : 'private' as const;

  if (!name) {
    c.header('HX-Trigger', toastTrigger('Name is required', 'error'));
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
      showToast: { message: 'Workspace created', type: 'success' },
    }));
    return c.html(<WorkspaceTableRow workspace={created} csrfToken={csrfToken} />);
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

  const workspace = await store.getWorkspace(id);
  if (!workspace) {
    c.header('HX-Trigger', toastTrigger('Workspace not found', 'error'));
    return c.body(null, 204);
  }

  return c.html(
    <div>
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">Edit Workspace</h3>
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
          Name
          <input type="text" name="name" value={workspace.name} required maxlength={100} />
        </label>
        <label class="mb-3 block">
          Description
          <textarea name="description" rows={3} maxlength={500}>{workspace.description ?? ''}</textarea>
        </label>
        <label class="mb-3 block">
          Visibility
          <FormDropdown
            name="visibility"
            value={workspace.visibility}
            options={[
              { value: 'private', label: 'Private' },
              { value: 'public', label: 'Public' },
            ]}
          />
        </label>
        <button type="submit" class="btn mt-4 w-full">Save Changes</button>
      </form>
    </div>
  );
}

export async function editWorkspaceHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const store = c.get('store');
  const id = c.req.param('id')!;
  const csrfToken = getCsrfToken(c);
  const body = await c.req.parseBody();

  const name = (body.name as string || '').trim();
  const description = (body.description as string || '').trim();
  const visibility = (body.visibility as string || 'private') === 'public' ? 'public' as const : 'private' as const;

  if (!name) {
    c.header('HX-Trigger', toastTrigger('Name is required', 'error'));
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
      c.header('HX-Trigger', toastTrigger('Workspace not found', 'error'));
      c.header('HX-Reswap', 'none');
      return c.body(null, 204);
    }

    c.header('HX-Trigger', JSON.stringify({
      closeDialog: true,
      showToast: { message: 'Workspace updated', type: 'success' },
    }));
    return c.html(<WorkspaceTableRow workspace={updated} csrfToken={csrfToken} />);
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

  try {
    const existing = await store.getWorkspace(id);
    if (!existing) {
      c.header('HX-Trigger', toastTrigger('Workspace not found', 'error'));
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

    c.header('HX-Trigger', toastTrigger(`Workspace set to ${newVisibility}`));
    return c.html(<WorkspaceTableRow workspace={updated} csrfToken={csrfToken} />);
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

  try {
    const deleted = await store.deleteWorkspace(id);
    if (!deleted) {
      c.header('HX-Trigger', toastTrigger('Workspace not found', 'error'));
      c.header('HX-Reswap', 'none');
      return c.body(null, 204);
    }
    c.header('HX-Trigger', toastTrigger('Workspace deleted'));
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
  const body = await c.req.parseBody();
  const ids = Array.isArray(body['ids[]']) ? body['ids[]'] as string[] : [body['ids[]'] as string].filter(Boolean);

  let deleted = 0;
  for (const id of ids) {
    const result = await store.deleteWorkspace(id);
    if (result) deleted++;
  }

  c.header('HX-Trigger', toastTrigger(`${deleted} workspace(s) deleted`));

  const params = parseParams(c);
  const allWorkspaces = await store.listWorkspaces();
  const filtered = filterWorkspaces(allWorkspaces, params.q);
  const sorted = sortWorkspaces(filtered, params.sort);
  const total = sorted.length;
  const paged = sorted.slice(params.offset, params.offset + params.limit);

  return c.html(renderTableResults(paged, total, params, csrfToken));
}
