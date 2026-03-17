import type { Context } from 'hono';

/**
 * Check if the current request is from HTMX.
 */
export function isHtmxRequest(c: Context): boolean {
  return c.req.header('HX-Request') === 'true';
}

/**
 * Build the HX-Trigger header value for a toast notification.
 * HTMX parses this as a custom event with detail data.
 */
export function toastTrigger(message: string, type: 'success' | 'error' = 'success'): string {
  return JSON.stringify({
    showToast: { message, type },
  });
}
