import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

import type { Context } from 'hono';

import type { ActionStoreRpc, SiteActionSettings } from '@pignal/db';

/**
 * Configuration for public form routes (no auth required).
 * - `getActionStore`: How to obtain an ActionStoreRpc for the current request
 */
export interface FormRouteConfig {
  getActionStore: (c: Context) => ActionStoreRpc;
}

/** Hash an IP address using SHA-256 via the Web Crypto API. */
async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Parse form body from either JSON or form-encoded content types. */
async function parseFormBody(c: Context): Promise<Record<string, string>> {
  const contentType = c.req.header('Content-Type') ?? '';

  if (
    contentType.includes('application/x-www-form-urlencoded') ||
    contentType.includes('multipart/form-data')
  ) {
    const parsed = await c.req.parseBody();
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'string') {
        result[key] = value;
      }
    }
    return result;
  }

  return c.req.json<Record<string, string>>();
}

/**
 * Create public routes for form rendering and submission (no auth required).
 * These routes are intended to be rate-limited by the consumer.
 */
export function createFormRoutes(config: FormRouteConfig) {
  const router = new Hono();

  // GET /:slug — Get form definition (JSON)
  router.get('/:slug', async (c) => {
    const store = config.getActionStore(c);
    const slug = c.req.param('slug');

    const action = await store.getActionBySlug(slug);

    if (!action || action.status !== 'active') {
      throw new HTTPException(404, { message: 'Form not found' });
    }

    return c.json({
      id: action.id,
      name: action.name,
      slug: action.slug,
      description: action.description,
      fields: JSON.parse(action.fields),
      settings: JSON.parse(action.settings),
    });
  });

  // POST /:slug — Submit form
  router.post('/:slug', async (c) => {
    const store = config.getActionStore(c);
    const slug = c.req.param('slug');

    // Parse body (supports JSON and form-encoded)
    let data: Record<string, string>;
    try {
      data = await parseFormBody(c);
    } catch {
      throw new HTTPException(400, { message: 'Invalid request body' });
    }

    // Build submission metadata
    const rawIp = c.req.header('CF-Connecting-IP') ?? c.req.header('X-Forwarded-For') ?? '';
    const ipHash = rawIp ? await hashIP(rawIp) : undefined;
    const referrer = c.req.header('Referer') ?? undefined;

    try {
      const submission = await store.submitForm(slug, data, { ipHash, referrer });

      // Determine success message from action settings
      const action = await store.getActionBySlug(slug);
      let successMessage = 'Thank you! Your submission has been received.';
      if (action) {
        const settings: SiteActionSettings = JSON.parse(action.settings);
        if (settings.success_message) {
          successMessage = settings.success_message;
        }
      }

      // Check if this is an HTMX request
      const isHtmx = c.req.header('HX-Request') === 'true';

      if (isHtmx) {
        c.header('Content-Type', 'text/html; charset=utf-8');
        return c.body(`<div class="flash flash-success">${escapeHtml(successMessage)}</div>`);
      }

      return c.json({ success: true, id: submission.id });
    } catch (err) {
      if (err instanceof Error) {
        // Validation errors from ActionStore
        if (
          err.message.includes('is required') ||
          err.message.includes('exceeds maximum') ||
          err.message.includes('Validation error')
        ) {
          throw new HTTPException(400, { message: err.message });
        }
        // Action not found or not active
        if (err.message.includes('not found') || err.message.includes('not accepting')) {
          throw new HTTPException(404, { message: err.message });
        }
      }
      throw err;
    }
  });

  return router;
}

/** Escape HTML special characters to prevent XSS in HTMX responses. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
