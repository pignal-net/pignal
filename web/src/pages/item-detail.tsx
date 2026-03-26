import type { Context } from 'hono';
import type { WebEnv, WebVars } from '../types';
import type { TypeActionSelect } from '@pignal/db';
import type { TFunction } from '@pignal/render/i18n/types';
import { AppLayout } from '../components/app-layout';
import { TypeBadge } from '@pignal/render/components/type-badge';
import { VisibilityBadge } from '@pignal/render/components/visibility-badge';
import { IconChevronLeft } from '@pignal/render/components/icons';
import { getCsrfToken } from '../middleware/csrf';
import { renderMarkdown } from '@pignal/render/lib/markdown';
import { formatDate } from '@pignal/render/lib/time';
import { isHtmxRequest, toastTrigger } from '../lib/htmx';
import { raw } from 'hono/html';

/* --- Sidebar panel components (returned as HTMX partials) --- */

function ItemSidebar({ id, actions, currentActionLabel, visibility, shareToken, slug, sourceUrl, csrfToken, workspaceVisibility, workspaceName, isArchived, isPinned, t }: {
  id: string;
  actions: TypeActionSelect[];
  currentActionLabel: string | null;
  visibility: string;
  shareToken: string | null;
  slug: string | null;
  sourceUrl: string;
  csrfToken: string;
  workspaceVisibility: string | null;
  workspaceName: string | null;
  isArchived: boolean;
  isPinned: boolean;
  t: TFunction;
}) {
  // Build validation options for dropdown
  const validationOptions = [
    { value: '', label: t('itemDetail.notValidated') },
    ...actions.map((a) => ({ value: a.id, label: a.label })),
  ];
  const currentValidationValue = actions.find((a) => a.label === currentActionLabel)?.id ?? '';

  // Build visibility options
  const visibilityOptions = [
    { value: 'private', label: t('itemDetail.visibilityPrivate') },
    { value: 'unlisted', label: t('itemDetail.visibilityUnlisted') },
    { value: 'vouched', label: t('itemDetail.visibilityVouched') },
  ];

  return (
    <div id="item-sidebar" class="bg-surface rounded-xl border border-border-subtle shadow-card p-5">
      {/* Validation */}
      <div class="mb-5">
        <label class="text-xs font-semibold text-muted uppercase tracking-wide block mb-2">{t('itemDetail.validation')}</label>
        <div class="form-dropdown form-dropdown-compact">
          <button type="button" class="form-dropdown-trigger" aria-haspopup="listbox">
            <span class="form-dropdown-label">{currentActionLabel ?? 'Not validated'}</span>
          </button>
          <ul role="listbox" class="form-dropdown-list">
            {validationOptions.map((opt) => (
              <li>
                <a
                  href="#"
                  class="dropdown-item"
                  aria-selected={opt.value === currentValidationValue ? 'true' : undefined}
                  hx-post={`/pignal/items/${id}/validate`}
                  hx-vals={JSON.stringify({ _csrf: csrfToken, actionId: opt.value })}
                  hx-target="#item-sidebar"
                  hx-swap="outerHTML"
                >
                  {opt.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Visibility */}
      <div class="mb-5">
        <label class="text-xs font-semibold text-muted uppercase tracking-wide block mb-2">{t('itemDetail.visibility')}</label>
        <div class="form-dropdown form-dropdown-compact">
          <button type="button" class="form-dropdown-trigger" aria-haspopup="listbox">
            <span class="form-dropdown-label">{visibilityOptions.find((o) => o.value === visibility)?.label ?? t('itemDetail.visibilityPrivate')}</span>
          </button>
          <ul role="listbox" class="form-dropdown-list">
            {visibilityOptions.map((opt) => (
              <li>
                <a
                  href="#"
                  class="dropdown-item"
                  aria-selected={opt.value === visibility ? 'true' : undefined}
                  hx-post={`/pignal/items/${id}/visibility`}
                  hx-vals={JSON.stringify({ _csrf: csrfToken, visibility: opt.value })}
                  hx-target="#item-sidebar"
                  hx-swap="outerHTML"
                >
                  {opt.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        {visibility === 'unlisted' && shareToken && (
          <p class="mt-2 text-xs text-muted break-all">Share: <code>{sourceUrl}/s/{shareToken}</code></p>
        )}
        {visibility === 'vouched' && slug && (
          <div class="mt-2">
            <p class="text-xs text-muted">Public: <a href={`/item/${slug}`} class="text-primary hover:underline">{sourceUrl}/item/{slug}</a></p>
            {workspaceVisibility === 'private' && workspaceName && (
              <p class="text-xs text-error mt-1">Workspace "{workspaceName}" is private. <a href="/pignal/workspaces" class="underline">Change it</a> so others can see this item.</p>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div class="border-t border-border-subtle pt-4 flex flex-wrap gap-2">
        <a href="#" class="outline btn-sm"
          hx-post={`/pignal/items/${id}/${isPinned ? 'unpin' : 'pin'}`}
          hx-vals={JSON.stringify({ _csrf: csrfToken })}
          hx-target="#item-sidebar"
          hx-swap="outerHTML">{isPinned ? t('itemDetail.unpin') : t('itemDetail.pin')}</a>
        <a href="#" class="outline btn-sm"
          hx-post={`/pignal/items/${id}/${isArchived ? 'unarchive' : 'archive'}`}
          hx-vals={JSON.stringify({ _csrf: csrfToken })}
          hx-target="#item-sidebar"
          hx-swap="outerHTML">{isArchived ? t('itemDetail.unarchive') : t('itemDetail.archive')}</a>
        <a href="#" class="outline btn-sm text-error"
          hx-post={`/pignal/items/${id}/delete`}
          hx-vals={JSON.stringify({ _csrf: csrfToken })}
          hx-confirm={t('itemDetail.confirmDelete')}
          hx-swap="none">{t('itemDetail.deleteItem')}</a>
      </div>
    </div>
  );
}

/* --- Full page render --- */

export async function itemDetailPage(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const id = c.req.param('id')!;
  const store = c.get('store');
  const t = c.get('t');
  const locale = c.get('locale');
  const defaultLocale = c.get('defaultLocale');
  const [item, types] = await Promise.all([store.get(id), store.listTypes()]);

  if (!item) {
    return c.html(<p>Item not found.</p>, 404);
  }
  const currentType = types.find((tp) => tp.id === item.typeId);
  const actions = currentType?.actions ?? [];
  const csrfToken = getCsrfToken(c);
  const sourceUrl = new URL(c.req.url).origin;
  const workspace = item.workspaceId ? await store.getWorkspace(item.workspaceId) : null;
  const renderedContent = renderMarkdown(item.content);

  return c.html(
    <AppLayout title={item.keySummary} currentPath="/pignal/items" csrfToken={csrfToken} t={t} locale={locale} defaultLocale={defaultLocale}>
      {/* Back navigation */}
      <nav class="mb-6">
        <a href="/pignal/items" class="inline-flex items-center gap-1 text-sm text-muted hover:text-primary transition-colors px-3 py-1.5 rounded-full hover:bg-surface-hover">
          <IconChevronLeft size={14} />
          {t('common.back')}
        </a>
      </nav>

      <div class="flex flex-col lg:flex-row gap-8">
        {/* Main content — no card wrapper, let content breathe */}
        <div class="flex-1 min-w-0">
          {/* Metadata badges */}
          <div class="flex items-center gap-2 text-xs text-muted flex-wrap mb-3">
            <TypeBadge typeName={item.typeName} />
            <VisibilityBadge visibility={item.visibility ?? 'private'} t={t} />
            {item.workspaceName && <span>{item.workspaceName}</span>}
            <time datetime={item.createdAt}>{formatDate(item.createdAt)}</time>
            <span>Source: {item.sourceAi}</span>
          </div>

          {/* Title */}
          <h1 class="text-2xl font-bold tracking-tight mb-6">{item.keySummary}</h1>

          {/* Rendered content */}
          <div class="content">
            {raw(renderedContent)}
          </div>

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div class="mt-8 pt-4 border-t border-border-subtle">
              <div class="flex flex-wrap gap-2">
                {item.tags.map((t) => (
                  <a href={`/pignal/items?tag=${encodeURIComponent(t)}`} class="text-xs text-primary hover:underline">#{t}</a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside class="w-full lg:w-72 shrink-0">
          <ItemSidebar
            id={id}
            actions={actions}
            currentActionLabel={item.validationActionLabel}
            visibility={item.visibility ?? 'private'}
            shareToken={item.shareToken}
            slug={item.slug}
            sourceUrl={sourceUrl}
            csrfToken={csrfToken}
            workspaceVisibility={workspace?.visibility ?? null}
            workspaceName={item.workspaceName}
            isArchived={item.isArchived === 1}
            isPinned={!!item.pinnedAt}
            t={t}
          />
        </aside>
      </div>
    </AppLayout>
  );
}

/* --- HTMX-aware POST handlers --- */

/** Helper: re-render the full sidebar after any action. */
async function renderSidebar(c: Context<{ Bindings: WebEnv; Variables: WebVars }>, id: string) {
  const store = c.get('store');
  const t = c.get('t');
  const [item, types] = await Promise.all([store.get(id), store.listTypes()]);
  if (!item) return c.text('Not found', 404);
  const currentType = types.find((tp) => tp.id === item.typeId);
  const typeActions = currentType?.actions ?? [];
  const csrfToken = getCsrfToken(c);
  const sourceUrl = new URL(c.req.url).origin;
  const workspace = item.workspaceId ? await store.getWorkspace(item.workspaceId) : null;

  return c.html(
    <ItemSidebar
      id={id}
      actions={typeActions}
      currentActionLabel={item.validationActionLabel}
      visibility={item.visibility ?? 'private'}
      shareToken={item.shareToken}
      slug={item.slug}
      sourceUrl={sourceUrl}
      csrfToken={csrfToken}
      workspaceVisibility={workspace?.visibility ?? null}
      workspaceName={item.workspaceName}
      isArchived={item.isArchived === 1}
      isPinned={!!item.pinnedAt}
      t={t}
    />
  );
}

export async function validateHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const id = c.req.param('id')!;
  const store = c.get('store');
  const t = c.get('t');
  const body = await c.req.parseBody();
  const actionId = (body.actionId as string) || null;
  await store.validate(id, actionId || null);

  if (isHtmxRequest(c)) {
    c.header('HX-Trigger', toastTrigger(t('itemDetail.toast.validated')));
    return renderSidebar(c, id);
  }
  return c.redirect(`/pignal/items/${id}`);
}

export async function archiveHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const id = c.req.param('id')!;
  const t = c.get('t');
  await c.get('store').archive(id);
  if (isHtmxRequest(c)) {
    c.header('HX-Trigger', toastTrigger(t('itemDetail.toast.archived')));
    return renderSidebar(c, id);
  }
  return c.redirect(`/pignal/items/${id}`);
}

export async function unarchiveHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const id = c.req.param('id')!;
  const t = c.get('t');
  await c.get('store').unarchive(id);
  if (isHtmxRequest(c)) {
    c.header('HX-Trigger', toastTrigger(t('itemDetail.toast.unarchived')));
    return renderSidebar(c, id);
  }
  return c.redirect(`/pignal/items/${id}`);
}

export async function pinHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const id = c.req.param('id')!;
  const t = c.get('t');
  await c.get('store').pin(id);
  if (isHtmxRequest(c)) {
    c.header('HX-Trigger', toastTrigger(t('itemDetail.toast.pinned')));
    return renderSidebar(c, id);
  }
  return c.redirect(`/pignal/items/${id}`);
}

export async function unpinHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const id = c.req.param('id')!;
  const t = c.get('t');
  await c.get('store').unpin(id);
  if (isHtmxRequest(c)) {
    c.header('HX-Trigger', toastTrigger(t('itemDetail.toast.unpinned')));
    return renderSidebar(c, id);
  }
  return c.redirect(`/pignal/items/${id}`);
}

export async function visibilityHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const id = c.req.param('id')!;
  const store = c.get('store');
  const t = c.get('t');
  const body = await c.req.parseBody();
  const rawVisibility = body.visibility as string;
  if (!['private', 'unlisted', 'vouched'].includes(rawVisibility)) {
    if (isHtmxRequest(c)) {
      c.header('HX-Trigger', toastTrigger('Invalid visibility', 'error'));
      c.header('HX-Reswap', 'none');
      return c.body(null, 204);
    }
    return c.text('Invalid visibility', 400);
  }

  await store.vouch(id, { visibility: rawVisibility as 'private' | 'unlisted' | 'vouched' });

  if (isHtmxRequest(c)) {
    c.header('HX-Trigger', toastTrigger(t('itemDetail.toast.visibilityUpdated')));
    return renderSidebar(c, id);
  }
  return c.redirect(`/pignal/items/${id}`);
}
