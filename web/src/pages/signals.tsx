import type { Context } from 'hono';
import type { SignalStoreRpc } from '@pignal/db';
import type { Signal } from '@pignal/core';
import type { SignalWithMeta } from '@pignal/db';
import type { WebEnv } from '../types';
import { AppLayout } from '../components/app-layout';
import { FilterBar } from '../components/type-sidebar';
import { FeedResults } from '../components/signal-feed';
import { getCsrfToken } from '../middleware/csrf';
import { isHtmxRequest } from '../lib/htmx';

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
    pinnedAt: row.pinnedAt,
    isArchived: row.isArchived === 1,
    visibility: row.visibility ?? 'private',
    slug: row.slug,
    shareToken: row.shareToken,
    vouchedAt: row.vouchedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function parseParams(c: Context) {
  const q = c.req.query('q') || '';
  const typeId = c.req.query('typeId') || '';
  const workspaceId = c.req.query('workspaceId') || '';
  const tag = c.req.query('tag') || '';
  const isArchived = c.req.query('isArchived') === 'true';
  const limit = Math.min(parseInt(c.req.query('limit') ?? '20', 10) || 20, 100);
  const offset = parseInt(c.req.query('offset') ?? '0', 10) || 0;
  const sort = c.req.query('sort') === 'oldest' ? 'oldest' as const : 'newest' as const;
  const filterMode: 'categories' | 'workspaces' = c.req.query('mode') === 'categories' || typeId ? 'categories' : 'workspaces';
  return { q, typeId, workspaceId, tag, isArchived, limit, offset, sort, filterMode };
}

function buildBaseUrl(params: ReturnType<typeof parseParams>): string {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.typeId) qs.set('typeId', params.typeId);
  if (params.workspaceId) qs.set('workspaceId', params.workspaceId);
  if (params.tag) qs.set('tag', params.tag);
  if (params.isArchived) qs.set('isArchived', 'true');
  if (params.sort === 'oldest') qs.set('sort', 'oldest');
  if (params.filterMode === 'categories' && !params.typeId) qs.set('mode', 'categories');
  const s = qs.toString();
  return '/pignal/signals' + (s ? `?${s}` : '');
}

export async function signalsPage(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const store = c.get('store');
  const params = parseParams(c);

  // Vary on HX-Request so browser caches full page and HTMX partial separately
  c.header('Vary', 'HX-Request');

  // HTMX partial: return only results (same as signalListPartial)
  if (isHtmxRequest(c)) {
    const result = await store.list({
      q: params.q || undefined,
      typeId: params.typeId || undefined,
      workspaceId: params.workspaceId || undefined,
      tag: params.tag || undefined,
      isArchived: params.isArchived,
      limit: params.limit,
      offset: params.offset,
      sort: params.sort,
    });
    const items = result.items.map(toSignal);
    const baseUrl = buildBaseUrl(params);

    return c.html(
      <FeedResults
        items={items}
        total={result.total}
        limit={params.limit}
        offset={params.offset}
        paginationBase={baseUrl}
        sort={params.sort}
        basePath="/pignal/signals"
        tagBasePath="/pignal/signals"
        useSlug={false}
        showVisibility={true}
        emptyMessage="No signals found."
        htmxTarget="#signal-list"
      />
    );
  }

  const csrfToken = getCsrfToken(c);

  const [types, workspaces, result, counts] = await Promise.all([
    store.listTypes(),
    store.listWorkspaces(),
    store.list({
      q: params.q || undefined,
      typeId: params.typeId || undefined,
      workspaceId: params.workspaceId || undefined,
      tag: params.tag || undefined,
      isArchived: params.isArchived,
      limit: params.limit,
      offset: params.offset,
      sort: params.sort,
    }),
    store.listCounts({ tag: params.tag || undefined, q: params.q || undefined, isArchived: params.isArchived }),
  ]);

  const items = result.items.map(toSignal);
  const baseUrl = buildBaseUrl(params);

  return c.html(
    <AppLayout
      title="Signals"
      currentPath="/pignal/signals"
      csrfToken={csrfToken}
    >
      <FilterBar
        types={types}
        activeTypeId={params.typeId || undefined}
        workspaces={workspaces}
        activeWorkspaceId={params.workspaceId || undefined}
        activeTag={params.tag || undefined}
        mode={params.filterMode}
        sort={params.sort}
        query={params.q || undefined}
        basePath="/pignal/signals"
        htmxTarget="#signal-list"
        htmxIndicator="#search-loading"
        isArchived={params.isArchived}
        totalResults={result.total}
        counts={counts}
      />

      <div id="search-loading" class="source-loading htmx-indicator">
        <span class="app-spinner" />
      </div>

      <div id="signal-list">
        <FeedResults
          items={items}
          total={result.total}
          limit={params.limit}
          offset={params.offset}
          paginationBase={baseUrl}
          sort={params.sort}
          basePath="/pignal/signals"
          tagBasePath="/pignal/signals"
          useSlug={false}
          showVisibility={true}
          emptyMessage="No signals found."
          htmxTarget="#signal-list"
        />
      </div>
    </AppLayout>
  );
}

/**
 * HTMX partial: returns just the signal list for search/filter/paginate.
 */
export async function signalListPartial(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const store = c.get('store');
  const params = parseParams(c);

  const result = await store.list({
    q: params.q || undefined,
    typeId: params.typeId || undefined,
    workspaceId: params.workspaceId || undefined,
    tag: params.tag || undefined,
    isArchived: params.isArchived,
    limit: params.limit,
    offset: params.offset,
    sort: params.sort,
  });

  const items = result.items.map(toSignal);
  const baseUrl = buildBaseUrl(params);

  return c.html(
    <FeedResults
      items={items}
      total={result.total}
      limit={params.limit}
      offset={params.offset}
      paginationBase={baseUrl}
      sort={params.sort}
      basePath="/pignal/signals"
      tagBasePath="/pignal/signals"
      useSlug={false}
      showVisibility={true}
      emptyMessage="No signals found."
      htmxTarget="#signal-list"
    />
  );
}
