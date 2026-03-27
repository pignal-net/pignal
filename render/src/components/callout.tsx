/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */

/** Escape HTML special characters for safe rendering in raw HTML strings. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

interface CalloutConfig {
  bgStyle: string;
  borderStyle: string;
  colorClass: string;
  label: string;
  icon: string;
}

const CALLOUT_TYPES: Record<string, CalloutConfig> = {
  info: {
    bgStyle: 'background: color-mix(in srgb, var(--color-info) 10%, transparent)',
    borderStyle: 'border-color: color-mix(in srgb, var(--color-info) 25%, transparent)',
    colorClass: 'text-info',
    label: 'Info',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  },
  warning: {
    bgStyle: 'background: color-mix(in srgb, var(--color-warning) 10%, transparent)',
    borderStyle: 'border-color: color-mix(in srgb, var(--color-warning) 25%, transparent)',
    colorClass: 'text-warning',
    label: 'Warning',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  },
  success: {
    bgStyle: 'background: color-mix(in srgb, var(--color-success) 10%, transparent)',
    borderStyle: 'border-color: color-mix(in srgb, var(--color-success) 25%, transparent)',
    colorClass: 'text-success',
    label: 'Success',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  },
  error: {
    bgStyle: 'background: color-mix(in srgb, var(--color-error) 10%, transparent)',
    borderStyle: 'border-color: color-mix(in srgb, var(--color-error) 25%, transparent)',
    colorClass: 'text-error',
    label: 'Error',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
  },
  tip: {
    bgStyle: 'background: color-mix(in srgb, #3B82F6 10%, transparent)',
    borderStyle: 'border-color: color-mix(in srgb, #3B82F6 25%, transparent)',
    colorClass: 'text-[#3B82F6]',
    label: 'Tip',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z"/></svg>',
  },
};

/**
 * Render a callout box as an HTML string for directive embedding.
 *
 * @param type - Callout type: info, warning, success, error, or tip
 * @param text - The callout message text
 * @param title - Optional custom title (defaults to the type name capitalized)
 */
export function renderCalloutHtml(type: string, text: string, title?: string): string {
  const config = CALLOUT_TYPES[type] ?? CALLOUT_TYPES.info;
  const displayTitle = title ? escapeHtml(title) : config.label;
  const safeText = escapeHtml(text);

  return `<div class="flex gap-3 p-4 rounded-lg border" style="${config.bgStyle}; ${config.borderStyle}"><div class="${config.colorClass} shrink-0 mt-0.5">${config.icon}</div><div><p class="font-semibold text-sm ${config.colorClass}">${displayTitle}</p><p class="text-sm text-text mt-1">${safeText}</p></div></div>`;
}
