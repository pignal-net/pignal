import type { Context } from 'hono';
import type { Item } from '@pignal/core';
import type { ItemWithMeta } from '@pignal/db';
import type { WebEnv, WebVars } from '../types';
import { isHtmxRequest } from '../lib/htmx';
import { getTemplate } from '@pignal/templates';

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

export async function sourcePageFeed(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const store = c.get('store');
  const isHtmx = isHtmxRequest(c);

  // Vary on HX-Request so browser caches full page and HTMX partial separately
  c.header('Vary', 'HX-Request');

  const settings = await store.getSettings();
  const template = getTemplate(c.get('templateName'));

  const postsPerPage = parseInt(settings.source_posts_per_page || '20', 10) || 20;
  const limit = Math.min(parseInt(c.req.query('limit') ?? String(postsPerPage), 10) || postsPerPage, 100);
  const offset = parseInt(c.req.query('offset') ?? '0', 10) || 0;
  const typeId = c.req.query('type') || undefined;
  const workspaceId = c.req.query('workspace') || undefined;
  const tag = (c.req.query('tag') || undefined)?.slice(0, 100);
  const q = (c.req.query('q') || undefined)?.slice(0, 500);
  const sort = c.req.query('sort') === 'oldest' ? 'oldest' as const : 'newest' as const;

  // Build filter query string for pagination
  const filterParams = new URLSearchParams();
  if (typeId) filterParams.set('type', typeId);
  if (workspaceId) filterParams.set('workspace', workspaceId);
  if (tag) filterParams.set('tag', tag);
  if (q) filterParams.set('q', q);
  if (sort === 'oldest') filterParams.set('sort', 'oldest');
  const filterQs = filterParams.toString();
  const paginationBase = filterQs ? `/?${filterQs}` : '/';

  const locale = c.get('locale');
  const vocabulary = template.vocabulary;

  // HTMX partial: delegate to template's PartialResults
  if (isHtmx) {
    const result = await store.listPublic({ typeId, workspaceId, tag, q, limit, offset, sort });
    const items = result.items.map(toItem);

    return c.html(
      <template.PartialResults
        items={items}
        total={result.total}
        limit={limit}
        offset={offset}
        paginationBase={paginationBase}
        sort={sort}
        vocabulary={vocabulary}
      />
    );
  }

  // Full page render via template
  const sourceUrl = new URL(c.req.url).origin;

  const [result, types, allWorkspaces, counts] = await Promise.all([
    store.listPublic({ typeId, workspaceId, tag, q, limit, offset, sort }),
    store.listTypes(),
    store.listWorkspaces(),
    store.listPublicCounts({ tag, q }),
  ]);
  const items = result.items.map(toItem);
  const publicWorkspaces = allWorkspaces.filter((w) => w.visibility === 'public');

  c.header('Cache-Control', 'public, max-age=60');

  const t = c.get('t');
  const defaultLocale = c.get('defaultLocale');
  const localePrefix = locale === defaultLocale ? '' : `/${locale}`;

  return c.html(
    <template.SourcePage
      items={items}
      types={types}
      workspaces={publicWorkspaces}
      counts={counts}
      settings={settings}
      filters={{ typeId, workspaceId, tag, q, sort }}
      pagination={{ limit, offset, total: result.total }}
      paginationBase={`${localePrefix}${paginationBase}`}
      sourceUrl={sourceUrl}
      isHtmxRequest={false}
      vocabulary={vocabulary}
      seo={template.seo}
      t={t}
      locale={locale}
      defaultLocale={defaultLocale}
      localePrefix={localePrefix}
      visitor={c.get('visitor')}
    />
  );
}
