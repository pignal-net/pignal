import type { Context } from 'hono';
import type { SignalStoreRpc } from '@pignal/db';
import type { Signal } from '@pignal/core';
import type { SignalWithMeta } from '@pignal/db';
import type { WebEnv } from '../types';
import { AppLayout } from '../components/app-layout';
import { SignalCard } from '../components/signal-card';
import { Pagination } from '../components/pagination';
import { getCsrfToken } from '../middleware/csrf';

type WebVars = { store: SignalStoreRpc };

function toSignal(row: SignalWithMeta): Signal {
  return {
    id: row.id,
    keySummary: row.keySummary,
    content: row.content,
    typeId: row.typeId,
    typeName: row.typeName,
    workspaceId: row.workspaceId,
    workspaceName: row.workspaceName,
    sourceAi: row.sourceAi,
    validationActionId: row.validationActionId,
    validationActionLabel: row.validationActionLabel,
    tags: row.tags,
    isArchived: row.isArchived === 1,
    visibility: row.visibility ?? 'private',
    slug: row.slug,
    shareToken: row.shareToken,
    vouchedAt: row.vouchedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function SignalList(props: {
  items: Signal[];
  total: number;
  limit: number;
  offset: number;
  baseUrl: string;
}) {
  return (
    <div id="signal-list">
      {props.items.length === 0 ? (
        <p class="empty-state">No signals found.</p>
      ) : (
        props.items.map((item) => <SignalCard signal={item} />)
      )}
      <Pagination
        total={props.total}
        limit={props.limit}
        offset={props.offset}
        baseUrl={props.baseUrl}
        htmxTarget="#signal-list"
      />
    </div>
  );
}

export async function signalsPage(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const store = c.get('store');
  const [types, workspaces] = await Promise.all([
    store.listTypes(),
    store.listWorkspaces(),
  ]);

  const q = c.req.query('q') || '';
  const typeId = c.req.query('typeId') || '';
  const workspaceId = c.req.query('workspaceId') || '';
  const tag = c.req.query('tag') || '';
  const isArchived = c.req.query('isArchived') === 'true';
  const limit = Math.min(parseInt(c.req.query('limit') ?? '20', 10) || 20, 100);
  const offset = parseInt(c.req.query('offset') ?? '0', 10) || 0;

  const result = await store.list({
    q: q || undefined,
    typeId: typeId || undefined,
    workspaceId: workspaceId || undefined,
    tag: tag || undefined,
    isArchived,
    limit,
    offset,
  });

  const items = result.items.map(toSignal);
  const csrfToken = getCsrfToken(c);

  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (typeId) params.set('typeId', typeId);
  if (workspaceId) params.set('workspaceId', workspaceId);
  if (tag) params.set('tag', tag);
  if (isArchived) params.set('isArchived', 'true');
  const baseUrl = '/pignal/signals' + (params.toString() ? `?${params.toString()}` : '');

  return c.html(
    <AppLayout
      title="Signals"
      description="Browse and manage your captured insights"
      currentPath="/pignal/signals"
      csrfToken={csrfToken}
    >
      <form class="filter-bar" method="get" action="/pignal/signals">
        <input
          type="search"
          name="q"
          placeholder="Search signals..."
          value={q}
          hx-get="/pignal/signals/list"
          hx-trigger="input changed delay:300ms"
          hx-target="#signal-list"
          hx-include="[name='typeId'],[name='workspaceId'],[name='isArchived']"
          hx-indicator="#search-loading"
        />
        <select name="typeId" hx-get="/pignal/signals/list" hx-trigger="change" hx-target="#signal-list" hx-include="[name='q'],[name='workspaceId'],[name='isArchived']" hx-indicator="#search-loading">
          <option value="">All Types</option>
          {types.map((t) => (
            <option value={t.id} selected={t.id === typeId}>{t.name}</option>
          ))}
        </select>
        <select name="workspaceId" hx-get="/pignal/signals/list" hx-trigger="change" hx-target="#signal-list" hx-include="[name='q'],[name='typeId'],[name='isArchived']" hx-indicator="#search-loading">
          <option value="">All Workspaces</option>
          {workspaces.map((w) => (
            <option value={w.id} selected={w.id === workspaceId}>{w.name}</option>
          ))}
        </select>
        <label>
          <input type="checkbox" name="isArchived" value="true" checked={isArchived}
            hx-get="/pignal/signals/list" hx-trigger="change" hx-target="#signal-list" hx-include="[name='q'],[name='typeId'],[name='workspaceId']" hx-indicator="#search-loading"
          />
          Archived
        </label>
        <noscript><button type="submit">Filter</button></noscript>
      </form>

      {tag && (
        <div class="active-filter">
          Filtered by tag: <span class="signal-tag">#{tag}</span>
          <a href="/pignal/signals" class="clear-filter">Clear</a>
        </div>
      )}

      <p class="result-count">{result.total} signal{result.total !== 1 ? 's' : ''} found</p>

      <div id="search-loading" class="search-loading htmx-indicator">
        <span class="app-spinner" />
      </div>

      <SignalList items={items} total={result.total} limit={limit} offset={offset} baseUrl={baseUrl} />
    </AppLayout>
  );
}

/**
 * HTMX partial: returns just the signal list for search/filter/paginate.
 */
export async function signalListPartial(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const store = c.get('store');

  const q = c.req.query('q') || '';
  const typeId = c.req.query('typeId') || '';
  const workspaceId = c.req.query('workspaceId') || '';
  const tag = c.req.query('tag') || '';
  const isArchived = c.req.query('isArchived') === 'true';
  const limit = Math.min(parseInt(c.req.query('limit') ?? '20', 10) || 20, 100);
  const offset = parseInt(c.req.query('offset') ?? '0', 10) || 0;

  const result = await store.list({
    q: q || undefined,
    typeId: typeId || undefined,
    workspaceId: workspaceId || undefined,
    tag: tag || undefined,
    isArchived,
    limit,
    offset,
  });

  const items = result.items.map(toSignal);

  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (typeId) params.set('typeId', typeId);
  if (workspaceId) params.set('workspaceId', workspaceId);
  if (tag) params.set('tag', tag);
  if (isArchived) params.set('isArchived', 'true');
  const baseUrl = '/pignal/signals' + (params.toString() ? `?${params.toString()}` : '');

  return c.html(
    <SignalList items={items} total={result.total} limit={limit} offset={offset} baseUrl={baseUrl} />
  );
}
