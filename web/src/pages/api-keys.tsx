import type { Context } from 'hono';
import type { ApiKeyInfo, ItemStoreRpc, WorkspaceSelect } from '@pignal/db';
import type { ApiKeyStore } from '@pignal/core/store/api-keys';
import type { WebEnv } from '../types';
import { VALID_PERMISSIONS } from '@pignal/core/auth/permissions';
import { AppLayout } from '../components/app-layout';
import { PageHeader } from '../components/page-header';
import { ManagedList } from '../components/managed-list';
import type { SortTab, BulkAction, TableColumn } from '../components/managed-list';
import type { RowAction } from '../components/feed-item';
import { TableRow, TableCell, TableActions, RowActions } from '../components/feed-item';
import { FormDropdown } from '../components/form-dropdown';
import { getCsrfToken } from '../middleware/csrf';
import { isHtmxRequest, toastTrigger } from '../lib/htmx';
import { relativeTime } from '../lib/time';

type WebVars = { store: ItemStoreRpc; apiKeyStore: ApiKeyStore };

/** Human-readable labels for each permission. */
const PERMISSION_META: Record<string, { label: string; desc: string }> = {
  save_item: { label: 'Save Item', desc: 'Create new items via REST API or MCP' },
  list_items: { label: 'List Items', desc: 'List, view, and search items' },
  edit_item: { label: 'Edit Item', desc: 'Update, archive/unarchive, and vouch items' },
  delete_item: { label: 'Delete Item', desc: 'Permanently delete items' },
  validate_item: { label: 'Validate Item', desc: 'Apply validation actions to items' },
  get_metadata: { label: 'Get Metadata', desc: 'View types, workspaces, stats, and settings' },
  manage_types: { label: 'Manage Types', desc: 'Create, update, and delete item types' },
  manage_workspaces: { label: 'Manage Workspaces', desc: 'Create, update, and delete workspaces' },
  manage_settings: { label: 'Manage Settings', desc: 'Modify server settings' },
  manage_actions: { label: 'Manage Actions', desc: 'Create and manage forms and submissions' },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sortKeys(keys: ApiKeyInfo[], sort: string): ApiKeyInfo[] {
  return [...keys].sort((a, b) => {
    if (sort === 'oldest') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

// ---------------------------------------------------------------------------
// Feed row
// ---------------------------------------------------------------------------

const API_KEY_COLUMNS: TableColumn[] = [
  { key: 'name', label: 'Name' },
  { key: 'permissions', label: 'Permissions' },
  { key: 'workspace', label: 'Workspace' },
  { key: 'created', label: 'Created', class: 'text-muted whitespace-nowrap' },
  { key: 'lastUsed', label: 'Last Used', class: 'text-muted whitespace-nowrap' },
  { key: 'expires', label: 'Expires', class: 'text-muted whitespace-nowrap' },
];

function ApiKeyTableRow({ apiKey, csrfToken }: { apiKey: ApiKeyInfo; csrfToken: string }) {
  const perms = apiKey.scopes.split(',').filter(Boolean);
  const isExpired = apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date();
  const permsSummary = perms.length <= 3
    ? perms.join(', ')
    : `${perms.slice(0, 2).join(', ')} +${perms.length - 2} more`;

  return (
    <TableRow id={`key-${apiKey.id}`} bulkValue={apiKey.id}>
      <TableCell>
        <span class="font-medium">{apiKey.name}</span>
        {isExpired && <span class="text-xs text-error ml-1">(expired)</span>}
      </TableCell>
      <TableCell class="text-xs">{permsSummary}</TableCell>
      <TableCell class="text-xs text-muted">{apiKey.workspaceIds ? 'Restricted' : 'All'}</TableCell>
      <TableCell class="text-muted whitespace-nowrap">{relativeTime(apiKey.createdAt)}</TableCell>
      <TableCell class="text-muted whitespace-nowrap">{apiKey.lastUsedAt ? relativeTime(apiKey.lastUsedAt) : '\u2014'}</TableCell>
      <TableCell class="text-muted whitespace-nowrap">{apiKey.expiresAt ? new Date(apiKey.expiresAt).toLocaleDateString() : 'Never'}</TableCell>
      <TableActions>
        <RowActions actions={[
          { label: 'Revoke', hxPost: `/pignal/api-keys/${apiKey.id}/delete`, hxTarget: `#key-${apiKey.id}`, hxSwap: 'delete', hxConfirm: 'Revoke this API key? This cannot be undone.', destructive: true, csrf: csrfToken },
        ] satisfies RowAction[]} />
      </TableActions>
    </TableRow>
  );
}

// ---------------------------------------------------------------------------
// Feed results partial
// ---------------------------------------------------------------------------

function ApiKeyTableResults({
  keys,
  csrfToken,
}: {
  keys: ApiKeyInfo[];
  csrfToken: string;
}) {
  const colCount = API_KEY_COLUMNS.length + 2; // +1 bulk checkbox, +1 actions
  return (
    <tbody id="keys-feed" class="managed-table-body">
      {keys.length === 0 ? (
        <tr><td colspan={colCount} class="managed-table-td text-center py-8 text-muted">No API keys created yet.</td></tr>
      ) : (
        keys.map((k) => (
          <ApiKeyTableRow apiKey={k} csrfToken={csrfToken} />
        ))
      )}
    </tbody>
  );
}

// ---------------------------------------------------------------------------
// Main page handler
// ---------------------------------------------------------------------------

export async function apiKeysPage(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const csrfToken = getCsrfToken(c);
  const apiKeyStore = c.get('apiKeyStore');
  const sort = c.req.query('sort') || 'newest';

  c.header('Vary', 'HX-Request');

  const keys = await apiKeyStore.list();
  const sorted = sortKeys(keys, sort);

  // HTMX partial
  if (isHtmxRequest(c)) {
    return c.html(<ApiKeyTableResults keys={sorted} csrfToken={csrfToken} />);
  }

  const sortTabs: SortTab[] = [
    { label: 'Newest', value: 'newest', active: sort === 'newest', href: '/pignal/api-keys' },
    { label: 'Oldest', value: 'oldest', active: sort === 'oldest', href: '/pignal/api-keys?sort=oldest' },
  ];

  const bulkActions: BulkAction[] = [
    { label: 'Revoke', action: '/pignal/api-keys/bulk-revoke', confirm: 'Revoke all selected API keys? This cannot be undone.', destructive: true },
  ];

  return c.html(
    <AppLayout title="API Keys" currentPath="/pignal/api-keys" csrfToken={csrfToken}>
      <PageHeader
        title="API Keys"
        description="Manage access tokens for the REST API and MCP."
        count={keys.length}
      />

      <ManagedList
        id="keys"
        sortTabs={sortTabs}
        bulkActions={bulkActions}
        csrfToken={csrfToken}
        totalCount={sorted.length}
        emptyMessage="No API keys created yet. Create one to get started with programmatic access."
        pushUrl
        display="table"
        columns={API_KEY_COLUMNS}
        addButton={
          <button
            class="outline btn-sm ml-auto"
            hx-get="/pignal/api-keys/add-form"
            hx-target="#app-dialog-content"
          >
            + Add
          </button>
        }
      >
        {sorted.map((k) => (
          <ApiKeyTableRow apiKey={k} csrfToken={csrfToken} />
        ))}
      </ManagedList>
    </AppLayout>,
  );
}

// ---------------------------------------------------------------------------
// Add form dialog
// ---------------------------------------------------------------------------

function PermissionCheckboxes() {
  return (
    <fieldset class="border border-border rounded-xl p-4 mt-3">
      <legend class="text-sm font-semibold px-1">Permissions</legend>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
        {VALID_PERMISSIONS.map((perm) => {
          const meta = PERMISSION_META[perm] ?? { label: perm, desc: '' };
          return (
            <label class="flex items-start gap-2 cursor-pointer mb-0">
              <input type="checkbox" name="permissions" value={perm} checked class="mt-0.5" />
              <span class="flex flex-col leading-tight">
                <strong class="text-sm">{meta.label}</strong>
                <small class="text-muted text-xs">{meta.desc}</small>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function WorkspaceSelector({ workspaces }: { workspaces: WorkspaceSelect[] }) {
  if (workspaces.length === 0) return null;
  return (
    <fieldset class="border border-border rounded-xl p-4 mt-3">
      <legend class="text-sm font-semibold px-1">Workspace Access</legend>
      <input type="hidden" name="totalWorkspaces" value={String(workspaces.length)} />
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2">
        {workspaces.map((ws) => (
          <label class="flex items-start gap-2 cursor-pointer mb-0">
            <input type="checkbox" name="workspaceIds" value={ws.id} checked class="mt-0.5" />
            <span class="flex flex-col leading-tight">
              <strong class="text-sm">{ws.name}</strong>
              {ws.description && <small class="text-muted text-xs">{ws.description}</small>}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export async function addApiKeyFormHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const csrfToken = getCsrfToken(c);
  const store = c.get('store');
  const workspaces = await store.listWorkspaces();

  return c.html(
    <div>
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">Create API Key</h3>
        <button type="button" class="dialog-close" data-close-dialog>&times;</button>
      </div>
      <form
        hx-post="/pignal/api-keys"
        hx-target="#app-dialog-content"
        hx-swap="innerHTML"
      >
        <input type="hidden" name="_csrf" value={csrfToken} />
        <div class="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4">
          <label>
            Key Name
            <input type="text" name="name" required maxlength={100} placeholder="e.g., federation, claude-desktop" />
          </label>
          <label>
            Expiry
            <FormDropdown
              name="expiryDays"
              value="90"
              options={[
                { value: '30', label: '30 days' },
                { value: '90', label: '90 days' },
                { value: '365', label: '1 year' },
                { value: '', label: 'No expiry' },
              ]}
            />
          </label>
        </div>

        <PermissionCheckboxes />
        <WorkspaceSelector workspaces={workspaces} />

        <button type="submit" class="btn mt-4 w-full">Create Key</button>
      </form>
    </div>,
  );
}

// ---------------------------------------------------------------------------
// Create API key handler — shows raw key in dialog
// ---------------------------------------------------------------------------

export async function createApiKeyHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const body = await c.req.parseBody({ all: true });
  const name = (body.name as string)?.trim();
  const expiryDays = body.expiryDays ? parseInt(body.expiryDays as string, 10) : undefined;

  if (!name) {
    c.header('HX-Trigger', toastTrigger('Key name is required', 'error'));
    return c.html(<p class="text-error text-sm">Key name is required.</p>);
  }

  const rawPermissions = body.permissions;
  const selectedPermissions: string[] = Array.isArray(rawPermissions)
    ? rawPermissions as string[]
    : rawPermissions
      ? [rawPermissions as string]
      : [];

  if (selectedPermissions.length === 0) {
    c.header('HX-Trigger', toastTrigger('At least one permission is required', 'error'));
    return c.html(<p class="text-error text-sm">At least one permission is required.</p>);
  }

  const rawWorkspaceIds = body.workspaceIds;
  const selectedWorkspaceIds: string[] = Array.isArray(rawWorkspaceIds)
    ? rawWorkspaceIds as string[]
    : rawWorkspaceIds
      ? [rawWorkspaceIds as string]
      : [];
  const totalWorkspaces = parseInt(body.totalWorkspaces as string, 10) || 0;
  const allWorkspacesSelected = totalWorkspaces > 0 && selectedWorkspaceIds.length >= totalWorkspaces;

  const apiKeyStore = c.get('apiKeyStore');

  let expiresAt: string | undefined;
  if (expiryDays) {
    const exp = new Date();
    exp.setDate(exp.getDate() + expiryDays);
    expiresAt = exp.toISOString();
  }

  const { rawKey } = await apiKeyStore.create(
    name,
    selectedPermissions.join(','),
    expiresAt,
    allWorkspacesSelected || selectedWorkspaceIds.length === 0 ? null : selectedWorkspaceIds,
  );

  c.header('HX-Trigger', toastTrigger('API key created'));

  return c.html(
    <div>
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">API Key Created</h3>
        <button type="button" class="dialog-close" data-close-dialog>&times;</button>
      </div>
      <div class="bg-success-bg border border-success-border rounded-lg p-4">
        <p class="font-semibold">Copy this key now — it won't be shown again.</p>
        <div class="flex items-center gap-2 mt-3">
          <code id="raw-key-value" class="flex-1 break-all text-sm bg-surface-raised px-3 py-2 rounded">{rawKey}</code>
          <button
            type="button"
            class="outline btn-sm"
            onclick="navigator.clipboard.writeText(document.getElementById('raw-key-value').textContent).then(()=>{this.textContent='Copied!'})"
          >
            Copy
          </button>
        </div>
        <p class="text-sm text-muted mt-3">
          Use as Bearer token: <code>Authorization: Bearer {rawKey.slice(0, 12)}...</code>
        </p>
        <div class="text-sm text-muted mt-1">
          Permissions: {selectedPermissions.join(', ')}
          {!allWorkspacesSelected && selectedWorkspaceIds.length > 0 && (
            <span> | Workspaces: {selectedWorkspaceIds.length} restricted</span>
          )}
        </div>
      </div>
      <p class="text-sm text-muted mt-4 text-center">
        <a href="/pignal/api-keys">Refresh page</a> to see the key in the list.
      </p>
    </div>,
  );
}

// ---------------------------------------------------------------------------
// Delete single key
// ---------------------------------------------------------------------------

export async function deleteApiKeyHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const id = c.req.param('id')!;
  const apiKeyStore = c.get('apiKeyStore');

  const deleted = await apiKeyStore.delete(id);
  if (deleted) {
    c.header('HX-Trigger', toastTrigger('API key revoked'));
  } else {
    c.header('HX-Trigger', toastTrigger('Key not found', 'error'));
  }
  return c.html('');
}

// ---------------------------------------------------------------------------
// Bulk revoke
// ---------------------------------------------------------------------------

export async function bulkRevokeApiKeysHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const apiKeyStore = c.get('apiKeyStore');
  const body = await c.req.parseBody({ all: true });
  const rawIds = body['ids[]'];
  const ids: string[] = Array.isArray(rawIds) ? rawIds as string[] : rawIds ? [rawIds as string] : [];

  if (ids.length === 0) {
    c.header('HX-Trigger', toastTrigger('No keys selected', 'error'));
    c.header('HX-Reswap', 'none');
    return c.body(null, 204);
  }

  let revoked = 0;
  for (const id of ids) {
    try {
      const ok = await apiKeyStore.delete(id);
      if (ok) revoked++;
    } catch {
      // skip
    }
  }

  c.header('HX-Trigger', toastTrigger(`Revoked ${revoked} key${revoked !== 1 ? 's' : ''}`));

  // Re-render the full list
  const csrfToken = getCsrfToken(c);
  const keys = await apiKeyStore.list();
  const sorted = sortKeys(keys, 'newest');
  return c.html(<ApiKeyTableResults keys={sorted} csrfToken={csrfToken} />);
}
