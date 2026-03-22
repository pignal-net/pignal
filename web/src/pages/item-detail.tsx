import type { Context } from 'hono';
import type { ItemStoreRpc } from '@pignal/db';
import type { WebEnv } from '../types';
import type { TypeActionSelect } from '@pignal/db';
import { AppLayout } from '../components/app-layout';
import { TypeBadge } from '../components/type-badge';
import { VisibilityBadge } from '../components/visibility-badge';
import { IconChevronLeft } from '../components/icons';
import { getCsrfToken } from '../middleware/csrf';
import { renderMarkdown } from '../lib/markdown';
import { formatDate } from '../lib/time';
import { isHtmxRequest, toastTrigger } from '../lib/htmx';
import { raw } from 'hono/html';

type WebVars = { store: ItemStoreRpc };

/* --- Sidebar panel components (returned as HTMX partials) --- */

function ValidationPanel({ id, actions, currentActionLabel, csrfToken }: {
  id: string;
  actions: TypeActionSelect[];
  currentActionLabel: string | null;
  csrfToken: string;
}) {
  return (
    <div id="validation-section" class="bg-surface rounded-xl border border-border-subtle shadow-card border-l-4 border-l-success p-5 mb-4">
      <h3 class="text-sm font-semibold text-text mb-3">Validation</h3>
      <p class="text-sm mb-3">
        {currentActionLabel
          ? <strong class="text-success">{currentActionLabel}</strong>
          : <em class="text-muted">Not validated</em>}
      </p>
      {actions.length > 0 && (
        <div class="flex flex-wrap gap-2">
          {actions.map((action) => (
            <form method="post" action={`/pignal/items/${id}/validate`}
              hx-post={`/pignal/items/${id}/validate`}
              hx-target="#validation-section"
              hx-swap="outerHTML">
              <input type="hidden" name="_csrf" value={csrfToken} />
              <input type="hidden" name="actionId" value={action.id} />
              <button type="submit" class="outline text-xs px-4 py-2 rounded-lg">
                {action.label}
              </button>
            </form>
          ))}
          <form method="post" action={`/pignal/items/${id}/validate`}
            hx-post={`/pignal/items/${id}/validate`}
            hx-target="#validation-section"
            hx-swap="outerHTML">
            <input type="hidden" name="_csrf" value={csrfToken} />
            <input type="hidden" name="actionId" value="" />
            <button type="submit" class="outline secondary text-xs px-4 py-2 rounded-lg">
              Clear
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function VisibilityPanel({ id, visibility, shareToken, slug, sourceUrl, csrfToken, workspaceVisibility, workspaceName }: {
  id: string;
  visibility: string;
  shareToken: string | null;
  slug: string | null;
  sourceUrl: string;
  csrfToken: string;
  workspaceVisibility: string | null;
  workspaceName: string | null;
}) {
  return (
    <div id="visibility-section" class="bg-surface rounded-xl border border-border-subtle shadow-card border-l-4 border-l-info p-5 mb-4">
      <h3 class="text-sm font-semibold text-text mb-3">Visibility</h3>
      <form method="post" action={`/pignal/items/${id}/visibility`}
        hx-post={`/pignal/items/${id}/visibility`}
        hx-target="#visibility-section"
        hx-swap="outerHTML">
        <input type="hidden" name="_csrf" value={csrfToken} />
        <select name="visibility">
          <option value="private" selected={visibility === 'private'}>Private</option>
          <option value="unlisted" selected={visibility === 'unlisted'}>Unlisted</option>
          <option value="vouched" selected={visibility === 'vouched'}>Vouched</option>
        </select>
        <button type="submit" class="outline text-xs px-4 py-2 rounded-lg">Update</button>
      </form>
      {visibility === 'unlisted' && shareToken && (
        <div class="mt-3 text-xs text-muted break-all">
          Share: <code>{sourceUrl}/s/{shareToken}</code>
        </div>
      )}
      {visibility === 'vouched' && slug && (
        <div class="mt-3">
          <div class="text-xs text-muted">
            Source: <a href={`/item/${slug}`}>{sourceUrl}/item/{slug}</a>
          </div>
          {workspaceVisibility === 'private' && workspaceName && (
            <div class="text-xs text-error mt-1">
              Workspace "{workspaceName}" is private. Change it to public in <a href="/pignal/workspaces">Workspace Settings</a> so others can see this item.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ActionsPanel({ id, isArchived, isPinned, csrfToken }: {
  id: string;
  isArchived: boolean;
  isPinned: boolean;
  csrfToken: string;
}) {
  return (
    <div id="actions-section" class="bg-surface rounded-xl border border-border-subtle shadow-card p-5 mb-4">
      <h3 class="text-sm font-semibold text-text mb-3">Actions</h3>
      <div class="flex flex-col gap-2">
        {!isPinned ? (
          <form method="post" action={`/pignal/items/${id}/pin`}
            hx-post={`/pignal/items/${id}/pin`}
            hx-target="#actions-section"
            hx-swap="outerHTML">
            <input type="hidden" name="_csrf" value={csrfToken} />
            <button type="submit" class="outline text-xs px-4 py-2 rounded-lg w-full justify-center">
              Pin
            </button>
          </form>
        ) : (
          <form method="post" action={`/pignal/items/${id}/unpin`}
            hx-post={`/pignal/items/${id}/unpin`}
            hx-target="#actions-section"
            hx-swap="outerHTML">
            <input type="hidden" name="_csrf" value={csrfToken} />
            <button type="submit" class="outline text-xs px-4 py-2 rounded-lg w-full justify-center">
              Unpin
            </button>
          </form>
        )}
        {!isArchived ? (
          <form method="post" action={`/pignal/items/${id}/archive`}
            hx-post={`/pignal/items/${id}/archive`}
            hx-target="#actions-section"
            hx-swap="outerHTML">
            <input type="hidden" name="_csrf" value={csrfToken} />
            <button type="submit" class="secondary text-xs px-4 py-2 rounded-lg w-full justify-center">
              Archive
            </button>
          </form>
        ) : (
          <form method="post" action={`/pignal/items/${id}/unarchive`}
            hx-post={`/pignal/items/${id}/unarchive`}
            hx-target="#actions-section"
            hx-swap="outerHTML">
            <input type="hidden" name="_csrf" value={csrfToken} />
            <button type="submit" class="secondary text-xs px-4 py-2 rounded-lg w-full justify-center">
              Unarchive
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

/* --- Full page render --- */

export async function itemDetailPage(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const id = c.req.param('id')!;
  const store = c.get('store');
  const [item, types] = await Promise.all([store.get(id), store.listTypes()]);

  if (!item) {
    return c.html(<p>Item not found.</p>, 404);
  }
  const currentType = types.find((t) => t.id === item.typeId);
  const actions = currentType?.actions ?? [];
  const csrfToken = getCsrfToken(c);
  const sourceUrl = new URL(c.req.url).origin;
  const workspace = item.workspaceId ? await store.getWorkspace(item.workspaceId) : null;
  const renderedContent = renderMarkdown(item.content);

  return c.html(
    <AppLayout title={item.keySummary} currentPath="/pignal/items" csrfToken={csrfToken}>
      {/* Back navigation */}
      <nav class="mb-6">
        <a href="/pignal/items" class="inline-flex items-center gap-1 text-sm text-muted hover:text-primary transition-colors px-3 py-1.5 rounded-full hover:bg-surface-hover">
          <IconChevronLeft size={14} />
          Back to items
        </a>
      </nav>

      <div class="flex flex-col lg:flex-row gap-8">
        {/* Main content — no card wrapper, let content breathe */}
        <div class="flex-1 min-w-0">
          {/* Metadata badges */}
          <div class="flex items-center gap-2 text-xs text-muted flex-wrap mb-3">
            <TypeBadge typeName={item.typeName} />
            <VisibilityBadge visibility={item.visibility ?? 'private'} />
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
          <ValidationPanel
            id={id}
            actions={actions}
            currentActionLabel={item.validationActionLabel}
            csrfToken={csrfToken}
          />
          <VisibilityPanel
            id={id}
            visibility={item.visibility ?? 'private'}
            shareToken={item.shareToken}
            slug={item.slug}
            sourceUrl={sourceUrl}
            csrfToken={csrfToken}
            workspaceVisibility={workspace?.visibility ?? null}
            workspaceName={item.workspaceName}
          />
          <ActionsPanel
            id={id}
            isArchived={item.isArchived === 1}
            isPinned={!!item.pinnedAt}
            csrfToken={csrfToken}
          />
        </aside>
      </div>
    </AppLayout>
  );
}

/* --- HTMX-aware POST handlers --- */

export async function validateHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const id = c.req.param('id')!;
  const store = c.get('store');
  const body = await c.req.parseBody();
  const actionId = (body.actionId as string) || null;
  await store.validate(id, actionId || null);

  if (isHtmxRequest(c)) {
    const [item, types] = await Promise.all([store.get(id), store.listTypes()]);
    const currentType = types.find((t) => t.id === item!.typeId);
    const actions = currentType?.actions ?? [];
    const csrfToken = getCsrfToken(c);

    c.header('HX-Trigger', toastTrigger(actionId ? 'Validation updated' : 'Validation cleared'));
    return c.html(
      <ValidationPanel
        id={id}
        actions={actions}
        currentActionLabel={item!.validationActionLabel}
        csrfToken={csrfToken}
      />
    );
  }
  return c.redirect(`/pignal/items/${id}`);
}

export async function archiveHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const id = c.req.param('id')!;
  const store = c.get('store');
  const item = await store.archive(id);

  if (isHtmxRequest(c)) {
    const csrfToken = getCsrfToken(c);
    c.header('HX-Trigger', toastTrigger('Item archived'));
    return c.html(<ActionsPanel id={id} isArchived={true} isPinned={!!item?.pinnedAt} csrfToken={csrfToken} />);
  }
  return c.redirect(`/pignal/items/${id}`);
}

export async function unarchiveHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const id = c.req.param('id')!;
  const store = c.get('store');
  const item = await store.unarchive(id);

  if (isHtmxRequest(c)) {
    const csrfToken = getCsrfToken(c);
    c.header('HX-Trigger', toastTrigger('Item unarchived'));
    return c.html(<ActionsPanel id={id} isArchived={false} isPinned={!!item?.pinnedAt} csrfToken={csrfToken} />);
  }
  return c.redirect(`/pignal/items/${id}`);
}

export async function pinHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const id = c.req.param('id')!;
  const store = c.get('store');
  const item = await store.pin(id);

  if (isHtmxRequest(c)) {
    const csrfToken = getCsrfToken(c);
    c.header('HX-Trigger', toastTrigger('Item pinned'));
    return c.html(<ActionsPanel id={id} isArchived={item?.isArchived === 1} isPinned={true} csrfToken={csrfToken} />);
  }
  return c.redirect(`/pignal/items/${id}`);
}

export async function unpinHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const id = c.req.param('id')!;
  const store = c.get('store');
  const item = await store.unpin(id);

  if (isHtmxRequest(c)) {
    const csrfToken = getCsrfToken(c);
    c.header('HX-Trigger', toastTrigger('Item unpinned'));
    return c.html(<ActionsPanel id={id} isArchived={item?.isArchived === 1} isPinned={false} csrfToken={csrfToken} />);
  }
  return c.redirect(`/pignal/items/${id}`);
}

export async function visibilityHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const id = c.req.param('id')!;
  const store = c.get('store');
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

  const visibility = rawVisibility as 'private' | 'unlisted' | 'vouched';

  await store.vouch(id, { visibility });

  if (isHtmxRequest(c)) {
    const item = await store.get(id);
    const sourceUrl = new URL(c.req.url).origin;
    const csrfToken = getCsrfToken(c);
    const workspace = item!.workspaceId ? await store.getWorkspace(item!.workspaceId) : null;

    c.header('HX-Trigger', toastTrigger('Visibility updated'));
    return c.html(
      <VisibilityPanel
        id={id}
        visibility={item!.visibility ?? 'private'}
        shareToken={item!.shareToken}
        slug={item!.slug}
        sourceUrl={sourceUrl}
        csrfToken={csrfToken}
        workspaceVisibility={workspace?.visibility ?? null}
        workspaceName={item!.workspaceName}
      />
    );
  }
  return c.redirect(`/pignal/items/${id}`);
}
