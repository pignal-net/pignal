import type { Context } from 'hono';
import type { Item } from '@pignal/core';
import type { ItemWithMeta, ItemStoreRpc } from '@pignal/db';
import type { WebEnv } from '../types';
import { renderMarkdown, extractHeadings, normalizeHeadings } from '../lib/markdown';
import { getTemplate } from '../templates/registry';

type WebVars = { store: ItemStoreRpc; templateName: string };

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

export async function itemPostPage(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const slug = c.req.param('slug')!;
  const store = c.get('store');

  const [row, settings] = await Promise.all([
    store.getBySlug(slug),
    store.getSettings(),
  ]);

  if (!row) {
    c.status(404);
    return c.html(<p class="empty-state">Post not found.</p>);
  }

  const item = toItem(row);
  const sourceUrl = new URL(c.req.url).origin;
  const domain = new URL(sourceUrl).hostname;
  const sourceAuthor = settings.owner_name || settings.source_title || domain;
  const githubUrl = settings.source_social_github || '';

  // Normalize headings once, reuse for both extraction and rendering
  const normalized = normalizeHeadings(item.content);
  const headings = extractHeadings(normalized, true);
  const renderedContent = renderMarkdown(normalized, true);

  const template = getTemplate(c.get('templateName'));

  c.header('Cache-Control', 'public, max-age=60');

  return c.html(
    <template.ItemPost
      item={item}
      settings={settings}
      renderedContent={renderedContent}
      headings={headings}
      sourceUrl={sourceUrl}
      sourceAuthor={sourceAuthor}
      githubUrl={githubUrl}
      vocabulary={template.vocabulary}
      seo={template.seo}
    />
  );
}
