/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */
import type { SiteActionSelect } from '@pignal/db';
import type { SiteActionField, SiteActionSettings } from '@pignal/db';
import type { TFunction } from '../i18n/types';

interface ActionFormProps {
  action: SiteActionSelect;
  inline?: boolean;
  t?: TFunction;
}

const identity = (key: string) => key;

function escapeAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderField(field: SiteActionField, t: (key: string) => string, error?: string) {
  const requiredMark = field.required ? <span class="text-error">*</span> : null;
  const fieldId = `field-${field.name}`;
  const errorId = `${fieldId}-error`;
  const ariaProps = error
    ? { 'aria-invalid': 'true' as const, 'aria-describedby': errorId }
    : {};

  switch (field.type) {
    case 'textarea':
      return (
        <div class="mb-4">
          <label for={fieldId} class="block text-sm font-medium text-text mb-1">
            {field.label} {requiredMark}
          </label>
          <textarea
            id={fieldId}
            name={field.name}
            placeholder={field.placeholder ?? ''}
            maxlength={field.maxLength}
            required={field.required}
            class={`w-full rounded-lg border bg-bg px-3 py-2 text-sm text-text focus:border-primary focus:outline-none min-h-[120px] resize-y ${error ? 'border-error' : 'border-border'}`}
            {...ariaProps}
          />
          {error && <p id={errorId} class="text-error text-xs mt-1" role="alert">{error}</p>}
        </div>
      );

    case 'select':
      return (
        <div class="mb-4">
          <label class="block text-sm font-medium text-text mb-1">
            {field.label} {requiredMark}
          </label>
          <div class="form-dropdown">
            <button type="button" class="form-dropdown-trigger" aria-haspopup="listbox" {...ariaProps}>
              <span class="form-dropdown-label">{t('public.selectOption')}</span>
            </button>
            <ul role="listbox" class="form-dropdown-list">
              <li><button type="button" data-value="" data-label={t('public.selectOption')}>{t('public.selectOption')}</button></li>
              {(field.options ?? []).map((opt) => (
                <li><button type="button" data-value={opt.value} data-label={opt.label}>{opt.label}</button></li>
              ))}
            </ul>
            <input type="hidden" name={field.name} value="" />
          </div>
          {error && <p id={errorId} class="text-error text-xs mt-1" role="alert">{error}</p>}
        </div>
      );

    case 'checkbox':
      return (
        <div class="mb-4">
          <label class="inline-flex items-center gap-2 cursor-pointer">
            <input
              id={fieldId}
              type="checkbox"
              name={field.name}
              value="true"
              class="rounded border-border"
              {...ariaProps}
            />
            <span class="text-sm font-medium text-text">{field.label}</span>
          </label>
          {error && <p id={errorId} class="text-error text-xs mt-1" role="alert">{error}</p>}
        </div>
      );

    default: {
      // text, email, url, tel, number
      const inputType = ['email', 'url', 'tel', 'number'].includes(field.type) ? field.type : 'text';
      return (
        <div class="mb-4">
          <label for={fieldId} class="block text-sm font-medium text-text mb-1">
            {field.label} {requiredMark}
          </label>
          <input
            id={fieldId}
            type={inputType}
            name={field.name}
            placeholder={field.placeholder ?? ''}
            maxlength={field.maxLength}
            required={field.required}
            class={`w-full rounded-lg border bg-bg px-3 py-2 text-sm text-text focus:border-primary focus:outline-none ${error ? 'border-error' : 'border-border'}`}
            {...ariaProps}
          />
          {error && <p id={errorId} class="text-error text-xs mt-1" role="alert">{error}</p>}
        </div>
      );
    }
  }
}

export function ActionForm({ action, inline, t: tProp }: ActionFormProps) {
  const t = tProp ?? identity;
  let fields: SiteActionField[] = [];
  let settings: SiteActionSettings = {};

  try {
    fields = JSON.parse(action.fields) as SiteActionField[];
  } catch {
    // Leave as empty array
  }

  try {
    settings = JSON.parse(action.settings) as SiteActionSettings;
  } catch {
    // Leave as default
  }

  const formUrl = `/form/${escapeAttr(action.slug)}`;

  const formContent = (
    <>
      {fields.map((field) => renderField(field, t))}

      {settings.require_honeypot && (
        <div style="position:absolute;left:-9999px;opacity:0;height:0;overflow:hidden;" aria-hidden="true">
          <label>
            Leave this empty
            <input type="text" name="_honeypot" tabindex={-1} autocomplete="off" />
          </label>
        </div>
      )}

      <button
        type="submit"
        class="bg-primary text-primary-inverse rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary-hover transition-colors"
      >
        {action.name}
      </button>
    </>
  );

  return (
    <div class="bg-surface rounded-xl border border-border-subtle shadow-card p-6">
      {action.description && (
        <p class="text-sm text-muted mb-4">{action.description}</p>
      )}

      {inline ? (
        <form hx-post={formUrl} hx-swap="outerHTML">
          {formContent}
        </form>
      ) : (
        <form action={formUrl} method="post">
          {formContent}
        </form>
      )}
    </div>
  );
}

/**
 * Render an action form as an HTML string (for use inside processed markdown / directives).
 * Uses simple string construction instead of JSX since we need a plain string return.
 */
export function renderActionFormHtml(action: SiteActionSelect): string {
  let fields: SiteActionField[] = [];
  let settings: SiteActionSettings = {};

  try {
    fields = JSON.parse(action.fields) as SiteActionField[];
  } catch {
    // Leave as empty array
  }

  try {
    settings = JSON.parse(action.settings) as SiteActionSettings;
  } catch {
    // Leave as default
  }

  const slug = escapeAttr(action.slug);

  let fieldsHtml = '';
  for (const field of fields) {
    const requiredMark = field.required ? ' <span class="text-error">*</span>' : '';
    const requiredAttr = field.required ? ' required' : '';
    const placeholderAttr = field.placeholder ? ` placeholder="${escapeAttr(field.placeholder)}"` : '';
    const maxLengthAttr = field.maxLength ? ` maxlength="${field.maxLength}"` : '';
    const fieldId = `field-${escapeAttr(field.name)}`;
    const errorId = `${fieldId}-error`;

    switch (field.type) {
      case 'textarea':
        fieldsHtml += `<div class="mb-4"><label for="${fieldId}" class="block text-sm font-medium text-text mb-1">${escapeAttr(field.label)}${requiredMark}</label><textarea id="${fieldId}" name="${escapeAttr(field.name)}"${placeholderAttr}${maxLengthAttr}${requiredAttr} aria-describedby="${errorId}" class="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text focus:border-primary focus:outline-none min-h-[120px] resize-y"></textarea><p id="${errorId}" class="text-error text-xs mt-1 hidden" role="alert"></p></div>`;
        break;

      case 'select': {
        const opts = (field.options ?? [])
          .map((o) => `<li><button type="button" data-value="${escapeAttr(o.value)}" data-label="${escapeAttr(o.label)}">${escapeAttr(o.label)}</button></li>`)
          .join('');
        fieldsHtml += `<div class="mb-4"><label class="block text-sm font-medium text-text mb-1">${escapeAttr(field.label)}${requiredMark}</label><div class="form-dropdown"><button type="button" class="form-dropdown-trigger" aria-haspopup="listbox" aria-describedby="${errorId}"><span class="form-dropdown-label">Select...</span></button><ul role="listbox" class="form-dropdown-list"><li><button type="button" data-value="" data-label="Select...">Select...</button></li>${opts}</ul><input type="hidden" name="${escapeAttr(field.name)}" value="" /></div><p id="${errorId}" class="text-error text-xs mt-1 hidden" role="alert"></p></div>`;
        break;
      }

      case 'checkbox':
        fieldsHtml += `<div class="mb-4"><label class="inline-flex items-center gap-2 cursor-pointer"><input id="${fieldId}" type="checkbox" name="${escapeAttr(field.name)}" value="true" aria-describedby="${errorId}" class="rounded border-border" /><span class="text-sm font-medium text-text">${escapeAttr(field.label)}</span></label><p id="${errorId}" class="text-error text-xs mt-1 hidden" role="alert"></p></div>`;
        break;

      default: {
        const inputType = ['email', 'url', 'tel', 'number'].includes(field.type) ? field.type : 'text';
        fieldsHtml += `<div class="mb-4"><label for="${fieldId}" class="block text-sm font-medium text-text mb-1">${escapeAttr(field.label)}${requiredMark}</label><input id="${fieldId}" type="${inputType}" name="${escapeAttr(field.name)}"${placeholderAttr}${maxLengthAttr}${requiredAttr} aria-describedby="${errorId}" class="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text focus:border-primary focus:outline-none" /><p id="${errorId}" class="text-error text-xs mt-1 hidden" role="alert"></p></div>`;
      }
    }
  }

  const honeypotHtml = settings.require_honeypot
    ? '<div style="position:absolute;left:-9999px;opacity:0;height:0;overflow:hidden;" aria-hidden="true"><label>Leave this empty<input type="text" name="_honeypot" tabindex="-1" autocomplete="off" /></label></div>'
    : '';

  const descHtml = action.description
    ? `<p class="text-sm text-muted mb-4">${escapeAttr(action.description)}</p>`
    : '';

  return `<div class="bg-surface rounded-xl border border-border-subtle shadow-card p-6">${descHtml}<form hx-post="/form/${slug}" hx-swap="outerHTML">${fieldsHtml}${honeypotHtml}<button type="submit" class="bg-primary text-primary-inverse rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary-hover transition-colors">${escapeAttr(action.name)}</button></form></div>`;
}
