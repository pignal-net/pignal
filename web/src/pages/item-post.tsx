import type { Context } from 'hono';
import type { Item } from '@pignal/core';
import type { ItemWithMeta, ItemStoreRpc, SiteActionSelect } from '@pignal/db';
import type { DirectiveContext } from '@pignal/core/directives/registry';
import type { WebEnv } from '../types';
import { renderContentWithDirectives } from '../lib/directives';
import { getTemplate } from '../templates/registry';
import { getCtaSettings } from '../components/cta-block';
import { ActionStore } from '@pignal/core/store/action-store';
import { drizzle } from 'drizzle-orm/d1';

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

/** Build a Map of active site actions keyed by slug. */
function buildActionsMap(actions: SiteActionSelect[]): Map<string, SiteActionSelect> {
  const map = new Map<string, SiteActionSelect>();
  for (const action of actions) {
    if (action.status === 'active') {
      map.set(action.slug, action);
    }
  }
  return map;
}

export async function itemPostPage(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const slug = c.req.param('slug')!;
  const store = c.get('store');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = drizzle((c.env as any).DB);
  const actionStore = new ActionStore(db);

  const [row, settings, siteActions] = await Promise.all([
    store.getBySlug(slug),
    store.getSettings(),
    actionStore.listActions({ status: 'active' }),
  ]);

  if (!row) {
    c.status(404);
    return c.html(<p class="text-center text-muted py-12">Post not found.</p>);
  }

  const item = toItem(row);
  const sourceUrl = new URL(c.req.url).origin;
  const domain = new URL(sourceUrl).hostname;
  const sourceAuthor = settings.owner_name || settings.source_title || domain;
  const githubUrl = settings.source_social_github || '';

  // Fetch testimonial items if a testimonial type is configured
  let testimonialItems: ItemWithMeta[] = [];
  const testimonialTypeName = settings.testimonial_type_name;
  if (testimonialTypeName) {
    // Find the type ID for the configured testimonial type name
    const types = await store.listTypes();
    const testimonialType = types.find((t) => t.name === testimonialTypeName);
    if (testimonialType) {
      const result = await store.listPublic({ typeId: testimonialType.id, limit: 50 });
      testimonialItems = result.items;
    }
  }

  // Build directive context and render content with directive processing
  const directiveContext: DirectiveContext = {
    actions: buildActionsMap(siteActions),
    settings,
    items: testimonialItems,
    sourceUrl,
  };

  let { html: renderedContent, headings } = renderContentWithDirectives(item.content, directiveContext);

  // Append PostCta after article content if enabled
  const postCta = getCtaSettings(settings, 'post');
  if (postCta && postCta.title && postCta.buttonText) {
    const escHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const descHtml = postCta.description ? `<p class="text-muted mt-2">${escHtml(postCta.description)}</p>` : '';
    let buttonHtml: string;
    if (postCta.actionSlug) {
      buttonHtml = `<button type="button" class="bg-primary text-primary-inverse rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-primary-hover transition-colors mt-4 inline-block" hx-get="/form/${escHtml(postCta.actionSlug)}" hx-target="#cta-post-form" hx-swap="innerHTML">${escHtml(postCta.buttonText)}</button><div id="cta-post-form" class="mt-4"></div>`;
    } else if (postCta.buttonUrl) {
      buttonHtml = `<a href="${escHtml(postCta.buttonUrl)}" class="bg-primary text-primary-inverse rounded-lg px-6 py-2.5 text-sm font-medium hover:bg-primary-hover transition-colors mt-4 inline-block" target="_blank" rel="noopener">${escHtml(postCta.buttonText)}</a>`;
    } else {
      buttonHtml = `<span class="bg-primary text-primary-inverse rounded-lg px-6 py-2.5 text-sm font-medium mt-4 inline-block">${escHtml(postCta.buttonText)}</span>`;
    }
    renderedContent += `<div class="bg-surface rounded-xl border border-border-subtle shadow-card p-6 mt-8"><h3 class="text-lg font-semibold text-text">${escHtml(postCta.title)}</h3>${descHtml}${buttonHtml}</div>`;
  }

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
