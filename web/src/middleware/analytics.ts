import type { Context, Next } from 'hono';
import type { D1Database } from '@cloudflare/workers-types';
import { drizzle } from 'drizzle-orm/d1';
import { pageViews } from '@pignal/db/schema';

/**
 * Analytics middleware for public pages.
 * Records page views asynchronously via waitUntil() to avoid blocking page rendering.
 * Only tracks GET requests to public pages (/, /item/:slug).
 */
export async function analyticsMiddleware(c: Context, next: Next) {
  await next();

  // Only track successful GET responses
  if (c.req.method !== 'GET' || c.res.status >= 400) return;

  const path = c.req.path;

  // Extract slug from /item/:slug paths
  let slug: string | null = null;
  const itemMatch = path.match(/^\/item\/([^/.]+)/);
  if (itemMatch) {
    slug = itemMatch[1];
  }

  const referrer = c.req.header('Referer') ?? null;
  const country = c.req.header('CF-IPCountry') ?? null;

  // Access D1 from the parent server's env (available at runtime via Hono's route mounting)
  const db = (c.env as { DB?: D1Database }).DB;
  if (!db) return;

  const insertView = async () => {
    try {
      const d1 = drizzle(db);
      await d1.insert(pageViews).values({
        path,
        slug,
        referrer,
        country,
      });
    } catch {
      // Silently fail — analytics should never break page rendering
    }
  };

  // Use waitUntil if available (Cloudflare Workers), otherwise fire and forget
  if (c.executionCtx && 'waitUntil' in c.executionCtx) {
    c.executionCtx.waitUntil(insertView());
  } else {
    void insertView();
  }
}
