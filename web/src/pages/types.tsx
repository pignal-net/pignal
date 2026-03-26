import type { Context } from 'hono';
import type { ItemTypeWithActions, TypeGuidance } from '@pignal/db';
import type { WebEnv, WebVars } from '../types';
import type { TFunction } from '@pignal/render/i18n/types';
import type { BulkAction, TableColumn } from '../components/managed-list';
import { AppLayout } from '../components/app-layout';
import { PageHeader } from '../components/page-header';
import { ManagedList, TableResultsWrapper } from '../components/managed-list';
import type { RowAction } from '../components/feed-item';
import { TableRow, TableCell, TableActions, RowActions } from '../components/feed-item';
import { Pagination } from '@pignal/render/components/pagination';
import { relativeTime } from '@pignal/render/lib/time';
import { getCsrfToken } from '../middleware/csrf';
import { isHtmxRequest, toastTrigger } from '../lib/htmx';

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
  return '/pignal/types' + (s ? `?${s}` : '');
}

function sortTypes(list: ItemTypeWithActions[], sort: string): ItemTypeWithActions[] {
  return [...list].sort((a, b) => {
    if (sort === 'oldest') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function filterTypes(list: ItemTypeWithActions[], q: string): ItemTypeWithActions[] {
  if (!q) return list;
  const lower = q.toLowerCase();
  return list.filter((t) =>
    t.name.toLowerCase().includes(lower) ||
    (t.description && t.description.toLowerCase().includes(lower))
  );
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max) + '...';
}

function parseGuidanceFromBody(body: Record<string, unknown>): TypeGuidance | null {
  const whenToUse = ((body.guidance_whenToUse as string) || '').trim();
  const pattern = ((body.guidance_pattern as string) || '').trim();
  const example = ((body.guidance_example as string) || '').trim();
  const contentHints = ((body.guidance_contentHints as string) || '').trim();

  if (!whenToUse && !pattern && !example && !contentHints) {
    return null;
  }

  return {
    ...(whenToUse ? { whenToUse } : {}),
    ...(pattern ? { pattern } : {}),
    ...(example ? { example } : {}),
    ...(contentHints ? { contentHints } : {}),
  };
}

function typeColumns(t: TFunction): TableColumn[] {
  return [
    { key: 'name', label: t('types.column.name') },
    { key: 'color', label: t('types.column.color') },
    { key: 'actions', label: t('types.column.actions') },
    { key: 'guidance', label: t('types.column.guidance') },
    { key: 'created', label: t('types.column.created'), class: 'text-muted whitespace-nowrap' },
  ];
}

function TypeTableRow({ type, csrfToken, t }: { type: ItemTypeWithActions; csrfToken: string; t: TFunction }) {
  const actionLabels = type.actions.map((a) => a.label).join(', ');
  const guidancePreview = type.guidance
    ? truncate(type.guidance.whenToUse || type.guidance.pattern || type.guidance.example || '', 60)
    : null;

  return (
    <TableRow id={`type-${type.id}`} bulkValue={type.isSystem ? undefined : type.id}>
      <TableCell>
        <span class="flex items-center gap-1.5">
          {type.color && (
            <span class="w-3 h-3 rounded-full inline-block shrink-0" style={`background:${type.color}`} />
          )}
          <span class="font-medium text-text">{type.name}</span>
        </span>
      </TableCell>
      <TableCell>
        {type.color
          ? <span class="inline-block w-6 h-6 rounded border border-border" style={`background:${type.color}`} />
          : <span class="text-muted">{'\u2014'}</span>}
      </TableCell>
      <TableCell class="text-muted text-xs">{actionLabels || '\u2014'}</TableCell>
      <TableCell class="text-muted text-xs">{guidancePreview ?? '\u2014'}</TableCell>
      <TableCell class="text-muted whitespace-nowrap">{relativeTime(type.createdAt)}</TableCell>
      <TableActions>
        <RowActions actions={[
          ...(!type.isSystem ? [
            { label: t('types.action.edit'), hxGet: `/pignal/types/${type.id}/edit-form` },
            {
              label: t('types.action.delete'),
              hxPost: `/pignal/types/${type.id}/delete`,
              hxTarget: `#type-${type.id}`,
              hxSwap: 'delete',
              hxConfirm: t('types.confirmDelete'),
              destructive: true,
              csrf: csrfToken,
            },
          ] satisfies RowAction[] : []),
        ]} />
      </TableActions>
    </TableRow>
  );
}

function renderTableResults(list: ItemTypeWithActions[], total: number, params: ReturnType<typeof parseParams>, csrfToken: string, t: TFunction) {
  const baseUrl = buildBaseUrl(params);
  const cols = typeColumns(t);

  return (
    <>
      <TableResultsWrapper id="types" columns={cols} hasBulk>
        <tbody id="types-feed" class="managed-table-body">
          {total === 0 ? (
            <tr><td colspan={cols.length + 2} class="managed-table-td text-center py-8 text-muted">{t('types.empty')}</td></tr>
          ) : (
            list.map((tp) => <TypeTableRow type={tp} csrfToken={csrfToken} t={t} />)
          )}
        </tbody>
      </TableResultsWrapper>
      {total > params.limit && (
        <Pagination
          total={total}
          limit={params.limit}
          offset={params.offset}
          baseUrl={baseUrl}
          htmxTarget="#types-results"
          htmxIndicator="#types-loading"
        />
      )}
    </>
  );
}

export async function typesPage(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const store = c.get('store');
  const csrfToken = getCsrfToken(c);
  const t = c.get('t');
  const locale = c.get('locale');
  const defaultLocale = c.get('defaultLocale');
  const params = parseParams(c);

  c.header('Vary', 'HX-Request');

  const allTypes = await store.listTypes();
  const filtered = filterTypes(allTypes, params.q);
  const sorted = sortTypes(filtered, params.sort);
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
    { label: t('types.bulk.delete'), action: '/pignal/types/bulk/delete', confirm: t('types.bulk.confirmDelete'), destructive: true },
  ];

  return c.html(
    <AppLayout title={t('types.title')} currentPath="/pignal/types" csrfToken={csrfToken} t={t} locale={locale} defaultLocale={defaultLocale}>
      <PageHeader title={t('types.title')} description={t('types.description')} count={total} />

      <ManagedList
        id="types"
        searchEndpoint="/pignal/types"
        searchPlaceholder={t('types.searchPlaceholder')}
        query={params.q}
        sortTabs={sortTabs}
        bulkActions={bulkActions}
        csrfToken={csrfToken}
        totalCount={total}
        emptyMessage={t('types.emptyMessage')}
        pagination={{ total, limit: params.limit, offset: params.offset, baseUrl: buildBaseUrl(params) }}
        pushUrl
        display="table"
        columns={typeColumns(t)}
        addButton={
          <button
            class="outline btn-sm"
            hx-get="/pignal/types/add-form"
            hx-target="#app-dialog-content"
          >
            {t('common.add')}
          </button>
        }
      >
        {paged.map((tp) => <TypeTableRow type={tp} csrfToken={csrfToken} t={t} />)}
      </ManagedList>
    </AppLayout>
  );
}

function TypeFormFields({ type, t }: { type?: ItemTypeWithActions; t: TFunction }) {
  const actionsText = type ? type.actions.map((a) => a.label).join('\n') : '';
  const hasGuidance = !!type?.guidance;

  return (
    <>
      <div class="mb-3">
        <label class="block text-sm font-medium text-text mb-1">{t('types.create.name')}</label>
        <input type="text" name="name" value={type?.name ?? ''} required maxlength={50} placeholder={t('types.create.namePlaceholder')} />
      </div>
      <div class="mb-3">
        <label class="block text-sm font-medium text-text mb-1">{t('types.create.color')}</label>
        <input type="color" name="color" value={type?.color ?? '#6B7280'} class="w-full h-10 rounded cursor-pointer" />
      </div>
      <div class="mb-3">
        <label class="block text-sm font-medium text-text mb-1">{t('types.create.description')}</label>
        <textarea name="description" rows={2} maxlength={500} placeholder={t('types.create.descriptionPlaceholder')}>{type?.description ?? ''}</textarea>
      </div>
      <div class="mb-3">
        <label class="block text-sm font-medium text-text mb-1">{t('types.create.actions')}</label>
        <textarea name="actions" rows={3} required placeholder={t('types.create.actionsPlaceholder')}>{actionsText}</textarea>
        <small class="text-muted text-xs">{t('types.create.actionsHelper')}</small>
      </div>
      <div class="mb-3">
        <label class="block text-sm font-medium text-text mb-1">{t('types.create.guidance')}</label>
        <details open={hasGuidance}>
          <summary class="text-sm cursor-pointer text-muted hover:text-text">{hasGuidance ? t('types.create.guidanceEdit') : t('types.create.guidanceAdd')}</summary>
          <div class="mt-2 space-y-3">
            <label class="block">
              {t('types.create.guidanceWhenToUse')}
              <input type="text" name="guidance_whenToUse" value={type?.guidance?.whenToUse ?? ''} maxlength={500} placeholder={t('types.create.guidanceWhenToUsePlaceholder')} />
            </label>
            <label class="block">
              {t('types.create.guidancePattern')}
              <input type="text" name="guidance_pattern" value={type?.guidance?.pattern ?? ''} maxlength={500} placeholder={t('types.create.guidancePatternPlaceholder')} />
            </label>
            <label class="block">
              {t('types.create.guidanceExample')}
              <textarea name="guidance_example" rows={2} placeholder={t('types.create.guidanceExamplePlaceholder')}>{type?.guidance?.example ?? ''}</textarea>
            </label>
            <label class="block">
              {t('types.create.guidanceContentHints')}
              <input type="text" name="guidance_contentHints" value={type?.guidance?.contentHints ?? ''} maxlength={500} placeholder={t('types.create.guidanceContentHintsPlaceholder')} />
            </label>
          </div>
        </details>
      </div>
    </>
  );
}

export async function addTypeFormHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const csrfToken = getCsrfToken(c);
  const t = c.get('t');

  return c.html(
    <div>
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">{t('types.create.title')}</h3>
        <button type="button" class="dialog-close" data-close-dialog>&times;</button>
      </div>
      <form
        method="post"
        action="/pignal/types"
        hx-post="/pignal/types"
        hx-target="#types-feed"
        hx-swap="afterbegin"
      >
        <input type="hidden" name="_csrf" value={csrfToken} />
        <TypeFormFields t={t} />
        <button type="submit" class="btn mt-4 w-full">{t('types.create.button')}</button>
      </form>
    </div>
  );
}

export async function createTypeHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const store = c.get('store');
  const csrfToken = getCsrfToken(c);
  const t = c.get('t');
  const body = await c.req.parseBody();

  const name = (body.name as string || '').trim();
  const description = (body.description as string || '').trim();
  const color = body.color as string || undefined;
  const actionsStr = (body.actions as string || '').trim();
  const guidance = parseGuidanceFromBody(body as Record<string, unknown>);

  if (!name || !actionsStr) {
    c.header('HX-Trigger', toastTrigger(t('types.error.nameRequired'), 'error'));
    c.header('HX-Reswap', 'none');
    return c.body(null, 204);
  }

  const actions = actionsStr
    .split(/[,\n]/)
    .map((a, i) => ({ label: a.trim(), sortOrder: i }))
    .filter((a) => a.label);

  if (actions.length === 0) {
    c.header('HX-Trigger', toastTrigger(t('types.error.actionsRequired'), 'error'));
    c.header('HX-Reswap', 'none');
    return c.body(null, 204);
  }

  try {
    const created = await store.createType({
      id: crypto.randomUUID(),
      name,
      description: description || undefined,
      color,
      guidance: guidance ?? undefined,
      actions,
    });

    c.header('HX-Trigger', JSON.stringify({
      closeDialog: true,
      showToast: { message: t('types.toast.created'), type: 'success' },
    }));
    return c.html(<TypeTableRow type={created} csrfToken={csrfToken} t={t} />);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create type';
    c.header('HX-Trigger', toastTrigger(msg, 'error'));
    c.header('HX-Reswap', 'none');
    return c.body(null, 204);
  }
}

export async function editTypeFormHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const store = c.get('store');
  const id = c.req.param('id')!;
  const csrfToken = getCsrfToken(c);
  const t = c.get('t');

  const type = await store.getType(id);
  if (!type) {
    c.header('HX-Trigger', toastTrigger(t('types.toast.notFound'), 'error'));
    return c.body(null, 204);
  }

  return c.html(
    <div>
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">{t('types.edit.title')}</h3>
        <button type="button" class="dialog-close" data-close-dialog>&times;</button>
      </div>
      <form
        method="post"
        action={`/pignal/types/${id}/edit`}
        hx-post={`/pignal/types/${id}/edit`}
        hx-target={`#type-${id}`}
        hx-swap="outerHTML"
      >
        <input type="hidden" name="_csrf" value={csrfToken} />
        <TypeFormFields type={type} t={t} />
        <button type="submit" class="btn mt-4 w-full">{t('types.edit.saveChanges')}</button>
      </form>
    </div>
  );
}

export async function editTypeHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const store = c.get('store');
  const id = c.req.param('id')!;
  const csrfToken = getCsrfToken(c);
  const t = c.get('t');
  const body = await c.req.parseBody();

  const name = (body.name as string || '').trim();
  const description = (body.description as string || '').trim();
  const color = (body.color as string || '').trim() || null;
  const guidance = parseGuidanceFromBody(body as Record<string, unknown>);

  if (!name) {
    c.header('HX-Trigger', toastTrigger(t('types.error.nameRequired'), 'error'));
    c.header('HX-Reswap', 'none');
    return c.body(null, 204);
  }

  try {
    const updated = await store.updateType(id, {
      name,
      description: description || undefined,
      color,
      guidance,
    });

    if (!updated) {
      c.header('HX-Trigger', toastTrigger(t('types.toast.notFound'), 'error'));
      c.header('HX-Reswap', 'none');
      return c.body(null, 204);
    }

    c.header('HX-Trigger', JSON.stringify({
      closeDialog: true,
      showToast: { message: t('types.toast.updated'), type: 'success' },
    }));
    return c.html(<TypeTableRow type={updated} csrfToken={csrfToken} t={t} />);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update type';
    c.header('HX-Trigger', toastTrigger(msg, 'error'));
    c.header('HX-Reswap', 'none');
    return c.body(null, 204);
  }
}

export async function deleteTypeHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const store = c.get('store');
  const id = c.req.param('id')!;
  const t = c.get('t');

  try {
    const deleted = await store.deleteType(id);
    if (!deleted) {
      c.header('HX-Trigger', toastTrigger(t('types.toast.notFound'), 'error'));
      c.header('HX-Reswap', 'none');
      return c.body(null, 204);
    }
    c.header('HX-Trigger', toastTrigger(t('types.toast.deleted')));
    return c.html('');
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to delete type';
    c.header('HX-Trigger', toastTrigger(msg, 'error'));
    c.header('HX-Reswap', 'none');
    return c.body(null, 204);
  }
}

export async function bulkDeleteTypesHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const store = c.get('store');
  const csrfToken = getCsrfToken(c);
  const t = c.get('t');
  const body = await c.req.parseBody();
  const ids = Array.isArray(body['ids[]']) ? body['ids[]'] as string[] : [body['ids[]'] as string].filter(Boolean);

  let deleted = 0;
  for (const id of ids) {
    const result = await store.deleteType(id);
    if (result) deleted++;
  }

  c.header('HX-Trigger', toastTrigger(t('types.bulk.deletedToast', { count: String(deleted) })));

  const params = parseParams(c);
  const allTypes = await store.listTypes();
  const filtered = filterTypes(allTypes, params.q);
  const sorted = sortTypes(filtered, params.sort);
  const total = sorted.length;
  const paged = sorted.slice(params.offset, params.offset + params.limit);

  return c.html(renderTableResults(paged, total, params, csrfToken, t));
}
