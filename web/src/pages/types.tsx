import type { Context } from 'hono';
import type { ItemStoreRpc, TypeGuidance, ItemTypeWithActions } from '@pignal/db';
import type { WebEnv } from '../types';
import { AppLayout } from '../components/app-layout';
import { getCsrfToken } from '../middleware/csrf';
import { isHtmxRequest, toastTrigger } from '../lib/htmx';
import { TypeBadge } from '../components/type-badge';

type WebVars = { store: ItemStoreRpc };

function TypeCard({ type, csrfToken }: { type: ItemTypeWithActions; csrfToken: string }) {
  const guidance = type.guidance;

  if (type.isSystem) {
    return (
      <div id={`type-${type.id}`} class="bg-surface rounded-xl border border-border-subtle shadow-card p-6 mb-5">
        <div class="flex items-center gap-3 mb-4">
          <TypeBadge typeName={type.name} color={type.color ?? undefined} />
          <span class="text-xs text-muted bg-muted/10 px-2 py-0.5 rounded-full">System</span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <label>
            Name
            <input type="text" value={type.name} disabled />
          </label>
          <label>
            Description
            <input type="text" value={type.description ?? ''} disabled />
          </label>
          <label>
            Icon
            <input type="text" value={type.icon ?? ''} disabled />
          </label>
        </div>
        {guidance && (
          <details class="mt-4">
            <summary class="text-sm font-medium text-muted cursor-pointer">
              AI Guidance
              <span class="ml-1 text-xs text-muted/60">&rsaquo;</span>
            </summary>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
              <label>
                When to use
                <input type="text" value={guidance.whenToUse ?? ''} disabled />
              </label>
              <label>
                keySummary pattern
                <input type="text" value={guidance.pattern ?? ''} disabled />
              </label>
            </div>
            <label class="mt-3">
              Example
              <textarea disabled rows={2}>{guidance.example ?? ''}</textarea>
            </label>
            <label class="mt-3">
              Content hints
              <input type="text" value={guidance.contentHints ?? ''} disabled />
            </label>
          </details>
        )}
        {type.actions.length > 0 && (
          <p class="mt-3 text-xs text-muted"><strong>Actions:</strong> {type.actions.map((a) => a.label).join(', ')}</p>
        )}
      </div>
    );
  }

  return (
    <div id={`type-${type.id}`} class="bg-surface rounded-xl border border-border-subtle shadow-card p-6 mb-5">
      <form method="post" action={`/pignal/types/${type.id}/update`}
        hx-post={`/pignal/types/${type.id}/update`}
        hx-target={`#type-${type.id}`}
        hx-swap="outerHTML">
        <input type="hidden" name="_csrf" value={csrfToken} />
        <div class="flex items-center gap-3 mb-4">
          <TypeBadge typeName={type.name} color={type.color ?? undefined} />
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label>
            Name
            <input type="text" name="name" value={type.name} required maxlength={50} />
          </label>
          <label>
            Description
            <input type="text" name="description" value={type.description ?? ''} maxlength={500} />
          </label>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
          <label>
            Color
            <input type="color" name="color" value={type.color ?? '#6B7280'} />
          </label>
          <label>
            Icon
            <input type="text" name="icon" value={type.icon ?? ''} maxlength={10} placeholder="e.g. 💡" />
          </label>
        </div>

        <details class="mt-4">
          <summary class="text-sm font-medium text-muted cursor-pointer">
            AI Guidance
            <span class="ml-1 text-xs text-muted/60">&rsaquo;</span>
          </summary>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
            <label>
              When to use
              <input type="text" name="guidance_whenToUse" value={guidance?.whenToUse ?? ''} maxlength={500} />
            </label>
            <label>
              keySummary pattern
              <input type="text" name="guidance_pattern" value={guidance?.pattern ?? ''} maxlength={500} />
            </label>
          </div>
          <label class="mt-3">
            Example
            <textarea name="guidance_example" maxlength={1000} rows={2}>{guidance?.example ?? ''}</textarea>
          </label>
          <label class="mt-3">
            Content hints
            <input type="text" name="guidance_contentHints" value={guidance?.contentHints ?? ''} maxlength={500} />
          </label>
        </details>

        {type.actions.length > 0 && (
          <p class="mt-3 text-xs text-muted"><strong>Actions:</strong> {type.actions.map((a) => a.label).join(', ')}</p>
        )}

        <div class="flex gap-2 justify-end mt-4">
          <button type="button" class="outline secondary text-xs px-3 py-1.5"
            hx-post={`/pignal/types/${type.id}/delete`}
            hx-target={`#type-${type.id}`}
            hx-swap="outerHTML"
            hx-confirm="Delete this type?"
            hx-include="closest form">
            Delete
          </button>
          <button type="submit" class="text-xs px-3 py-1.5">Save</button>
        </div>
      </form>
    </div>
  );
}

function parseGuidanceFromBody(body: Record<string, unknown>): TypeGuidance | null {
  const whenToUse = ((body.guidance_whenToUse as string) || '').trim();
  const pattern = ((body.guidance_pattern as string) || '').trim();
  const example = ((body.guidance_example as string) || '').trim();
  const contentHints = ((body.guidance_contentHints as string) || '').trim();

  if (!whenToUse && !pattern && !example && !contentHints) {
    return null;
  }

  return {
    ...(whenToUse ? { whenToUse } : {}),
    ...(pattern ? { pattern } : {}),
    ...(example ? { example } : {}),
    ...(contentHints ? { contentHints } : {}),
  };
}

export async function typesPage(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const store = c.get('store');
  const types = await store.listTypes();
  const csrfToken = getCsrfToken(c);
  const flash = c.req.query('success') ? { type: 'success' as const, message: c.req.query('success')! } :
    c.req.query('error') ? { type: 'error' as const, message: c.req.query('error')! } : undefined;

  return c.html(
    <AppLayout
      title="Types"
      currentPath="/pignal/types"
      csrfToken={csrfToken}
      flash={flash}
    >
      <div class="mb-8">
        <h1 class="text-2xl font-bold tracking-tight">Types</h1>
        <p class="text-muted text-sm mt-1">Define categories and validation actions for your signals</p>
      </div>

      <div class="border-2 border-dashed border-border hover:border-primary/30 transition-colors rounded-xl p-6 mb-8">
        <h2 class="text-base font-semibold mb-4">Create Type</h2>
        <form method="post" action="/pignal/types"
          hx-post="/pignal/types"
          hx-target="#types-list"
          hx-swap="beforeend"
          data-reset-on-success>
          <input type="hidden" name="_csrf" value={csrfToken} />
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label>
              Name
              <input type="text" name="name" required maxlength={50} />
            </label>
            <label>
              Description
              <input type="text" name="description" maxlength={500} />
            </label>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
            <label>
              Color
              <input type="color" name="color" value="#6B7280" />
            </label>
            <label>
              Icon
              <input type="text" name="icon" maxlength={10} placeholder="e.g. 💡" />
            </label>
          </div>

          <details class="mt-4">
            <summary class="text-sm font-medium text-muted cursor-pointer">
              AI Guidance
              <span class="ml-1 text-xs text-muted/60">&rsaquo;</span>
            </summary>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
              <label>
                When to use
                <input type="text" name="guidance_whenToUse" maxlength={500} />
              </label>
              <label>
                keySummary pattern
                <input type="text" name="guidance_pattern" maxlength={500} />
              </label>
            </div>
            <label class="mt-3">
              Example
              <textarea name="guidance_example" maxlength={1000} rows={2}></textarea>
            </label>
            <label class="mt-3">
              Content hints
              <input type="text" name="guidance_contentHints" maxlength={500} />
            </label>
          </details>

          <label class="mt-4">
            Actions (comma-separated labels)
            <input type="text" name="actions" required placeholder="e.g. Confirmed, Wrong, Uncertain" />
          </label>
          <button type="submit" class="mt-2">Create Type</button>
        </form>
      </div>

      <div id="types-list">
        {types.map((type) => (
          <TypeCard type={type} csrfToken={csrfToken} />
        ))}
      </div>
    </AppLayout>
  );
}

export async function createTypeHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const store = c.get('store');
  const body = await c.req.parseBody();

  const name = (body.name as string || '').trim();
  const description = (body.description as string || '').trim();
  const color = body.color as string || undefined;
  const icon = ((body.icon as string) || '').trim() || undefined;
  const guidance = parseGuidanceFromBody(body as Record<string, unknown>);
  const actionsStr = (body.actions as string || '').trim();

  if (!name || !actionsStr) {
    if (isHtmxRequest(c)) {
      c.header('HX-Trigger', toastTrigger('Name and actions are required', 'error'));
      c.header('HX-Reswap', 'none');
      return c.body(null, 204);
    }
    return c.redirect('/pignal/types?error=Name+and+actions+are+required');
  }

  const actions = actionsStr.split(',').map((a, i) => ({
    label: a.trim(),
    sortOrder: i,
  })).filter((a) => a.label);

  if (actions.length === 0) {
    if (isHtmxRequest(c)) {
      c.header('HX-Trigger', toastTrigger('At least one action is required', 'error'));
      c.header('HX-Reswap', 'none');
      return c.body(null, 204);
    }
    return c.redirect('/pignal/types?error=At+least+one+action+is+required');
  }

  const typeId = crypto.randomUUID();

  try {
    const created = await store.createType({
      id: typeId,
      name,
      description: description || undefined,
      color,
      icon,
      guidance: guidance ?? undefined,
      actions,
    });

    if (isHtmxRequest(c)) {
      c.header('HX-Trigger', toastTrigger('Type created'));
      const csrfToken = getCsrfToken(c);
      return c.html(
        <TypeCard type={created} csrfToken={csrfToken} />
      );
    }
    return c.redirect('/pignal/types?success=Type+created');
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create type';
    if (isHtmxRequest(c)) {
      c.header('HX-Trigger', toastTrigger(msg, 'error'));
      c.header('HX-Reswap', 'none');
      return c.body(null, 204);
    }
    return c.redirect(`/pignal/types?error=${encodeURIComponent(msg)}`);
  }
}

export async function updateTypeHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const id = c.req.param('id')!;
  const store = c.get('store');
  const body = await c.req.parseBody();

  const name = (body.name as string || '').trim();
  const description = (body.description as string || '').trim();
  const color = ((body.color as string) || '').trim() || null;
  const icon = ((body.icon as string) || '').trim() || null;
  const guidance = parseGuidanceFromBody(body as Record<string, unknown>);

  try {
    const updated = await store.updateType(id, {
      ...(name ? { name } : {}),
      description: description || undefined,
      color,
      icon,
      guidance,
    });

    if (!updated) {
      if (isHtmxRequest(c)) {
        c.header('HX-Trigger', toastTrigger('Type not found', 'error'));
        c.header('HX-Reswap', 'none');
        return c.body(null, 204);
      }
      return c.redirect('/pignal/types?error=Type+not+found');
    }

    if (isHtmxRequest(c)) {
      c.header('HX-Trigger', toastTrigger('Type updated'));
      const csrfToken = getCsrfToken(c);
      return c.html(
        <TypeCard type={updated} csrfToken={csrfToken} />
      );
    }
    return c.redirect('/pignal/types?success=Type+updated');
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update type';
    if (isHtmxRequest(c)) {
      c.header('HX-Trigger', toastTrigger(msg, 'error'));
      c.header('HX-Reswap', 'none');
      return c.body(null, 204);
    }
    return c.redirect(`/pignal/types?error=${encodeURIComponent(msg)}`);
  }
}

export async function deleteTypeHandler(c: Context<{ Bindings: WebEnv; Variables: WebVars }>) {
  const id = c.req.param('id')!;
  const store = c.get('store');

  try {
    const deleted = await store.deleteType(id);
    if (!deleted) {
      if (isHtmxRequest(c)) {
        c.header('HX-Trigger', toastTrigger('Type not found', 'error'));
        c.header('HX-Reswap', 'none');
        return c.body(null, 204);
      }
      return c.redirect('/pignal/types?error=Type+not+found');
    }
    if (isHtmxRequest(c)) {
      c.header('HX-Trigger', toastTrigger('Type deleted'));
      return c.html('');
    }
    return c.redirect('/pignal/types?success=Type+deleted');
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to delete type';
    if (isHtmxRequest(c)) {
      c.header('HX-Trigger', toastTrigger(msg, 'error'));
      c.header('HX-Reswap', 'none');
      return c.body(null, 204);
    }
    return c.redirect(`/pignal/types?error=${encodeURIComponent(msg)}`);
  }
}
