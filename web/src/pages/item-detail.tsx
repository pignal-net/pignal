import type { Context } from 'hono';
import type { ItemStoreRpc } from '@pignal/db';
import type { WebEnv } from '../types';
import type { TypeActionSelect } from '@pignal/db';
import { AppLayout } from '../components/app-layout';
import { TypeBadge } from '../components/type-badge';
import { VisibilityBadge } from '../components/visibility-badge';
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
    <article id="validation-section">
      <h3>Validation</h3>
      <p>
        {currentActionLabel
          ? <strong>{currentActionLabel}</strong>
          : <em class="muted">Not validated</em>}
      </p>
      {actions.length > 0 && (
        <div class="action-row">
          {actions.map((action) => (
            <form method="post" action={`/pignal/items/${id}/validate`}
              hx-post={`/pignal/items/${id}/validate`}
              hx-target="#validation-section"
              hx-swap="outerHTML">
              <input type="hidden" name="_csrf" value={csrfToken} />
              <input type="hidden" name="actionId" value={action.id} />
              <button type="submit" class="outline btn-sm">
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
            <button type="submit" class="outline secondary btn-sm">
              Clear
            </button>
          </form>
        </div>
      )}
    </article>
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
    <article id="visibility-section">
      <h3>Visibility</h3>
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
        <button type="submit" class="outline btn-sm">Update</button>
      </form>
      {visibility === 'unlisted' && shareToken && (
        <div class="share-info">
          <small>Share: <code>{sourceUrl}/s/{shareToken}</code></small>
        </div>
      )}
      {visibility === 'vouched' && slug && (
        <div class="share-info">
          <small>Source: <a href={`/item/${slug}`}>{sourceUrl}/item/{slug}</a></small>
          {workspaceVisibility === 'private' && workspaceName && (
            <small class="warning-note" style="display:block;color:var(--pico-color-red-500,#dc3545);margin-top:0.25rem;">
              Workspace "{workspaceName}" is private. Change it to public in <a href="/pignal/workspaces">Workspace Settings</a> so others can see this item.
            </small>
          )}
        </div>
      )}
    </article>
  );
}

function ActionsPanel({ id, isArchived, isPinned, csrfToken }: {
  id: string;
  isArchived: boolean;
  isPinned: boolean;
  csrfToken: string;
}) {
  return (
    <article id="actions-section">
      <h3>Actions</h3>
      <div class="action-row">
        {!isPinned ? (
          <form method="post" action={`/pignal/items/${id}/pin`}
            hx-post={`/pignal/items/${id}/pin`}
            hx-target="#actions-section"
            hx-swap="outerHTML">
            <input type="hidden" name="_csrf" value={csrfToken} />
            <button type="submit" class="outline btn-sm">
              Pin
            </button>
          </form>
        ) : (
          <form method="post" action={`/pignal/items/${id}/unpin`}
            hx-post={`/pignal/items/${id}/unpin`}
            hx-target="#actions-section"
            hx-swap="outerHTML">
            <input type="hidden" name="_csrf" value={csrfToken} />
            <button type="submit" class="outline btn-sm">
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
            <button type="submit" class="secondary btn-sm">
              Archive
            </button>
          </form>
        ) : (
          <form method="post" action={`/pignal/items/${id}/unarchive`}
            hx-post={`/pignal/items/${id}/unarchive`}
            hx-target="#actions-section"
            hx-swap="outerHTML">
            <input type="hidden" name="_csrf" value={csrfToken} />
            <button type="submit" class="secondary btn-sm">
              Unarchive
            </button>
          </form>
        )}
      </div>
    </article>
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
      <nav class="breadcrumb">
        <a href="/pignal/items">&larr; Back to items</a>
      </nav>

      <div class="detail-layout">
        <article>
          <header>
            <h1>{item.keySummary}</h1>
            <div class="post-meta">
              <TypeBadge typeName={item.typeName} />
              <VisibilityBadge visibility={item.visibility ?? 'private'} />
              {item.workspaceName && <span>{item.workspaceName}</span>}
              <time datetime={item.createdAt}>{formatDate(item.createdAt)}</time>
              <span>Source: {item.sourceAi}</span>
            </div>
          </header>
          <div class="content">
            {raw(renderedContent)}
          </div>
          {item.tags && item.tags.length > 0 && (
            <footer class="item-tags-footer">
              <div class="item-tags">
                {item.tags.map((t) => (
                  <a href={`/pignal/items?tag=${encodeURIComponent(t)}`} class="item-tag">#{t}</a>
                ))}
              </div>
            </footer>
          )}
        </article>

        <aside class="detail-sidebar">
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
