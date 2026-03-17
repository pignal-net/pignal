import type { Context } from 'hono';
import type { ApiKeyInfo, WorkspaceSelect } from '@pignal/db';
import type { ApiKeyStore } from '@pignal/core/store/api-keys';
import type { SignalStoreRpc } from '@pignal/db';
import type { WebEnv } from '../types';
import { AppLayout } from '../components/app-layout';
import { getCsrfToken } from '../middleware/csrf';
import { isHtmxRequest, toastTrigger } from '../lib/htmx';

type WebVars = { apiKeyStore: ApiKeyStore; store: SignalStoreRpc };

/** Flat permission list for the UI. Each maps to a specific API/tool capability. */
const PERMISSION_LIST = [
  { value: 'save_signal', label: 'Save Signal', desc: 'Create new signals via REST API or MCP' },
  { value: 'list_signals', label: 'List Signals', desc: 'List, view, and search signals' },
  { value: 'edit_signal', label: 'Edit Signal', desc: 'Update, archive/unarchive, and vouch signals' },
  { value: 'delete_signal', label: 'Delete Signal', desc: 'Permanently delete signals' },
  { value: 'validate_signal', label: 'Validate Signal', desc: 'Apply validation actions to signals' },
  { value: 'get_metadata', label: 'Get Metadata', desc: 'View types, workspaces, stats, and settings' },
  { value: 'manage_types', label: 'Manage Types', desc: 'Create, update, and delete signal types' },
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
    <span class="permission-badge" title={permission}>
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
        {isExpired && <span class="muted" style="margin-left: 0.5rem">(expired)</span>}
      </td>
      <td>
        <div class="permission-badges">
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
          <span class="muted">All</span>
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
          <button type="submit" class="outline secondary btn-sm">
            Revoke
          </button>
        </form>
      </td>
    </tr>
  );
}

function PermissionCheckboxes() {
  return (
    <fieldset class="permission-selector">
      <legend><strong>Permissions</strong> <small class="muted">(uncheck what you don't need)</small></legend>
      <div class="permission-list">
        {PERMISSION_LIST.map((perm) => (
          <label class="permission-option">
            <input
              type="checkbox"
              name="permissions"
              value={perm.value}
              aria-label={perm.label}
              checked
            />
            <span>
              <strong>{perm.label}</strong>
              <small class="muted">{perm.desc}</small>
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
    <fieldset class="workspace-selector">
      <legend><strong>Workspace Access</strong></legend>
      <input type="hidden" name="totalWorkspaces" value={String(workspaces.length)} />
      <div class="workspace-options">
        {workspaces.map((ws) => (
          <label class="workspace-option">
            <input type="checkbox" name="workspaceIds" value={ws.id} checked />
            <span>
              <strong>{ws.name}</strong>
              {ws.description && <small class="muted">{ws.description}</small>}
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
      <style>{pageStyles}</style>

      <section>
        <h2>Create New Key</h2>
        <form
          method="post"
          action="/pignal/api-keys"
          hx-post="/pignal/api-keys"
          hx-target="#key-result"
          hx-swap="innerHTML"
        >
          <input type="hidden" name="_csrf" value={csrfToken} />

          <div class="key-form-grid">
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
              <select id="key-expiry" name="expiryDays">
                <option value="">No expiry</option>
                <option value="30">30 days</option>
                <option value="90" selected>90 days</option>
                <option value="365">1 year</option>
              </select>
            </div>
          </div>

          <PermissionCheckboxes />
          <WorkspaceSelector workspaces={workspaces} />

          <button type="submit" style="margin-top: 1rem">Create Key</button>
        </form>
        <div id="key-result"></div>
      </section>

      <section>
        <h2>Active Keys</h2>
        {keys.length === 0 ? (
          <p class="muted" id="keys-empty">
            No API keys created yet.
          </p>
        ) : (
          <div style="overflow-x: auto">
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
      </section>
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
      <div class="key-created-callout" role="alert">
        <p>
          <strong>API key created.</strong> Copy it now — it won't be shown again.
        </p>
        <div class="key-display">
          <code id="raw-key-value">{rawKey}</code>
          <button
            type="button"
            class="outline btn-sm"
            onclick="navigator.clipboard.writeText(document.getElementById('raw-key-value').textContent).then(()=>{this.textContent='Copied!'})"
          >
            Copy
          </button>
        </div>
        <p class="text-sm muted" style="margin-top: 0.5rem">
          Use this key as a Bearer token:{' '}
          <code>Authorization: Bearer {rawKey.slice(0, 12)}...</code>
        </p>
        <div class="text-sm muted" style="margin-top: 0.25rem">
          Permissions: {selectedPermissions.join(', ')}
          {!allWorkspacesSelected && selectedWorkspaceIds.length > 0 && (
            <span> | Workspaces: {selectedWorkspaceIds.length} restricted</span>
          )}
        </div>
        <p class="text-sm muted" style="margin-top: 0.5rem">
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

/** Inline styles for permission selector — keeps styling co-located with the component. */
const pageStyles = `
.key-form-grid {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 1rem;
  margin-bottom: 1rem;
}
.key-form-grid select { min-width: 140px; }
@media (max-width: 600px) {
  .key-form-grid { grid-template-columns: 1fr; }
}

.permission-selector {
  margin-top: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
  border: 1px solid var(--pico-muted-border-color);
  border-radius: var(--pico-border-radius);
}
.permission-selector legend {
  font-size: 0.95rem;
  padding: 0 0.35rem;
}

.permission-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.permission-option {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  cursor: pointer;
  margin-bottom: 0;
}
.permission-option input[type="checkbox"] {
  margin-top: 0.2rem;
  margin-bottom: 0;
}
.permission-option span {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}
.permission-option small {
  font-size: 0.75rem;
}

.workspace-selector {
  margin-top: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
  border: 1px solid var(--pico-muted-border-color);
  border-radius: var(--pico-border-radius);
}
.workspace-selector legend {
  font-size: 0.95rem;
  padding: 0 0.35rem;
}

.workspace-options {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.5rem;
}

.workspace-option {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  cursor: pointer;
  margin-bottom: 0;
}
.workspace-option input[type="checkbox"] {
  margin-top: 0.2rem;
  margin-bottom: 0;
}

.permission-badges {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}
.permission-badge {
  display: inline-block;
  font-size: 0.65rem;
  font-weight: 600;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  white-space: nowrap;
  color: var(--app-info, #7C3AED);
  border: 1px solid var(--app-info-border, color-mix(in srgb, #7C3AED 25%, transparent));
  background: var(--app-info-bg, color-mix(in srgb, #7C3AED 10%, transparent));
}

.key-created-callout {
  background: var(--app-success-bg);
  border: 1px solid var(--app-success-border);
  border-radius: var(--pico-border-radius);
  padding: 1rem;
  margin-top: 0.5rem;
}
.key-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}
.key-display code {
  flex: 1;
  word-break: break-all;
  font-size: 0.85rem;
}
`;
