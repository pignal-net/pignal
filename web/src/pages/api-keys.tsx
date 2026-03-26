import type { Context } from 'hono';
import type { ApiKeyInfo, WorkspaceSelect } from '@pignal/db';
import type { ApiKeyStore } from '@pignal/core/store/api-keys';
import type { WebEnv, WebVars } from '../types';
import type { TFunction } from '@pignal/render/i18n/types';
import { VALID_PERMISSIONS } from '@pignal/core/auth/permissions';

type PageVars = WebVars & { apiKeyStore: ApiKeyStore };
import { AppLayout } from '../components/app-layout';
import { PageHeader } from '../components/page-header';
import { ManagedList, TableResultsWrapper } from '../components/managed-list';
import type { SortTab, BulkAction, TableColumn } from '../components/managed-list';
import type { RowAction } from '../components/feed-item';
import { TableRow, TableCell, TableActions, RowActions } from '../components/feed-item';
import { FormDropdown } from '../components/form-dropdown';
import { getCsrfToken } from '../middleware/csrf';
import { isHtmxRequest, toastTrigger } from '../lib/htmx';
import { relativeTime } from '@pignal/render/lib/time';

/** Human-readable labels for each permission, using i18n. */
function getPermissionMeta(t: TFunction): Record<string, { label: string; desc: string }> {
  return {
    save_item: { label: t('apiKeys.permission.saveItem'), desc: t('apiKeys.permission.saveItemDesc') },
    list_items: { label: t('apiKeys.permission.listItems'), desc: t('apiKeys.permission.listItemsDesc') },
    edit_item: { label: t('apiKeys.permission.editItem'), desc: t('apiKeys.permission.editItemDesc') },
    delete_item: { label: t('apiKeys.permission.deleteItem'), desc: t('apiKeys.permission.deleteItemDesc') },
    validate_item: { label: t('apiKeys.permission.validateItem'), desc: t('apiKeys.permission.validateItemDesc') },
    get_metadata: { label: t('apiKeys.permission.getMetadata'), desc: t('apiKeys.permission.getMetadataDesc') },
    manage_types: { label: t('apiKeys.permission.manageTypes'), desc: t('apiKeys.permission.manageTypesDesc') },
    manage_workspaces: { label: t('apiKeys.permission.manageWorkspaces'), desc: t('apiKeys.permission.manageWorkspacesDesc') },
    manage_settings: { label: t('apiKeys.permission.manageSettings'), desc: t('apiKeys.permission.manageSettingsDesc') },
    manage_actions: { label: t('apiKeys.permission.manageActions'), desc: t('apiKeys.permission.manageActionsDesc') },
  };
}

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

function getApiKeyColumns(t: TFunction): TableColumn[] {
  return [
    { key: 'name', label: t('apiKeys.column.name') },
    { key: 'permissions', label: t('apiKeys.column.permissions') },
    { key: 'workspace', label: t('apiKeys.column.workspace') },
    { key: 'created', label: t('apiKeys.column.created'), class: 'text-muted whitespace-nowrap' },
    { key: 'lastUsed', label: t('apiKeys.column.lastUsed'), class: 'text-muted whitespace-nowrap' },
    { key: 'expires', label: t('apiKeys.column.expires'), class: 'text-muted whitespace-nowrap' },
  ];
}

function ApiKeyTableRow({ apiKey, csrfToken, t }: { apiKey: ApiKeyInfo; csrfToken: string; t: TFunction }) {
  const perms = apiKey.scopes.split(',').filter(Boolean);
  const isExpired = apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date();
  const permsSummary = perms.length <= 3
    ? perms.join(', ')
    : `${perms.slice(0, 2).join(', ')} +${perms.length - 2} more`;

  return (
    <TableRow id={`key-${apiKey.id}`} bulkValue={apiKey.id}>
      <TableCell>
        <span class="font-medium">{apiKey.name}</span>
        {isExpired && <span class="text-xs text-error ml-1">{t('common.expired')}</span>}
      </TableCell>
      <TableCell class="text-xs">{permsSummary}</TableCell>
      <TableCell class="text-xs text-muted">{apiKey.workspaceIds ? t('apiKeys.workspaceRestricted') : t('apiKeys.workspaceAll')}</TableCell>
      <TableCell class="text-muted whitespace-nowrap">{relativeTime(apiKey.createdAt)}</TableCell>
      <TableCell class="text-muted whitespace-nowrap">{apiKey.lastUsedAt ? relativeTime(apiKey.lastUsedAt) : '\u2014'}</TableCell>
      <TableCell class="text-muted whitespace-nowrap">{apiKey.expiresAt ? new Date(apiKey.expiresAt).toLocaleDateString() : t('apiKeys.neverExpires')}</TableCell>
      <TableActions>
        <RowActions actions={[
          { label: t('apiKeys.action.revoke'), hxPost: `/pignal/api-keys/${apiKey.id}/delete`, hxTarget: `#key-${apiKey.id}`, hxSwap: 'delete', hxConfirm: t('apiKeys.bulk.confirmRevoke'), destructive: true, csrf: csrfToken },
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
  t,
}: {
  keys: ApiKeyInfo[];
  csrfToken: string;
  t: TFunction;
}) {
  const columns = getApiKeyColumns(t);
  const colCount = columns.length + 2; // +1 bulk checkbox, +1 actions
  return (
    <TableResultsWrapper id="keys" columns={columns} hasBulk>
      <tbody id="keys-feed" class="managed-table-body">
        {keys.length === 0 ? (
          <tr><td colspan={colCount} class="managed-table-td text-center py-8 text-muted">{t('apiKeys.empty')}</td></tr>
        ) : (
          keys.map((k) => (
            <ApiKeyTableRow apiKey={k} csrfToken={csrfToken} t={t} />
          ))
        )}
      </tbody>
    </TableResultsWrapper>
  );
}

// ---------------------------------------------------------------------------
// Main page handler
// ---------------------------------------------------------------------------

export async function apiKeysPage(c: Context<{ Bindings: WebEnv; Variables: PageVars }>) {
  const t = c.get('t');
  const locale = c.get('locale');
  const defaultLocale = c.get('defaultLocale');
  const csrfToken = getCsrfToken(c);
  const apiKeyStore = c.get('apiKeyStore');
  const sort = c.req.query('sort') || 'newest';

  c.header('Vary', 'HX-Request');

  const keys = await apiKeyStore.list();
  const sorted = sortKeys(keys, sort);

  // HTMX partial
  if (isHtmxRequest(c)) {
    return c.html(<ApiKeyTableResults keys={sorted} csrfToken={csrfToken} t={t} />);
  }

  const columns = getApiKeyColumns(t);

  const sortTabs: SortTab[] = [
    { label: t('common.newest'), value: 'newest', active: sort === 'newest', href: '/pignal/api-keys' },
    { label: t('common.oldest'), value: 'oldest', active: sort === 'oldest', href: '/pignal/api-keys?sort=oldest' },
  ];

  const bulkActions: BulkAction[] = [
    { label: t('apiKeys.bulk.revoke'), action: '/pignal/api-keys/bulk-revoke', confirm: t('apiKeys.bulk.confirmRevoke'), destructive: true },
  ];

  return c.html(
    <AppLayout title={t('apiKeys.title')} currentPath="/pignal/api-keys" csrfToken={csrfToken} t={t} locale={locale} defaultLocale={defaultLocale} visitor={c.get("visitor")}>
      <PageHeader
        title={t('apiKeys.title')}
        description={t('apiKeys.description')}
        count={keys.length}
      />

      <ManagedList
        id="keys"
        sortTabs={sortTabs}
        bulkActions={bulkActions}
        csrfToken={csrfToken}
        totalCount={sorted.length}
        emptyMessage={t('apiKeys.emptyMessage')}
        pushUrl
        display="table"
        columns={columns}
        addButton={
          <button
            class="outline btn-sm ml-auto"
            hx-get="/pignal/api-keys/add-form"
            hx-target="#app-dialog-content"
          >
            {t('common.add')}
          </button>
        }
      >
        {sorted.map((k) => (
          <ApiKeyTableRow apiKey={k} csrfToken={csrfToken} t={t} />
        ))}
      </ManagedList>
    </AppLayout>,
  );
}

// ---------------------------------------------------------------------------
// Add form dialog
// ---------------------------------------------------------------------------

function PermissionCheckboxes({ t }: { t: TFunction }) {
  const permissionMeta = getPermissionMeta(t);
  return (
    <fieldset class="border border-border rounded-xl p-4 mt-3">
      <legend class="text-sm font-semibold px-1">{t('apiKeys.create.permissions')}</legend>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
        {VALID_PERMISSIONS.map((perm) => {
          const meta = permissionMeta[perm] ?? { label: perm, desc: '' };
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

function WorkspaceSelector({ workspaces, t }: { workspaces: WorkspaceSelect[]; t: TFunction }) {
  if (workspaces.length === 0) return null;
  return (
    <fieldset class="border border-border rounded-xl p-4 mt-3">
      <legend class="text-sm font-semibold px-1">{t('apiKeys.create.workspaceAccess')}</legend>
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

export async function addApiKeyFormHandler(c: Context<{ Bindings: WebEnv; Variables: PageVars }>) {
  const t = c.get('t');
  const csrfToken = getCsrfToken(c);
  const store = c.get('store');
  const workspaces = await store.listWorkspaces();

  return c.html(
    <div>
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">{t('apiKeys.create.title')}</h3>
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
            {t('apiKeys.create.keyName')}
            <input type="text" name="name" required maxlength={100} placeholder={t('apiKeys.create.keyNamePlaceholder')} />
          </label>
          <label>
            {t('apiKeys.create.expiry')}
            <FormDropdown
              name="expiryDays"
              value="90"
              options={[
                { value: '30', label: t('apiKeys.create.expiry30Days') },
                { value: '90', label: t('apiKeys.create.expiry90Days') },
                { value: '365', label: t('apiKeys.create.expiry1Year') },
                { value: '', label: t('apiKeys.create.expiryNever') },
              ]}
            />
          </label>
        </div>

        <PermissionCheckboxes t={t} />
        <WorkspaceSelector workspaces={workspaces} t={t} />

        <button type="submit" class="btn mt-4 w-full">{t('apiKeys.create.button')}</button>
      </form>
    </div>,
  );
}

// ---------------------------------------------------------------------------
// Create API key handler — shows raw key in dialog
// ---------------------------------------------------------------------------

export async function createApiKeyHandler(c: Context<{ Bindings: WebEnv; Variables: PageVars }>) {
  const t = c.get('t');
  const body = await c.req.parseBody({ all: true });
  const name = (body.name as string)?.trim();
  const expiryDays = body.expiryDays ? parseInt(body.expiryDays as string, 10) : undefined;

  if (!name) {
    c.header('HX-Trigger', toastTrigger(t('apiKeys.error.nameRequired'), 'error'));
    return c.html(<p class="text-error text-sm">{t('apiKeys.error.nameRequired')}</p>);
  }

  const rawPermissions = body.permissions;
  const selectedPermissions: string[] = Array.isArray(rawPermissions)
    ? rawPermissions as string[]
    : rawPermissions
      ? [rawPermissions as string]
      : [];

  if (selectedPermissions.length === 0) {
    c.header('HX-Trigger', toastTrigger(t('apiKeys.error.permissionRequired'), 'error'));
    return c.html(<p class="text-error text-sm">{t('apiKeys.error.permissionRequired')}</p>);
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

  c.header('HX-Trigger', toastTrigger(t('apiKeys.success.title')));

  return c.html(
    <div>
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">{t('apiKeys.success.title')}</h3>
        <button type="button" class="dialog-close" data-close-dialog>&times;</button>
      </div>
      <div class="bg-success-bg border border-success-border rounded-lg p-4">
        <p class="font-semibold">{t('apiKeys.success.message')}</p>
        <div class="flex items-center gap-2 mt-3">
          <code id="raw-key-value" class="flex-1 break-all text-sm bg-surface-raised px-3 py-2 rounded">{rawKey}</code>
          <button
            type="button"
            class="outline btn-sm"
            onclick={`navigator.clipboard.writeText(document.getElementById('raw-key-value').textContent).then(()=>{this.textContent='${t('apiKeys.success.copied')}'})`}
          >
            {t('apiKeys.success.copy')}
          </button>
        </div>
        <p class="text-sm text-muted mt-3">
          {t('apiKeys.success.usage', { key: rawKey.slice(0, 12) })}
        </p>
        <div class="text-sm text-muted mt-1">
          {t('apiKeys.success.permissions', { permissions: selectedPermissions.join(', ') })}
          {!allWorkspacesSelected && selectedWorkspaceIds.length > 0 && (
            <span> | {t('apiKeys.success.workspaceRestriction', { count: selectedWorkspaceIds.length })}</span>
          )}
        </div>
      </div>
      <p class="text-sm text-muted mt-4 text-center">
        <a href="/pignal/api-keys">{t('apiKeys.success.refreshPage')}</a>
      </p>
    </div>,
  );
}

// ---------------------------------------------------------------------------
// Delete single key
// ---------------------------------------------------------------------------

export async function deleteApiKeyHandler(c: Context<{ Bindings: WebEnv; Variables: PageVars }>) {
  const t = c.get('t');
  const id = c.req.param('id')!;
  const apiKeyStore = c.get('apiKeyStore');

  const deleted = await apiKeyStore.delete(id);
  if (deleted) {
    c.header('HX-Trigger', toastTrigger(t('apiKeys.toast.revoked')));
  } else {
    c.header('HX-Trigger', toastTrigger(t('apiKeys.toast.notFound'), 'error'));
  }
  return c.html('');
}

// ---------------------------------------------------------------------------
// Bulk revoke
// ---------------------------------------------------------------------------

export async function bulkRevokeApiKeysHandler(c: Context<{ Bindings: WebEnv; Variables: PageVars }>) {
  const t = c.get('t');
  const apiKeyStore = c.get('apiKeyStore');
  const body = await c.req.parseBody({ all: true });
  const rawIds = body['ids[]'];
  const ids: string[] = Array.isArray(rawIds) ? rawIds as string[] : rawIds ? [rawIds as string] : [];

  if (ids.length === 0) {
    c.header('HX-Trigger', toastTrigger(t('common.noResults'), 'error'));
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

  c.header('HX-Trigger', toastTrigger(t('apiKeys.bulk.revokedToast', { count: revoked })));

  // Re-render the full list
  const csrfToken = getCsrfToken(c);
  const keys = await apiKeyStore.list();
  const sorted = sortKeys(keys, 'newest');
  return c.html(<ApiKeyTableResults keys={sorted} csrfToken={csrfToken} t={t} />);
}
