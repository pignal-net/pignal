import type { Context } from 'hono';
import type { ItemStoreRpc, WorkspaceSelect } from '@pignal/db';
import type { WebEnv } from '../types';
import { AppLayout } from '../components/app-layout';
import { getCsrfToken } from '../middleware/csrf';
import { isHtmxRequest, toastTrigger } from '../lib/htmx';

type WebVars = { store: ItemStoreRpc };

function WorkspaceCard({ ws }: { ws: WorkspaceSelect }) {
  return (
    <div id={`ws-${ws.id}`} class="bg-surface rounded-xl border border-border-subtle shadow-card p-6 mb-5">
      <div class="flex items-center gap-3 mb-4">
        <span class={`w-2 h-2 rounded-full ${ws.visibility === 'public' ? 'bg-success' : 'bg-muted/40'}`} />
        <span class="text-sm font-semibold">{ws.name}</span>
        {ws.isDefault && (
          <span class="text-xs text-muted bg-muted/10 px-2 py-0.5 rounded-full">Default</span>
        )}
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <label>
          Name
          <input type="text" data-ws-id={ws.id} data-ws-field="name" data-original={ws.name} value={ws.name} maxlength={100} />
        </label>
        <label>
          Description
          <input type="text" data-ws-id={ws.id} data-ws-field="description" data-original={ws.description ?? ''} value={ws.description ?? ''} maxlength={500} />
        </label>
        <label>
          Visibility
          <select data-ws-id={ws.id} data-ws-field="visibility" data-original={ws.visibility}>
            <option value="private" selected={ws.visibility === 'private'}>Private</option>
            <option value="public" selected={ws.visibility === 'public'}>Public</option>
          </select>
        </label>
      </div>
      {!ws.isDefault && (
        <div class="border-t border-border-subtle pt-4 mt-4 text-right">
          <button type="button" class="outline secondary text-xs px-3 py-1.5"
            hx-post={`/pignal/workspaces/${ws.id}/delete`}
            hx-target={`#ws-${ws.id}`}
            hx-swap="outerHTML"
            hx-confirm="Delete this workspace?"
            hx-include="#ws-csrf">
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export async function workspacesPage(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const store = c.get('store');
  const workspaces = await store.listWorkspaces();
  const csrfToken = getCsrfToken(c);
  const flash = c.req.query('success') ? { type: 'success' as const, message: c.req.query('success')! } :
    c.req.query('error') ? { type: 'error' as const, message: c.req.query('error')! } : undefined;

  return c.html(
    <AppLayout
      title="Workspaces"
      currentPath="/pignal/workspaces"
      csrfToken={csrfToken}
      flash={flash}
    >
      <div class="mb-8">
        <h1 class="text-2xl font-bold tracking-tight">Workspaces</h1>
        <p class="text-muted text-sm mt-1">Organize signals into workspaces with visibility controls</p>
      </div>

      <input type="hidden" id="ws-csrf" name="_csrf" value={csrfToken} />

      <div class="border-2 border-dashed border-border hover:border-primary/30 transition-colors rounded-xl p-6 mb-8">
        <h2 class="text-base font-semibold mb-4">Create Workspace</h2>
        <form method="post" action="/pignal/workspaces"
          hx-post="/pignal/workspaces"
          hx-target="#workspaces-list"
          hx-swap="beforeend"
          data-reset-on-success>
          <input type="hidden" name="_csrf" value={csrfToken} />
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label>
              Name
              <input type="text" name="name" required maxlength={100} />
            </label>
            <label>
              Description
              <input type="text" name="description" maxlength={500} />
            </label>
            <label>
              Visibility
              <select name="visibility">
                <option value="private" selected>Private</option>
                <option value="public">Public</option>
              </select>
            </label>
          </div>
          <button type="submit" class="mt-2">Create Workspace</button>
        </form>
      </div>

      <div id="workspaces-list">
        {workspaces.map((ws) => (
          <WorkspaceCard ws={ws} />
        ))}
      </div>

      <div id="ws-save-bar" class="save-bar" hidden>
        <div class="save-bar-content">
          <span class="save-bar-text">
            <strong id="ws-save-bar-count">0</strong> unsaved workspace changes
          </span>
          <div class="save-bar-actions">
            <button type="button" id="ws-save-bar-discard" class="outline secondary">Discard</button>
            <button type="button" id="ws-save-bar-save">Save All</button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export async function createWorkspaceHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const store = c.get('store');
  const body = await c.req.parseBody();

  const name = (body.name as string || '').trim();
  const description = (body.description as string || '').trim();
  const visibility = (body.visibility as string || 'private') === 'public' ? 'public' as const : 'private' as const;

  if (!name) {
    if (isHtmxRequest(c)) {
      c.header('HX-Trigger', toastTrigger('Name is required', 'error'));
      c.header('HX-Reswap', 'none');
      return c.body(null, 204);
    }
    return c.redirect('/pignal/workspaces?error=Name+is+required');
  }

  const wsId = crypto.randomUUID();

  try {
    const created = await store.createWorkspace({
      id: wsId,
      name,
      description: description || undefined,
      visibility,
    });

    if (isHtmxRequest(c)) {
      c.header('HX-Trigger', toastTrigger('Workspace created'));
      return c.html(<WorkspaceCard ws={created} />);
    }
    return c.redirect('/pignal/workspaces?success=Workspace+created');
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create workspace';
    if (isHtmxRequest(c)) {
      c.header('HX-Trigger', toastTrigger(msg, 'error'));
      c.header('HX-Reswap', 'none');
      return c.body(null, 204);
    }
    return c.redirect(`/pignal/workspaces?error=${encodeURIComponent(msg)}`);
  }
}

export async function batchUpdateWorkspacesHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  let items: Array<{ id: string; name?: string; description?: string; visibility?: string }>;
  try {
    const body = await c.req.json<{ workspaces: typeof items }>();
    items = body.workspaces;
  } catch {
    return c.json({ saved: [], errors: { _body: 'Invalid JSON body' } }, 400);
  }

  if (!Array.isArray(items)) {
    return c.json({ saved: [], errors: { _body: 'Missing "workspaces" array' } }, 400);
  }

  const store = c.get('store');
  const errors: Record<string, string> = {};

  const results = await Promise.all(
    items.map(async (ws) => {
      if (!ws.id) {
        errors['unknown'] = 'Missing workspace ID';
        return null;
      }
      const name = (ws.name ?? '').trim();
      const description = (ws.description ?? '').trim();
      const visibility = ws.visibility === 'public' ? 'public' as const : ws.visibility === 'private' ? 'private' as const : undefined;

      try {
        const updated = await store.updateWorkspace(ws.id, {
          ...(name ? { name } : {}),
          description: description || undefined,
          ...(visibility ? { visibility } : {}),
        });
        if (updated) {
          return ws.id;
        }
        errors[ws.id] = 'Workspace not found';
        return null;
      } catch (err) {
        errors[ws.id] = err instanceof Error ? err.message : 'Failed to update';
        return null;
      }
    })
  );

  const saved = results.filter((id): id is string => id !== null);

  return c.json({ saved, errors });
}

export async function deleteWorkspaceHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const id = c.req.param('id')!;
  const store = c.get('store');

  try {
    const deleted = await store.deleteWorkspace(id);
    if (!deleted) {
      if (isHtmxRequest(c)) {
        c.header('HX-Trigger', toastTrigger('Workspace not found', 'error'));
        c.header('HX-Reswap', 'none');
        return c.body(null, 204);
      }
      return c.redirect('/pignal/workspaces?error=Workspace+not+found');
    }
    if (isHtmxRequest(c)) {
      c.header('HX-Trigger', toastTrigger('Workspace deleted'));
      return c.html('');
    }
    return c.redirect('/pignal/workspaces?success=Workspace+deleted');
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to delete workspace';
    if (isHtmxRequest(c)) {
      c.header('HX-Trigger', toastTrigger(msg, 'error'));
      c.header('HX-Reswap', 'none');
      return c.body(null, 204);
    }
    return c.redirect(`/pignal/workspaces?error=${encodeURIComponent(msg)}`);
  }
}
