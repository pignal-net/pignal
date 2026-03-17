import type { Context, Next } from 'hono';
import type { WebEnv } from '../types';
import { verifySessionCookie } from '../lib/cookie';

/**
 * Session middleware: verifies HMAC-signed HttpOnly cookie.
 * Redirects to /login on failure.
 */
export async function sessionMiddleware(c: Context<{ Bindings: WebEnv }>, next: Next) {
  const cookie = c.req.header('Cookie');
  const valid = await verifySessionCookie(cookie, c.env.SERVER_TOKEN);

  if (!valid) {
    return c.redirect('/pignal/login');
  }

  await next();
}
