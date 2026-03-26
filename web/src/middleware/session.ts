import type { Context, Next } from 'hono';
import type { WebEnv, WebVars } from '../types';
import { verifySessionCookie } from '../lib/cookie';

/**
 * Session middleware: verifies admin access via either:
 * 1. Hub SSO visitor JWT with admin role (managed sites — social login)
 * 2. HMAC-signed HttpOnly cookie (self-hosted — SERVER_TOKEN login)
 *
 * Redirects to /login on failure (self-hosted) or shows login prompt (managed).
 */
export async function sessionMiddleware(
  c: Context<{ Bindings: WebEnv; Variables: WebVars }>,
  next: Next
) {
  // Social login admin: role is in the verified per-site JWT (set by visitorMiddleware)
  const visitor = c.get('visitor');
  if (visitor?.role === 'admin') {
    return next();
  }

  // Self-hosted mode: check HMAC cookie (existing behavior)
  const cookie = c.req.header('Cookie');
  const valid = await verifySessionCookie(cookie, c.env.SERVER_TOKEN);

  if (!valid) {
    return c.redirect('/pignal/login');
  }

  await next();
}
