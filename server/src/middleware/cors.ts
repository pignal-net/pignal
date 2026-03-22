import type { Context, Next } from 'hono';
import { cors } from 'hono/cors';

import type { Env } from '../types';

/**
 * CORS middleware that respects the CORS_ORIGIN env var.
 *
 * - Unset / empty: same-origin only (no CORS headers added for cross-origin requests)
 * - "*": allow all origins (current default for backwards compatibility)
 * - Comma-separated list: allow only those origins (e.g., "https://app.example.com,https://admin.example.com")
 */
export function corsMiddleware() {
  // Cache the resolved Hono cors handler per CORS_ORIGIN value
  let cachedOrigin: string | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cachedHandler: ((c: any, next: any) => any) | null = null;

  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const corsOrigin = c.env.CORS_ORIGIN;

    // No CORS_ORIGIN set — same-origin only, skip CORS headers
    if (!corsOrigin) {
      await next();
      return;
    }

    // Rebuild handler only when env var changes (rare)
    if (corsOrigin !== cachedOrigin) {
      cachedOrigin = corsOrigin;

      if (corsOrigin === '*') {
        cachedHandler = cors();
      } else {
        const allowed = new Set(corsOrigin.split(',').map((s) => s.trim()).filter(Boolean));
        cachedHandler = cors({
          origin: (origin) => (allowed.has(origin) ? origin : ''),
        });
      }
    }

    return cachedHandler!(c, next);
  };
}
