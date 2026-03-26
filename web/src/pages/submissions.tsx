import type { Context } from 'hono';
import type { ActionStoreRpc, SubmissionWithAction, SiteActionSelect, SubmissionStatus } from '@pignal/db';
import type { WebEnv, WebVars } from '../types';
import type { TFunction } from '@pignal/render/i18n/types';
import { AppLayout } from '../components/app-layout';
import { PageHeader } from '../components/page-header';
import { StatusBadge } from '../components/status-badge';
import { ManagedList, TableResultsWrapper } from '../components/managed-list';
import type { SortTab, FilterDropdown, BulkAction, TableColumn } from '../components/managed-list';
import type { RowAction } from '../components/feed-item';
import { TableRow, TableCell, TableActions, RowActions } from '../components/feed-item';
import { Pagination } from '@pignal/render/components/pagination';
import { getCsrfToken } from '../middleware/csrf';
import { isHtmxRequest, toastTrigger } from '../lib/htmx';
import { relativeTime } from '@pignal/render/lib/time';

type PageVars = WebVars & { actionStore: ActionStoreRpc };

const PAGE_SIZE = 20;

const VALID_STATUSES: SubmissionStatus[] = ['new', 'read', 'replied', 'archived', 'spam'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildUrl(params: Record<string, string | undefined>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) qs.set(k, v);
  }
  const s = qs.toString();
  return `/pignal/submissions${s ? `?${s}` : ''}`;
}

// ---------------------------------------------------------------------------
// Feed row
// ---------------------------------------------------------------------------

interface SiteActionFieldDef {
  name: string;
  label: string;
}

function dataPreview(data: Record<string, string>): string {
  return Object.entries(data).slice(0, 3)
    .map(([k, v]) => `${k}: ${v}`)
    .join(' \u00b7 ')
    .slice(0, 80);
}

function buildSubmissionColumns(previewFields: SiteActionFieldDef[], t: TFunction): TableColumn[] {
  if (previewFields.length > 0) {
    return [
      { key: 'action', label: t('submissions.column.action') },
      { key: 'status', label: t('submissions.column.status') },
      ...previewFields.map((f) => ({ key: f.name, label: f.label, class: 'max-w-[200px] truncate' })),
      { key: 'created', label: t('submissions.column.created'), class: 'text-muted whitespace-nowrap' },
    ];
  }
  return [
    { key: 'action', label: t('submissions.column.action') },
    { key: 'status', label: t('submissions.column.status') },
    { key: 'data', label: t('submissions.column.data'), class: 'max-w-[400px] truncate text-xs text-muted' },
    { key: 'created', label: t('submissions.column.created'), class: 'text-muted whitespace-nowrap' },
  ];
}

function SubmissionTableRow({
  submission,
  csrfToken,
  previewFields,
  t,
}: {
  submission: SubmissionWithAction;
  csrfToken: string;
  previewFields: SiteActionFieldDef[];
  t: TFunction;
}) {
  return (
    <TableRow id={`sub-${submission.id}`} bulkValue={submission.id}>
      <TableCell class="whitespace-nowrap">
        <span class="text-xs font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary">{submission.actionName}</span>
      </TableCell>
      <TableCell><StatusBadge status={submission.status} /></TableCell>
      {previewFields.length > 0
        ? previewFields.map((f) => (
            <TableCell class="max-w-[200px] truncate text-sm">{submission.data[f.name] ?? '\u2014'}</TableCell>
          ))
        : <TableCell class="max-w-[400px] truncate text-xs text-muted">{dataPreview(submission.data)}</TableCell>
      }
      <TableCell class="text-muted whitespace-nowrap">{relativeTime(submission.createdAt)}</TableCell>
      <TableActions>
        <RowActions actions={[
          ...(submission.status !== 'read' ? [
            { label: t('submissions.action.markRead'), hxPost: `/pignal/submissions/${submission.id}/status?status=read`, hxTarget: `#sub-${submission.id}`, csrf: csrfToken },
          ] satisfies RowAction[] : []),
          ...(submission.status !== 'replied' ? [
            { label: t('submissions.action.replied'), hxPost: `/pignal/submissions/${submission.id}/status?status=replied`, hxTarget: `#sub-${submission.id}`, csrf: csrfToken },
          ] satisfies RowAction[] : []),
          ...(submission.status !== 'archived' ? [
            { label: t('submissions.action.archive'), hxPost: `/pignal/submissions/${submission.id}/status?status=archived`, hxTarget: `#sub-${submission.id}`, csrf: csrfToken },
          ] satisfies RowAction[] : []),
          ...(submission.status !== 'spam' ? [
            { label: t('submissions.action.spam'), hxPost: `/pignal/submissions/${submission.id}/status?status=spam`, hxTarget: `#sub-${submission.id}`, destructive: true, csrf: csrfToken },
          ] satisfies RowAction[] : []),
          { label: t('submissions.action.delete'), hxPost: `/pignal/submissions/${submission.id}/delete`, hxTarget: `#sub-${submission.id}`, hxSwap: 'delete', hxConfirm: t('submissions.confirmDelete'), destructive: true, csrf: csrfToken },
        ]} />
      </TableActions>
    </TableRow>
  );
}

// ---------------------------------------------------------------------------
// Feed results partial (HTMX)
// ---------------------------------------------------------------------------

function SubmissionTableResults({
  submissions,
  total,
  limit,
  offset,
  baseUrl,
  csrfToken,
  previewFields,
  t,
}: {
  submissions: SubmissionWithAction[];
  total: number;
  limit: number;
  offset: number;
  baseUrl: string;
  csrfToken: string;
  previewFields: SiteActionFieldDef[];
  t: TFunction;
}) {
  const columns = buildSubmissionColumns(previewFields, t);
  const colCount = columns.length + 2; // +1 bulk checkbox, +1 actions
  return (
    <>
      <TableResultsWrapper id="submissions" columns={columns} hasBulk>
        <tbody id="submissions-feed" class="managed-table-body">
          {submissions.length === 0 ? (
            <tr><td colspan={colCount} class="managed-table-td text-center py-8 text-muted">{t('submissions.empty')}</td></tr>
          ) : (
            submissions.map((sub) => (
              <SubmissionTableRow submission={sub} csrfToken={csrfToken} previewFields={previewFields} t={t} />
            ))
          )}
        </tbody>
      </TableResultsWrapper>
      {total > limit && (
        <Pagination
          total={total}
          limit={limit}
          offset={offset}
          baseUrl={baseUrl}
          htmxTarget="#submissions-results"
          htmxIndicator="#submissions-loading"
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Main page handler
// ---------------------------------------------------------------------------

function parsePreviewFields(action: SiteActionSelect | undefined): SiteActionFieldDef[] {
  if (!action) return [];
  try {
    const fields = JSON.parse(action.fields);
    if (!Array.isArray(fields)) return [];
    return fields.slice(0, 3).map((f: { name: string; label: string }) => ({ name: f.name, label: f.label }));
  } catch {
    return [];
  }
}

export async function submissionsPage(c: Context<{ Bindings: WebEnv; Variables: PageVars }>) {
  const actionStore = c.get('actionStore');
  const csrfToken = getCsrfToken(c);
  const t = c.get('t');
  const locale = c.get('locale');
  const defaultLocale = c.get('defaultLocale');

  const q = (c.req.query('q') || '').trim();
  const sort = c.req.query('sort') || 'newest';
  const actionId = c.req.query('actionId') || undefined;
  const status = c.req.query('status') as SubmissionStatus | undefined;
  const offset = parseInt(c.req.query('offset') ?? '0', 10) || 0;

  c.header('Vary', 'HX-Request');

  const [result, actions] = await Promise.all([
    actionStore.listSubmissions({
      actionId,
      status: status && VALID_STATUSES.includes(status) ? status : undefined,
      limit: PAGE_SIZE,
      offset,
    }),
    actionStore.listActions(),
  ]);

  // Resolve preview fields from active action filter
  const activeAction = actionId ? actions.find((a: SiteActionSelect) => a.id === actionId) : undefined;
  const previewFields = parsePreviewFields(activeAction);

  // Client-side search filter on data fields
  let submissions = result.submissions;
  if (q) {
    const lower = q.toLowerCase();
    submissions = submissions.filter((sub) => {
      const actionMatch = sub.actionName.toLowerCase().includes(lower);
      const dataMatch = Object.values(sub.data).some(
        (v) => typeof v === 'string' && v.toLowerCase().includes(lower),
      );
      return actionMatch || dataMatch;
    });
  }

  // Sort
  if (sort === 'oldest') {
    submissions = [...submissions].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }

  const baseUrl = buildUrl({
    q: q || undefined,
    sort: sort !== 'newest' ? sort : undefined,
    actionId,
    status,
  });

  // HTMX partial
  if (isHtmxRequest(c)) {
    return c.html(
      <SubmissionTableResults
        submissions={submissions}
        total={result.total}
        limit={PAGE_SIZE}
        offset={offset}
        baseUrl={baseUrl}
        csrfToken={csrfToken}
        previewFields={previewFields}
        t={t}
      />,
    );
  }

  // Full page — build filters
  const columns = buildSubmissionColumns(previewFields, t);

  const sortTabs: SortTab[] = [
    { label: t('common.newest'), value: 'newest', active: sort === 'newest', href: buildUrl({ q: q || undefined, actionId, status }) },
    { label: t('common.oldest'), value: 'oldest', active: sort === 'oldest', href: buildUrl({ q: q || undefined, sort: 'oldest', actionId, status }) },
  ];

  const filterDropdowns: FilterDropdown[] = [];

  if (actions.length > 0) {
    filterDropdowns.push({
      label: t('submissions.filter.action'),
      name: 'actionId',
      options: [
        { label: t('common.all'), href: buildUrl({ q: q || undefined, sort: sort !== 'newest' ? sort : undefined, status }), active: !actionId },
        ...actions.map((a: SiteActionSelect) => ({
          label: a.name,
          href: buildUrl({ q: q || undefined, sort: sort !== 'newest' ? sort : undefined, actionId: a.id, status }),
          active: a.id === actionId,
        })),
      ],
    });
  }

  const statusLabels: Record<string, string> = {
    new: t('submissions.filter.new'),
    read: t('submissions.filter.read'),
    replied: t('submissions.filter.replied'),
    archived: t('submissions.filter.archived'),
    spam: t('submissions.filter.spam'),
  };

  filterDropdowns.push({
    label: t('submissions.filter.status'),
    name: 'status',
    options: [
      { label: t('common.all'), href: buildUrl({ q: q || undefined, sort: sort !== 'newest' ? sort : undefined, actionId }), active: !status },
      ...VALID_STATUSES.map((s) => ({
        label: statusLabels[s] ?? s,
        href: buildUrl({ q: q || undefined, sort: sort !== 'newest' ? sort : undefined, actionId, status: s }),
        active: s === status,
      })),
    ],
  });

  const bulkActions: BulkAction[] = [
    { label: t('submissions.bulk.markRead'), action: '/pignal/submissions/bulk-read' },
    { label: t('submissions.bulk.archive'), action: '/pignal/submissions/bulk-archive' },
    { label: t('submissions.bulk.spam'), action: '/pignal/submissions/bulk-spam' },
    { label: t('submissions.bulk.delete'), action: '/pignal/submissions/bulk-delete', confirm: t('submissions.bulk.confirmDelete'), destructive: true },
  ];

  // Active filter label
  const activeFilter = activeAction ? `${t('submissions.filter.action')}: ${activeAction.name}` : undefined;
  const activeFilterClearHref = activeAction
    ? buildUrl({ q: q || undefined, sort: sort !== 'newest' ? sort : undefined, status })
    : undefined;

  return c.html(
    <AppLayout title={t('submissions.title')} currentPath="/pignal/submissions" csrfToken={csrfToken} t={t} locale={locale} defaultLocale={defaultLocale}>
      <PageHeader
        title={t('submissions.title')}
        description={t('submissions.description')}
        count={result.total}
      />

      <ManagedList
        id="submissions"
        searchEndpoint="/pignal/submissions"
        searchPlaceholder={t('submissions.searchPlaceholder')}
        query={q}
        sortTabs={sortTabs}
        filterDropdowns={filterDropdowns}
        activeFilter={activeFilter}
        activeFilterClearHref={activeFilterClearHref}
        bulkActions={bulkActions}
        csrfToken={csrfToken}
        totalCount={submissions.length}
        emptyMessage={actionId || status ? t('submissions.emptyMessageWithFilter') : t('submissions.emptyMessage')}
        pushUrl
        display="table"
        columns={columns}
        pagination={{ total: result.total, limit: PAGE_SIZE, offset, baseUrl }}
      >
        {submissions.map((sub) => (
          <SubmissionTableRow submission={sub} csrfToken={csrfToken} previewFields={previewFields} t={t} />
        ))}
      </ManagedList>
    </AppLayout>,
  );
}

// ---------------------------------------------------------------------------
// Update submission status
// ---------------------------------------------------------------------------

export async function updateSubmissionHandler(c: Context<{ Bindings: WebEnv; Variables: PageVars }>) {
  const id = c.req.param('id')!;
  const actionStore = c.get('actionStore');
  const t = c.get('t');
  const body = await c.req.parseBody();
  const status = (body.status as string) || c.req.query('status') || '';

  if (!VALID_STATUSES.includes(status as SubmissionStatus)) {
    c.header('HX-Trigger', toastTrigger('Invalid status', 'error'));
    c.header('HX-Reswap', 'none');
    return c.body(null, 204);
  }

  try {
    const updated = await actionStore.updateSubmissionStatus(id, status as SubmissionStatus);
    if (!updated) {
      c.header('HX-Trigger', toastTrigger(t('submissions.toast.notFound'), 'error'));
      c.header('HX-Reswap', 'none');
      return c.body(null, 204);
    }

    c.header('HX-Trigger', toastTrigger(t('submissions.toast.markedAs', { status })));
    const submission = await actionStore.getSubmission(id);
    if (submission) {
      const csrfToken = getCsrfToken(c);
      return c.html(<SubmissionTableRow submission={submission} csrfToken={csrfToken} previewFields={[]} t={t} />);
    }
    return c.html('');
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update submission';
    c.header('HX-Trigger', toastTrigger(msg, 'error'));
    c.header('HX-Reswap', 'none');
    return c.body(null, 204);
  }
}

// ---------------------------------------------------------------------------
// Delete single submission
// ---------------------------------------------------------------------------

export async function deleteSubmissionHandler(c: Context<{ Bindings: WebEnv; Variables: PageVars }>) {
  const id = c.req.param('id')!;
  const actionStore = c.get('actionStore');
  const t = c.get('t');

  try {
    const deleted = await actionStore.deleteSubmission(id);
    if (!deleted) {
      c.header('HX-Trigger', toastTrigger(t('submissions.toast.notFound'), 'error'));
      c.header('HX-Reswap', 'none');
      return c.body(null, 204);
    }
    c.header('HX-Trigger', toastTrigger(t('submissions.toast.deleted')));
    return c.html('');
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to delete submission';
    c.header('HX-Trigger', toastTrigger(msg, 'error'));
    c.header('HX-Reswap', 'none');
    return c.body(null, 204);
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

async function reRenderSubmissionList(c: Context<{ Bindings: WebEnv; Variables: PageVars }>): Promise<Response> {
  const actionStore = c.get('actionStore');
  const csrfToken = getCsrfToken(c);
  const t = c.get('t');
  const result = await actionStore.listSubmissions({ limit: PAGE_SIZE, offset: 0 });
  return c.html(
    <SubmissionTableResults
      submissions={result.submissions}
      total={result.total}
      limit={PAGE_SIZE}
      offset={0}
      baseUrl="/pignal/submissions"
      csrfToken={csrfToken}
      previewFields={[]}
      t={t}
    />,
  );
}

async function bulkUpdateStatus(
  c: Context<{ Bindings: WebEnv; Variables: PageVars }>,
  targetStatus: SubmissionStatus,
  toastKey: string,
): Promise<Response> {
  const actionStore = c.get('actionStore');
  const t = c.get('t');
  const ids = await parseBulkIds(c);

  if (ids.length === 0) {
    c.header('HX-Trigger', toastTrigger(t('common.noResults'), 'error'));
    c.header('HX-Reswap', 'none');
    return c.body(null, 204);
  }

  let updated = 0;
  for (const id of ids) {
    try {
      const ok = await actionStore.updateSubmissionStatus(id, targetStatus);
      if (ok) updated++;
    } catch {
      // skip
    }
  }

  c.header('HX-Trigger', toastTrigger(t(toastKey, { count: updated })));
  return reRenderSubmissionList(c);
}

export async function bulkReadSubmissionsHandler(c: Context<{ Bindings: WebEnv; Variables: PageVars }>) {
  return bulkUpdateStatus(c, 'read', 'submissions.bulk.readToast');
}

export async function bulkArchiveSubmissionsHandler(c: Context<{ Bindings: WebEnv; Variables: PageVars }>) {
  return bulkUpdateStatus(c, 'archived', 'submissions.bulk.archiveToast');
}

export async function bulkSpamSubmissionsHandler(c: Context<{ Bindings: WebEnv; Variables: PageVars }>) {
  return bulkUpdateStatus(c, 'spam', 'submissions.bulk.spamToast');
}

export async function bulkDeleteSubmissionsHandler(c: Context<{ Bindings: WebEnv; Variables: PageVars }>) {
  const actionStore = c.get('actionStore');
  const t = c.get('t');
  const ids = await parseBulkIds(c);

  if (ids.length === 0) {
    c.header('HX-Trigger', toastTrigger(t('common.noResults'), 'error'));
    c.header('HX-Reswap', 'none');
    return c.body(null, 204);
  }

  let deleted = 0;
  for (const id of ids) {
    try {
      const ok = await actionStore.deleteSubmission(id);
      if (ok) deleted++;
    } catch {
      // skip
    }
  }

  c.header('HX-Trigger', toastTrigger(t('submissions.bulk.deleteToast', { count: deleted })));
  return reRenderSubmissionList(c);
}
