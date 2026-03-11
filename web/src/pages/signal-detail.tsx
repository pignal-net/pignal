import type { Context } from 'hono';
import type { SignalStoreRpc } from '@pignal/db';
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

type WebVars = { store: SignalStoreRpc };

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
            <form method="post" action={`/pignal/signals/${id}/validate`}
              hx-post={`/pignal/signals/${id}/validate`}
              hx-target="#validation-section"
              hx-swap="outerHTML">
              <input type="hidden" name="_csrf" value={csrfToken} />
              <input type="hidden" name="actionId" value={action.id} />
              <button type="submit" class="outline btn-sm">
                {action.label}
              </button>
            </form>
          ))}
          <form method="post" action={`/pignal/signals/${id}/validate`}
            hx-post={`/pignal/signals/${id}/validate`}
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
      <form method="post" action={`/pignal/signals/${id}/visibility`}
        hx-post={`/pignal/signals/${id}/visibility`}
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
          <small>Source: <a href={`/signal/${slug}`}>{sourceUrl}/signal/{slug}</a></small>
          {workspaceVisibility === 'private' && workspaceName && (
            <small class="warning-note" style="display:block;color:var(--pico-color-red-500,#dc3545);margin-top:0.25rem;">
              Workspace "{workspaceName}" is private. Change it to public in <a href="/pignal/workspaces">Workspace Settings</a> so others can see this signal.
            </small>
          )}
        </div>
      )}
    </article>
  );
}

function ActionsPanel({ id, isArchived, csrfToken }: {
  id: string;
  isArchived: boolean;
  csrfToken: string;
}) {
  return (
    <article id="actions-section">
      <h3>Actions</h3>
      <div class="action-row">
        {!isArchived ? (
          <form method="post" action={`/pignal/signals/${id}/archive`}
            hx-post={`/pignal/signals/${id}/archive`}
            hx-target="#actions-section"
            hx-swap="outerHTML">
            <input type="hidden" name="_csrf" value={csrfToken} />
            <button type="submit" class="secondary btn-sm">
              Archive
            </button>
          </form>
        ) : (
          <form method="post" action={`/pignal/signals/${id}/unarchive`}
            hx-post={`/pignal/signals/${id}/unarchive`}
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

export async function signalDetailPage(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const id = c.req.param('id')!;
  const store = c.get('store');
  const [signal, types] = await Promise.all([store.get(id), store.listTypes()]);

  if (!signal) {
    return c.html(<p>Signal not found.</p>, 404);
  }
  const currentType = types.find((t) => t.id === signal.typeId);
  const actions = currentType?.actions ?? [];
  const csrfToken = getCsrfToken(c);
  const sourceUrl = new URL(c.req.url).origin;
  const workspace = signal.workspaceId ? await store.getWorkspace(signal.workspaceId) : null;
  const renderedContent = renderMarkdown(signal.content);

  return c.html(
    <AppLayout title={signal.keySummary} currentPath="/pignal/signals" csrfToken={csrfToken} showTitle={false}>
      <nav class="breadcrumb">
        <a href="/pignal/signals">&larr; Back to signals</a>
      </nav>

      <div class="detail-layout">
        <article>
          <header>
            <h1>{signal.keySummary}</h1>
            <div class="post-meta">
              <TypeBadge typeName={signal.typeName} />
              <VisibilityBadge visibility={signal.visibility ?? 'private'} />
              {signal.workspaceName && <span>{signal.workspaceName}</span>}
              <time datetime={signal.createdAt}>{formatDate(signal.createdAt)}</time>
              <span>Source: {signal.sourceAi}</span>
            </div>
          </header>
          <div class="content">
            {raw(renderedContent)}
          </div>
          {signal.tags && signal.tags.length > 0 && (
            <footer class="signal-tags-footer">
              <div class="signal-tags">
                {signal.tags.map((t) => (
                  <a href={`/pignal/signals?tag=${encodeURIComponent(t)}`} class="signal-tag">#{t}</a>
                ))}
              </div>
            </footer>
          )}
        </article>

        <aside class="detail-sidebar">
          <ValidationPanel
            id={id}
            actions={actions}
            currentActionLabel={signal.validationActionLabel}
            csrfToken={csrfToken}
          />
          <VisibilityPanel
            id={id}
            visibility={signal.visibility ?? 'private'}
            shareToken={signal.shareToken}
            slug={signal.slug}
            sourceUrl={sourceUrl}
            csrfToken={csrfToken}
            workspaceVisibility={workspace?.visibility ?? null}
            workspaceName={signal.workspaceName}
          />
          <ActionsPanel
            id={id}
            isArchived={signal.isArchived === 1}
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
    const [signal, types] = await Promise.all([store.get(id), store.listTypes()]);
    const currentType = types.find((t) => t.id === signal!.typeId);
    const actions = currentType?.actions ?? [];
    const csrfToken = getCsrfToken(c);

    c.header('HX-Trigger', toastTrigger(actionId ? 'Validation updated' : 'Validation cleared'));
    return c.html(
      <ValidationPanel
        id={id}
        actions={actions}
        currentActionLabel={signal!.validationActionLabel}
        csrfToken={csrfToken}
      />
    );
  }
  return c.redirect(`/pignal/signals/${id}`);
}

export async function archiveHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const id = c.req.param('id')!;
  const store = c.get('store');
  await store.archive(id);

  if (isHtmxRequest(c)) {
    const csrfToken = getCsrfToken(c);
    c.header('HX-Trigger', toastTrigger('Signal archived'));
    return c.html(<ActionsPanel id={id} isArchived={true} csrfToken={csrfToken} />);
  }
  return c.redirect(`/pignal/signals/${id}`);
}

export async function unarchiveHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const id = c.req.param('id')!;
  const store = c.get('store');
  await store.unarchive(id);

  if (isHtmxRequest(c)) {
    const csrfToken = getCsrfToken(c);
    c.header('HX-Trigger', toastTrigger('Signal unarchived'));
    return c.html(<ActionsPanel id={id} isArchived={false} csrfToken={csrfToken} />);
  }
  return c.redirect(`/pignal/signals/${id}`);
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
    const signal = await store.get(id);
    const sourceUrl = new URL(c.req.url).origin;
    const csrfToken = getCsrfToken(c);
    const workspace = signal!.workspaceId ? await store.getWorkspace(signal!.workspaceId) : null;

    c.header('HX-Trigger', toastTrigger('Visibility updated'));
    return c.html(
      <VisibilityPanel
        id={id}
        visibility={signal!.visibility ?? 'private'}
        shareToken={signal!.shareToken}
        slug={signal!.slug}
        sourceUrl={sourceUrl}
        csrfToken={csrfToken}
        workspaceVisibility={workspace?.visibility ?? null}
        workspaceName={signal!.workspaceName}
      />
    );
  }
  return c.redirect(`/pignal/signals/${id}`);
}
