import type { Context } from 'hono';
import type { SiteActionSelect, ItemStoreRpc, ActionStoreRpc } from '@pignal/db';
import type { WebEnv } from '../types';
import { AppLayout } from '../components/app-layout';
import { PageHeader } from '../components/page-header';
import { StatusBadge } from '../components/status-badge';
import { ManagedList } from '../components/managed-list';
import type { SortTab, FilterDropdown, BulkAction, TableColumn } from '../components/managed-list';
import type { RowAction } from '../components/feed-item';
import { TableRow, TableCell, TableActions, RowActions } from '../components/feed-item';
import { Pagination } from '../components/pagination';
import { getCsrfToken } from '../middleware/csrf';
import { isHtmxRequest, toastTrigger } from '../lib/htmx';
import { relativeTime } from '../lib/time';

type WebVars = { store: ItemStoreRpc; actionStore: ActionStoreRpc };

const PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildUrl(params: Record<string, string | undefined>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) qs.set(k, v);
  }
  const s = qs.toString();
  return `/pignal/actions${s ? `?${s}` : ''}`;
}

function sortActions(actions: SiteActionSelect[], sort: string): SiteActionSelect[] {
  return [...actions].sort((a, b) => {
    if (sort === 'oldest') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function filterActions(actions: SiteActionSelect[], q: string, status?: string): SiteActionSelect[] {
  let result = actions;
  if (status) {
    result = result.filter((a) => a.status === status);
  }
  if (q) {
    const lower = q.toLowerCase();
    result = result.filter(
      (a) => a.name.toLowerCase().includes(lower) || a.slug.toLowerCase().includes(lower),
    );
  }
  return result;
}

function countByStatus(actions: SiteActionSelect[]): Record<string, number> {
  const counts: Record<string, number> = { active: 0, paused: 0, archived: 0 };
  for (const a of actions) {
    counts[a.status] = (counts[a.status] ?? 0) + 1;
  }
  return counts;
}

// ---------------------------------------------------------------------------
// Feed row
// ---------------------------------------------------------------------------

const ACTION_COLUMNS: TableColumn[] = [
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status' },
  { key: 'submissions', label: 'Submissions', class: 'text-right' },
  { key: 'slug', label: 'Slug', class: 'font-mono text-xs' },
  { key: 'fields', label: 'Fields', class: 'text-right' },
  { key: 'created', label: 'Created', class: 'text-muted whitespace-nowrap' },
];

function ActionTableRow({ action, csrfToken }: { action: SiteActionSelect; csrfToken: string }) {
  let fieldCount = 0;
  try {
    const fields = JSON.parse(action.fields);
    fieldCount = Array.isArray(fields) ? fields.length : 0;
  } catch {
    // leave as 0
  }

  return (
    <TableRow id={`action-${action.id}`} bulkValue={action.id}>
      <TableCell>
        <a href={`/pignal/submissions?actionId=${action.id}`} class="font-medium text-text hover:text-primary">{action.name}</a>
        <div class="text-xs text-muted mt-0.5 font-mono">{'{{action:' + action.slug + '}}'}</div>
      </TableCell>
      <TableCell><StatusBadge status={action.status} /></TableCell>
      <TableCell class="text-right">{action.submissionCount ?? 0}</TableCell>
      <TableCell class="font-mono text-xs text-muted">{action.slug}</TableCell>
      <TableCell class="text-right text-muted">{fieldCount}</TableCell>
      <TableCell class="text-muted whitespace-nowrap">{relativeTime(action.createdAt)}</TableCell>
      <TableActions>
        <RowActions actions={[
          { label: 'Edit', hxGet: `/pignal/actions/${action.id}/edit-form` },
          { label: 'CSV', href: `/pignal/actions/${action.id}/export?format=csv` },
          ...(action.status === 'active' ? [
            { label: 'Pause', hxPost: `/pignal/actions/${action.id}/toggle-status`, hxTarget: `#action-${action.id}`, csrf: csrfToken },
          ] satisfies RowAction[] : action.status === 'paused' ? [
            { label: 'Activate', hxPost: `/pignal/actions/${action.id}/toggle-status`, hxTarget: `#action-${action.id}`, csrf: csrfToken },
          ] satisfies RowAction[] : []),
          { label: 'Delete', hxPost: `/pignal/actions/${action.id}/delete`, hxTarget: `#action-${action.id}`, hxSwap: 'delete', hxConfirm: 'Delete this action and all its submissions?', destructive: true, csrf: csrfToken },
        ]} />
      </TableActions>
    </TableRow>
  );
}

// ---------------------------------------------------------------------------
// Feed results partial (HTMX)
// ---------------------------------------------------------------------------

function ActionTableResults({
  actions,
  total,
  limit,
  offset,
  baseUrl,
  csrfToken,
}: {
  actions: SiteActionSelect[];
  total: number;
  limit: number;
  offset: number;
  baseUrl: string;
  csrfToken: string;
}) {
  const colCount = ACTION_COLUMNS.length + 2; // +1 bulk checkbox, +1 actions
  return (
    <>
      <tbody id="actions-feed" class="managed-table-body">
        {actions.length === 0 ? (
          <tr><td colspan={colCount} class="managed-table-td text-center py-8 text-muted">No actions found.</td></tr>
        ) : (
          actions.map((action) => (
            <ActionTableRow action={action} csrfToken={csrfToken} />
          ))
        )}
      </tbody>
      {total > limit && (
        <Pagination
          total={total}
          limit={limit}
          offset={offset}
          baseUrl={baseUrl}
          htmxTarget="#actions-results"
          htmxIndicator="#actions-loading"
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Main page handler
// ---------------------------------------------------------------------------

export async function actionsPage(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const actionStore = c.get('actionStore');
  const csrfToken = getCsrfToken(c);

  const q = (c.req.query('q') || '').trim();
  const sort = c.req.query('sort') || 'newest';
  const status = c.req.query('status') || undefined;
  const offset = parseInt(c.req.query('offset') ?? '0', 10) || 0;

  c.header('Vary', 'HX-Request');

  const allActions = await actionStore.listActions();
  const filtered = filterActions(allActions, q, status);
  const sorted = sortActions(filtered, sort);
  const paged = sorted.slice(offset, offset + PAGE_SIZE);
  const total = sorted.length;

  const baseUrl = buildUrl({ q: q || undefined, sort: sort !== 'newest' ? sort : undefined, status });

  // HTMX partial
  if (isHtmxRequest(c)) {
    return c.html(
      <ActionTableResults
        actions={paged}
        total={total}
        limit={PAGE_SIZE}
        offset={offset}
        baseUrl={baseUrl}
        csrfToken={csrfToken}
      />,
    );
  }

  // Full page
  const statusCounts = countByStatus(allActions);
  const totalAll = allActions.length;

  const sortTabs: SortTab[] = [
    { label: 'Newest', value: 'newest', active: sort === 'newest', href: buildUrl({ q: q || undefined, sort: undefined, status }) },
    { label: 'Oldest', value: 'oldest', active: sort === 'oldest', href: buildUrl({ q: q || undefined, sort: 'oldest', status }) },
  ];

  const filterDropdowns: FilterDropdown[] = [
    {
      label: 'Status',
      name: 'status',
      options: [
        { label: `All (${totalAll})`, href: buildUrl({ q: q || undefined, sort: sort !== 'newest' ? sort : undefined }), active: !status },
        { label: `Active (${statusCounts.active ?? 0})`, href: buildUrl({ q: q || undefined, sort: sort !== 'newest' ? sort : undefined, status: 'active' }), active: status === 'active' },
        { label: `Paused (${statusCounts.paused ?? 0})`, href: buildUrl({ q: q || undefined, sort: sort !== 'newest' ? sort : undefined, status: 'paused' }), active: status === 'paused' },
        { label: `Archived (${statusCounts.archived ?? 0})`, href: buildUrl({ q: q || undefined, sort: sort !== 'newest' ? sort : undefined, status: 'archived' }), active: status === 'archived' },
      ],
    },
  ];

  const bulkActions: BulkAction[] = [
    { label: 'Pause', action: '/pignal/actions/bulk-pause' },
    { label: 'Activate', action: '/pignal/actions/bulk-activate' },
    { label: 'Delete', action: '/pignal/actions/bulk-delete', confirm: 'Delete all selected actions and their submissions?', destructive: true },
  ];

  return c.html(
    <AppLayout title="Actions" currentPath="/pignal/actions" csrfToken={csrfToken}>
      <PageHeader
        title="Actions"
        description="Create forms for lead capture, contact, newsletter signup, and more."
        count={totalAll}
      />

      <ManagedList
        id="actions"
        searchEndpoint="/pignal/actions"
        searchPlaceholder="Search actions..."
        query={q}
        sortTabs={sortTabs}
        filterDropdowns={filterDropdowns}
        bulkActions={bulkActions}
        csrfToken={csrfToken}
        totalCount={paged.length}
        emptyMessage="No actions yet. Click '+ Add' to create your first form."
        pushUrl
        display="table"
        columns={ACTION_COLUMNS}
        pagination={{ total, limit: PAGE_SIZE, offset, baseUrl }}
        addButton={
          <button
            class="outline btn-sm ml-auto"
            hx-get="/pignal/actions/add-form"
            hx-target="#app-dialog-content"
          >
            + Add
          </button>
        }
      >
        {paged.map((action) => (
          <ActionTableRow action={action} csrfToken={csrfToken} />
        ))}
      </ManagedList>
    </AppLayout>,
  );
}

// ---------------------------------------------------------------------------
// Add form dialog
// ---------------------------------------------------------------------------

export async function addActionFormHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const csrfToken = getCsrfToken(c);
  return c.html(
    <div>
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">Create Action</h3>
        <button type="button" class="dialog-close" data-close-dialog>&times;</button>
      </div>
      <form
        hx-post="/pignal/actions"
        hx-target="#actions-feed"
        hx-swap="afterbegin"
      >
        <input type="hidden" name="_csrf" value={csrfToken} />
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label>
            Name
            <input type="text" name="name" required maxlength={100} placeholder="e.g., Contact Form" />
          </label>
          <label>
            Slug
            <input type="text" name="slug" required maxlength={100} placeholder="e.g., contact" pattern="[a-z0-9-]+" />
            <small class="text-muted">Lowercase letters, numbers, and hyphens only</small>
          </label>
        </div>
        <label class="mt-3">
          Description (optional)
          <input type="text" name="description" maxlength={500} placeholder="Brief description of this form" />
        </label>
        <label class="mt-3">
          Fields (JSON)
          <textarea
            name="fields"
            rows={6}
            required
            placeholder={'[\n  { "name": "email", "type": "email", "label": "Email", "required": true },\n  { "name": "message", "type": "textarea", "label": "Message", "required": true }\n]'}
          />
          <small class="text-muted">
            JSON array. Each field: name, type (text/email/textarea/select/url/tel/number/checkbox), label, required?, placeholder?, maxLength?, options? (for select).
          </small>
        </label>
        <label class="mt-3">
          Success Message (optional)
          <input type="text" name="success_message" maxlength={500} placeholder="Thank you! We'll be in touch soon." />
        </label>
        <label class="mt-3">
          Webhook URL (optional)
          <input type="url" name="webhook_url" maxlength={500} placeholder="https://hooks.example.com/..." />
        </label>
        <div class="mt-3">
          <label class="inline-flex items-center gap-2 cursor-pointer mb-0">
            <input type="checkbox" name="require_honeypot" value="true" checked />
            <span class="text-sm">Enable honeypot spam protection</span>
          </label>
        </div>
        <button type="submit" class="btn mt-4 w-full">Create Action</button>
      </form>
    </div>,
  );
}

// ---------------------------------------------------------------------------
// Create action handler
// ---------------------------------------------------------------------------

export async function createActionHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const actionStore = c.get('actionStore');
  const body = await c.req.parseBody();

  const name = (body.name as string || '').trim();
  const slug = (body.slug as string || '').trim().toLowerCase();
  const description = (body.description as string || '').trim();
  const fieldsJson = (body.fields as string || '').trim();
  const successMessage = (body.success_message as string || '').trim();
  const webhookUrl = (body.webhook_url as string || '').trim();
  const requireHoneypot = body.require_honeypot === 'true';

  if (!name) {
    c.header('HX-Trigger', toastTrigger('Name is required', 'error'));
    c.header('HX-Reswap', 'none');
    return c.body(null, 204);
  }

  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    c.header('HX-Trigger', toastTrigger('Slug must be lowercase letters, numbers, and hyphens', 'error'));
    c.header('HX-Reswap', 'none');
    return c.body(null, 204);
  }

  let fields;
  try {
    fields = JSON.parse(fieldsJson);
    if (!Array.isArray(fields) || fields.length === 0) {
      throw new Error('Fields must be a non-empty array');
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Invalid JSON';
    c.header('HX-Trigger', toastTrigger(`Invalid fields: ${msg}`, 'error'));
    c.header('HX-Reswap', 'none');
    return c.body(null, 204);
  }

  try {
    const created = await actionStore.createAction({
      id: crypto.randomUUID(),
      name,
      slug,
      description: description || undefined,
      fields,
      settings: {
        ...(successMessage ? { success_message: successMessage } : {}),
        ...(webhookUrl ? { webhook_url: webhookUrl } : {}),
        require_honeypot: requireHoneypot,
      },
    });

    const csrfToken = getCsrfToken(c);
    c.header('HX-Trigger', toastTrigger('Action created'));
    return c.html(<ActionTableRow action={created} csrfToken={csrfToken} />);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create action';
    c.header('HX-Trigger', toastTrigger(msg, 'error'));
    c.header('HX-Reswap', 'none');
    return c.body(null, 204);
  }
}

// ---------------------------------------------------------------------------
// Edit form dialog
// ---------------------------------------------------------------------------

export async function editActionFormHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const id = c.req.param('id')!;
  const actionStore = c.get('actionStore');
  const action = await actionStore.getAction(id);
  if (!action) {
    c.header('HX-Trigger', toastTrigger('Action not found', 'error'));
    return c.html('');
  }

  const csrfToken = getCsrfToken(c);
  let parsedSettings: Record<string, unknown> = {};
  try {
    parsedSettings = JSON.parse(action.settings);
  } catch {
    // ignore
  }

  return c.html(
    <div>
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">Edit Action</h3>
        <button type="button" class="dialog-close" data-close-dialog>&times;</button>
      </div>
      <form
        hx-post={`/pignal/actions/${action.id}/update`}
        hx-target={`#action-${action.id}`}
        hx-swap="outerHTML"
      >
        <input type="hidden" name="_csrf" value={csrfToken} />
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label>
            Name
            <input type="text" name="name" required maxlength={100} value={action.name} />
          </label>
          <label>
            Slug
            <input type="text" name="slug" required maxlength={100} value={action.slug} pattern="[a-z0-9-]+" />
          </label>
        </div>
        <label class="mt-3">
          Description
          <input type="text" name="description" maxlength={500} value={action.description ?? ''} />
        </label>
        <label class="mt-3">
          Fields (JSON)
          <textarea name="fields" rows={6}>{action.fields}</textarea>
        </label>
        <label class="mt-3">
          Success Message
          <input type="text" name="success_message" maxlength={500} value={(parsedSettings.success_message as string) ?? ''} />
        </label>
        <label class="mt-3">
          Webhook URL
          <input type="url" name="webhook_url" maxlength={500} value={(parsedSettings.webhook_url as string) ?? ''} />
        </label>
        <div class="mt-3">
          <label class="inline-flex items-center gap-2 cursor-pointer mb-0">
            <input type="checkbox" name="require_honeypot" value="true" checked={!!parsedSettings.require_honeypot} />
            <span class="text-sm">Enable honeypot spam protection</span>
          </label>
        </div>
        <button type="submit" class="btn mt-4 w-full">Save Changes</button>
      </form>
    </div>,
  );
}

// ---------------------------------------------------------------------------
// Edit action handler
// ---------------------------------------------------------------------------

export async function editActionHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const id = c.req.param('id')!;
  const actionStore = c.get('actionStore');
  const body = await c.req.parseBody();

  const name = body.name as string | undefined;
  const slug = body.slug as string | undefined;
  const description = body.description as string | undefined;
  const fieldsJson = body.fields as string | undefined;
  const successMessage = body.success_message as string | undefined;
  const webhookUrl = body.webhook_url as string | undefined;
  const requireHoneypot = body.require_honeypot as string | undefined;

  let fields;
  if (fieldsJson !== undefined && fieldsJson.trim()) {
    try {
      fields = JSON.parse(fieldsJson);
      if (!Array.isArray(fields) || fields.length === 0) {
        throw new Error('Fields must be a non-empty array');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid JSON';
      c.header('HX-Trigger', toastTrigger(`Invalid fields: ${msg}`, 'error'));
      c.header('HX-Reswap', 'none');
      return c.body(null, 204);
    }
  }

  let settings;
  if (successMessage !== undefined || webhookUrl !== undefined || requireHoneypot !== undefined) {
    const existing = await actionStore.getAction(id);
    const existingSettings = existing?.settings ? JSON.parse(existing.settings) : {};
    settings = {
      ...existingSettings,
      ...(successMessage !== undefined ? { success_message: successMessage.trim() || undefined } : {}),
      ...(webhookUrl !== undefined ? { webhook_url: webhookUrl.trim() || undefined } : {}),
      ...(requireHoneypot !== undefined ? { require_honeypot: requireHoneypot === 'true' } : {}),
    };
  }

  try {
    const updated = await actionStore.updateAction(id, {
      ...(name ? { name: name.toString().trim() } : {}),
      ...(slug ? { slug: slug.toString().trim().toLowerCase() } : {}),
      ...(description !== undefined ? { description: description.trim() || null } : {}),
      ...(fields ? { fields } : {}),
      ...(settings ? { settings } : {}),
    });

    if (!updated) {
      c.header('HX-Trigger', toastTrigger('Action not found', 'error'));
      c.header('HX-Reswap', 'none');
      return c.body(null, 204);
    }

    const csrfToken = getCsrfToken(c);
    c.header('HX-Trigger', toastTrigger('Action updated'));
    return c.html(<ActionTableRow action={updated} csrfToken={csrfToken} />);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update action';
    c.header('HX-Trigger', toastTrigger(msg, 'error'));
    c.header('HX-Reswap', 'none');
    return c.body(null, 204);
  }
}

// ---------------------------------------------------------------------------
// Delete action handler
// ---------------------------------------------------------------------------

export async function deleteActionHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const id = c.req.param('id')!;
  const actionStore = c.get('actionStore');

  try {
    const deleted = await actionStore.deleteAction(id);
    if (!deleted) {
      c.header('HX-Trigger', toastTrigger('Action not found', 'error'));
      c.header('HX-Reswap', 'none');
      return c.body(null, 204);
    }
    c.header('HX-Trigger', toastTrigger('Action deleted'));
    return c.html('');
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to delete action';
    c.header('HX-Trigger', toastTrigger(msg, 'error'));
    c.header('HX-Reswap', 'none');
    return c.body(null, 204);
  }
}

// ---------------------------------------------------------------------------
// Toggle status handler (active <-> paused)
// ---------------------------------------------------------------------------

export async function toggleActionStatusHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const id = c.req.param('id')!;
  const actionStore = c.get('actionStore');

  const action = await actionStore.getAction(id);
  if (!action) {
    c.header('HX-Trigger', toastTrigger('Action not found', 'error'));
    c.header('HX-Reswap', 'none');
    return c.body(null, 204);
  }

  const newStatus = action.status === 'active' ? 'paused' as const : 'active' as const;

  try {
    const updated = await actionStore.updateAction(id, { status: newStatus });
    if (!updated) {
      c.header('HX-Trigger', toastTrigger('Failed to update status', 'error'));
      c.header('HX-Reswap', 'none');
      return c.body(null, 204);
    }

    const csrfToken = getCsrfToken(c);
    c.header('HX-Trigger', toastTrigger(`Action ${newStatus}`));
    return c.html(<ActionTableRow action={updated} csrfToken={csrfToken} />);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to toggle status';
    c.header('HX-Trigger', toastTrigger(msg, 'error'));
    c.header('HX-Reswap', 'none');
    return c.body(null, 204);
  }
}

// ---------------------------------------------------------------------------
// Export CSV handler
// ---------------------------------------------------------------------------

export async function exportActionSubmissionsHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const id = c.req.param('id')!;
  const actionStore = c.get('actionStore');
  const format = (c.req.query('format') || 'csv') as 'csv' | 'json';

  try {
    const data = await actionStore.exportSubmissions(id, format);
    const contentType = format === 'json' ? 'application/json' : 'text/csv';
    const ext = format === 'json' ? 'json' : 'csv';
    c.header('Content-Type', `${contentType}; charset=utf-8`);
    c.header('Content-Disposition', `attachment; filename="submissions-${id}.${ext}"`);
    return c.body(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Export failed';
    c.header('HX-Trigger', toastTrigger(msg, 'error'));
    return c.redirect('/pignal/actions');
  }
}

// ---------------------------------------------------------------------------
// Bulk handlers
// ---------------------------------------------------------------------------

async function parseBulkIds(c: Context): Promise<string[]> {
  const body = await c.req.parseBody({ all: true });
  const rawIds = body['ids[]'];
  return Array.isArray(rawIds) ? rawIds as string[] : rawIds ? [rawIds as string] : [];
}

async function reRenderActionList(c: Context<{ Bindings: WebEnv; Variables: WebVars }>): Promise<Response> {
  const actionStore = c.get('actionStore');
  const csrfToken = getCsrfToken(c);
  const actions = await actionStore.listActions();
  const sorted = sortActions(actions, 'newest');
  return c.html(
    <ActionTableResults
      actions={sorted.slice(0, PAGE_SIZE)}
      total={sorted.length}
      limit={PAGE_SIZE}
      offset={0}
      baseUrl="/pignal/actions"
      csrfToken={csrfToken}
    />,
  );
}

export async function bulkPauseActionsHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const actionStore = c.get('actionStore');
  const ids = await parseBulkIds(c);

  if (ids.length === 0) {
    c.header('HX-Trigger', toastTrigger('No actions selected', 'error'));
    c.header('HX-Reswap', 'none');
    return c.body(null, 204);
  }

  let updated = 0;
  for (const id of ids) {
    try {
      const ok = await actionStore.updateAction(id, { status: 'paused' });
      if (ok) updated++;
    } catch {
      // skip
    }
  }

  c.header('HX-Trigger', toastTrigger(`Paused ${updated} action${updated !== 1 ? 's' : ''}`));
  return reRenderActionList(c);
}

export async function bulkActivateActionsHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const actionStore = c.get('actionStore');
  const ids = await parseBulkIds(c);

  if (ids.length === 0) {
    c.header('HX-Trigger', toastTrigger('No actions selected', 'error'));
    c.header('HX-Reswap', 'none');
    return c.body(null, 204);
  }

  let updated = 0;
  for (const id of ids) {
    try {
      const ok = await actionStore.updateAction(id, { status: 'active' });
      if (ok) updated++;
    } catch {
      // skip
    }
  }

  c.header('HX-Trigger', toastTrigger(`Activated ${updated} action${updated !== 1 ? 's' : ''}`));
  return reRenderActionList(c);
}

export async function bulkDeleteActionsHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const actionStore = c.get('actionStore');
  const ids = await parseBulkIds(c);

  if (ids.length === 0) {
    c.header('HX-Trigger', toastTrigger('No actions selected', 'error'));
    c.header('HX-Reswap', 'none');
    return c.body(null, 204);
  }

  let deleted = 0;
  for (const id of ids) {
    try {
      const ok = await actionStore.deleteAction(id);
      if (ok) deleted++;
    } catch {
      // skip
    }
  }

  c.header('HX-Trigger', toastTrigger(`Deleted ${deleted} action${deleted !== 1 ? 's' : ''}`));
  return reRenderActionList(c);
}
