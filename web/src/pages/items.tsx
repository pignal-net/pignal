import type { Context } from 'hono';
import type { ItemStoreRpc } from '@pignal/db';
import type { Item } from '@pignal/core';
import type { ItemWithMeta } from '@pignal/db';
import type { WebEnv } from '../types';
import { AppLayout } from '../components/app-layout';
import { FilterBar } from '../components/type-sidebar';
import { FeedResults } from '../components/item-feed';
import { getCsrfToken } from '../middleware/csrf';
import { isHtmxRequest } from '../lib/htmx';

type WebVars = { store: ItemStoreRpc };

function toItem(row: ItemWithMeta): Item {
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
  return { q, typeId, workspaceId, tag, isArchived, limit, offset, sort };
}

function buildBaseUrl(params: ReturnType<typeof parseParams>): string {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.typeId) qs.set('typeId', params.typeId);
  if (params.workspaceId) qs.set('workspaceId', params.workspaceId);
  if (params.tag) qs.set('tag', params.tag);
  if (params.isArchived) qs.set('isArchived', 'true');
  if (params.sort === 'oldest') qs.set('sort', 'oldest');
  const s = qs.toString();
  return '/pignal/items' + (s ? `?${s}` : '');
}

export async function itemsPage(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const store = c.get('store');
  const params = parseParams(c);

  // Vary on HX-Request so browser caches full page and HTMX partial separately
  c.header('Vary', 'HX-Request');

  // HTMX partial: return only results (same as itemListPartial)
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
    const items = result.items.map(toItem);
    const baseUrl = buildBaseUrl(params);

    return c.html(
      <FeedResults
        items={items}
        total={result.total}
        limit={params.limit}
        offset={params.offset}
        paginationBase={baseUrl}
        sort={params.sort}
        basePath="/pignal/items"
        tagBasePath="/pignal/items"
        useSlug={false}
        showVisibility={true}
        emptyMessage="No items found."
        htmxTarget="#item-list"
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

  const items = result.items.map(toItem);
  const baseUrl = buildBaseUrl(params);

  return c.html(
    <AppLayout
      title="Items"
      currentPath="/pignal/items"
      csrfToken={csrfToken}
    >
      <FilterBar
        types={types}
        activeTypeId={params.typeId || undefined}
        workspaces={workspaces}
        activeWorkspaceId={params.workspaceId || undefined}
        activeTag={params.tag || undefined}
        sort={params.sort}
        query={params.q || undefined}
        basePath="/pignal/items"
        htmxTarget="#item-list"
        htmxIndicator="#search-loading"
        isArchived={params.isArchived}
        totalResults={result.total}
        counts={counts}
      />

      <div id="search-loading" class="source-loading htmx-indicator">
        <span class="app-spinner" />
      </div>

      <div id="item-list">
        <FeedResults
          items={items}
          total={result.total}
          limit={params.limit}
          offset={params.offset}
          paginationBase={baseUrl}
          sort={params.sort}
          basePath="/pignal/items"
          tagBasePath="/pignal/items"
          useSlug={false}
          showVisibility={true}
          emptyMessage="No items found."
          htmxTarget="#item-list"
        />
      </div>
    </AppLayout>
  );
}

/**
 * HTMX partial: returns just the item list for search/filter/paginate.
 */
export async function itemListPartial(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
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

  const items = result.items.map(toItem);
  const baseUrl = buildBaseUrl(params);

  return c.html(
    <FeedResults
      items={items}
      total={result.total}
      limit={params.limit}
      offset={params.offset}
      paginationBase={baseUrl}
      sort={params.sort}
      basePath="/pignal/items"
      tagBasePath="/pignal/items"
      useSlug={false}
      showVisibility={true}
      emptyMessage="No items found."
      htmxTarget="#item-list"
    />
  );
}
