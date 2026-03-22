import type { Context } from 'hono';
import type { ApiKeyInfo, WorkspaceSelect } from '@pignal/db';
import type { ApiKeyStore } from '@pignal/core/store/api-keys';
import type { ItemStoreRpc } from '@pignal/db';
import type { WebEnv } from '../types';
import { AppLayout } from '../components/app-layout';
import { getCsrfToken } from '../middleware/csrf';
import { isHtmxRequest, toastTrigger } from '../lib/htmx';

type WebVars = { apiKeyStore: ApiKeyStore; store: ItemStoreRpc };

/** Flat permission list for the UI. Each maps to a specific API/tool capability. */
const PERMISSION_LIST = [
  { value: 'save_item', label: 'Save Item', desc: 'Create new items via REST API or MCP' },
  { value: 'list_items', label: 'List Items', desc: 'List, view, and search items' },
  { value: 'edit_item', label: 'Edit Item', desc: 'Update, archive/unarchive, and vouch items' },
  { value: 'delete_item', label: 'Delete Item', desc: 'Permanently delete items' },
  { value: 'validate_item', label: 'Validate Item', desc: 'Apply validation actions to items' },
  { value: 'get_metadata', label: 'Get Metadata', desc: 'View types, workspaces, stats, and settings' },
  { value: 'manage_types', label: 'Manage Types', desc: 'Create, update, and delete item types' },
  { value: 'manage_workspaces', label: 'Manage Workspaces', desc: 'Create, update, and delete workspaces' },
  { value: 'manage_settings', label: 'Manage Settings', desc: 'Modify server settings' },
] as const;

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function PermissionBadge({ permission }: { permission: string }) {
  return (
    <span
      class="inline-block text-xs font-semibold px-2 py-0.5 rounded whitespace-nowrap text-info border border-info-border bg-info-bg"
      title={permission}
    >
      {permission}
    </span>
  );
}

function ApiKeyRow({
  apiKey,
  csrfToken,
  workspaceMap,
}: {
  apiKey: ApiKeyInfo;
  csrfToken: string;
  workspaceMap: Map<string, string>;
}) {
  const isExpired = apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date();
  const permissions = apiKey.scopes.split(',').filter(Boolean);
  const restrictedWorkspaces = apiKey.workspaceIds
    ? apiKey.workspaceIds.split(',').filter(Boolean)
    : null;

  return (
    <tr id={`key-${apiKey.id}`}>
      <td>
        <strong>{apiKey.name}</strong>
        {isExpired && <span class="text-muted ml-2">(expired)</span>}
      </td>
      <td>
        <div class="flex gap-1 flex-wrap">
          {permissions.map((p) => (
            <PermissionBadge permission={p} />
          ))}
        </div>
      </td>
      <td class="text-sm">
        {restrictedWorkspaces ? (
          <span title={restrictedWorkspaces.map((id) => workspaceMap.get(id) || id).join(', ')}>
            {restrictedWorkspaces.length} workspace{restrictedWorkspaces.length !== 1 ? 's' : ''}
          </span>
        ) : (
          <span class="text-muted">All</span>
        )}
      </td>
      <td class="text-sm">{relativeTime(apiKey.createdAt)}</td>
      <td class="text-sm">{apiKey.lastUsedAt ? relativeTime(apiKey.lastUsedAt) : 'never'}</td>
      <td class="text-sm">
        {apiKey.expiresAt ? new Date(apiKey.expiresAt).toLocaleDateString() : 'never'}
      </td>
      <td>
        <form
          method="post"
          action={`/pignal/api-keys/${apiKey.id}/delete`}
          hx-post={`/pignal/api-keys/${apiKey.id}/delete`}
          hx-target={`#key-${apiKey.id}`}
          hx-swap="outerHTML"
          hx-confirm="Are you sure? This cannot be undone."
        >
          <input type="hidden" name="_csrf" value={csrfToken} />
          <button type="submit" class="outline secondary text-xs px-3 py-1.5">
            Revoke
          </button>
        </form>
      </td>
    </tr>
  );
}

function PermissionCheckboxes() {
  return (
    <fieldset class="border border-border rounded-xl p-4 mt-2 mb-4">
      <legend><strong>Permissions</strong> <small class="text-muted">(uncheck what you don't need)</small></legend>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
        {PERMISSION_LIST.map((perm) => (
          <label class="flex items-start gap-2 cursor-pointer mb-0">
            <input
              type="checkbox"
              name="permissions"
              value={perm.value}
              aria-label={perm.label}
              checked
              class="mt-0.5"
            />
            <span class="flex flex-col leading-tight">
              <strong class="text-sm">{perm.label}</strong>
              <small class="text-muted text-xs">{perm.desc}</small>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function WorkspaceSelector({ workspaces }: { workspaces: WorkspaceSelect[] }) {
  if (workspaces.length === 0) return null;

  return (
    <fieldset class="border border-border rounded-xl p-4 mt-2 mb-4">
      <legend><strong>Workspace Access</strong></legend>
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

export async function apiKeysPage(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const csrfToken = getCsrfToken(c);
  const apiKeyStore = c.get('apiKeyStore');
  const store = c.get('store');
  const [keys, workspaces] = await Promise.all([apiKeyStore.list(), store.listWorkspaces()]);

  const workspaceMap = new Map(workspaces.map((ws) => [ws.id, ws.name]));

  return c.html(
    <AppLayout
      title="API Keys"
      currentPath="/pignal/api-keys"
      csrfToken={csrfToken}
    >
      <div class="mb-8">
        <h1 class="text-2xl font-bold tracking-tight">API Keys</h1>
        <p class="text-muted text-sm mt-1">Create and manage API keys for programmatic access</p>
      </div>

      <div class="border-2 border-dashed border-border hover:border-primary/30 transition-colors rounded-xl p-6 mb-8">
        <h2 class="text-base font-semibold mb-4">Create New Key</h2>
        <form
          method="post"
          action="/pignal/api-keys"
          hx-post="/pignal/api-keys"
          hx-target="#key-result"
          hx-swap="innerHTML"
        >
          <input type="hidden" name="_csrf" value={csrfToken} />

          <div class="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 mb-4">
            <div>
              <label for="key-name">Key Name</label>
              <input
                type="text"
                id="key-name"
                name="name"
                placeholder="e.g., federation, claude-desktop"
                required
                minlength={1}
                maxlength={100}
              />
            </div>
            <div>
              <label for="key-expiry">Expiry</label>
              <select id="key-expiry" name="expiryDays" class="min-w-[140px]">
                <option value="">No expiry</option>
                <option value="30">30 days</option>
                <option value="90" selected>90 days</option>
                <option value="365">1 year</option>
              </select>
            </div>
          </div>

          <PermissionCheckboxes />
          <WorkspaceSelector workspaces={workspaces} />

          <button type="submit" class="mt-4">Create Key</button>
        </form>
        <div id="key-result"></div>
      </div>

      <div class="bg-surface rounded-xl border border-border-subtle shadow-card p-6 sm:p-8">
        <h2 class="text-lg font-semibold mb-4">Active Keys</h2>
        {keys.length === 0 ? (
          <div class="empty-state text-center py-12">
            <svg class="mx-auto mb-4 text-muted/40" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
            </svg>
            <p class="text-muted font-medium" id="keys-empty">No API keys created yet.</p>
            <p class="text-muted text-sm mt-1">Create one above to get started.</p>
          </div>
        ) : (
          <div class="overflow-x-auto -mx-6 sm:-mx-8 px-6 sm:px-8">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Permissions</th>
                  <th>Workspaces</th>
                  <th>Created</th>
                  <th>Last Used</th>
                  <th>Expires</th>
                  <th></th>
                </tr>
              </thead>
              <tbody id="keys-list">
                {keys.map((k) => (
                  <ApiKeyRow apiKey={k} csrfToken={csrfToken} workspaceMap={workspaceMap} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export async function createApiKeyHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const body = await c.req.parseBody({ all: true });
  const name = (body.name as string)?.trim();
  const expiryDays = body.expiryDays ? parseInt(body.expiryDays as string, 10) : undefined;

  if (!name) {
    if (isHtmxRequest(c)) {
      c.header('HX-Trigger', toastTrigger('Key name is required', 'error'));
      return c.html(<span></span>);
    }
    return c.redirect('/pignal/api-keys?error=missing_name');
  }

  // Parse selected permissions from checkboxes
  const rawPermissions = body.permissions;
  const selectedPermissions: string[] = Array.isArray(rawPermissions)
    ? rawPermissions as string[]
    : rawPermissions
      ? [rawPermissions as string]
      : [];

  if (selectedPermissions.length === 0) {
    if (isHtmxRequest(c)) {
      c.header('HX-Trigger', toastTrigger('At least one permission is required', 'error'));
      return c.html(<span></span>);
    }
    return c.redirect('/pignal/api-keys?error=missing_permissions');
  }

  // Parse workspace restriction — all checked = unrestricted (null)
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
    allWorkspacesSelected || selectedWorkspaceIds.length === 0 ? null : selectedWorkspaceIds
  );

  if (isHtmxRequest(c)) {
    c.header('HX-Trigger', toastTrigger('API key created'));
    return c.html(
      <div class="bg-success-bg border border-success-border rounded-lg p-4 mt-2" role="alert">
        <p>
          <strong>API key created.</strong> Copy it now — it won't be shown again.
        </p>
        <div class="flex items-center gap-2 mt-2">
          <code id="raw-key-value" class="flex-1 break-all text-sm">{rawKey}</code>
          <button
            type="button"
            class="outline text-xs px-3 py-1.5"
            onclick="navigator.clipboard.writeText(document.getElementById('raw-key-value').textContent).then(()=>{this.textContent='Copied!'})"
          >
            Copy
          </button>
        </div>
        <p class="text-sm text-muted mt-2">
          Use this key as a Bearer token:{' '}
          <code>Authorization: Bearer {rawKey.slice(0, 12)}...</code>
        </p>
        <div class="text-sm text-muted mt-1">
          Permissions: {selectedPermissions.join(', ')}
          {!allWorkspacesSelected && selectedWorkspaceIds.length > 0 && (
            <span> | Workspaces: {selectedWorkspaceIds.length} restricted</span>
          )}
        </div>
        <p class="text-sm text-muted mt-2">
          <a href="/pignal/api-keys">Refresh page</a> to see the key in the list.
        </p>
      </div>
    );
  }
  return c.redirect('/pignal/api-keys');
}

export async function deleteApiKeyHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const id = c.req.param('id')!;
  const apiKeyStore = c.get('apiKeyStore');

  const deleted = await apiKeyStore.delete(id);

  if (isHtmxRequest(c)) {
    if (deleted) {
      c.header('HX-Trigger', toastTrigger('API key revoked'));
    } else {
      c.header('HX-Trigger', toastTrigger('Key not found', 'error'));
    }
    return c.html(<span></span>);
  }
  return c.redirect('/pignal/api-keys');
}
