import type { Context, Next } from 'hono';
import type { WebEnv } from '../types';

const CSRF_COOKIE = 'pignal_csrf';
const CSRF_HEADER = 'X-CSRF-Token';
const CSRF_FIELD = '_csrf';

function getCsrfFromCookie(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`${CSRF_COOKIE}=([^;]+)`));
  return match ? match[1] : null;
}

/**
 * CSRF middleware using double-submit cookie pattern.
 * - Sets CSRF token cookie on every response (non-HttpOnly so JS can read it).
 * - Validates POST/PATCH/DELETE: cookie value must match header or form field.
 */
export async function csrfMiddleware(c: Context<{ Bindings: WebEnv }>, next: Next) {
  const method = c.req.method;

  // For mutation requests, verify CSRF token
  if (method === 'POST' || method === 'PATCH' || method === 'DELETE') {
    const cookieToken = getCsrfFromCookie(c.req.header('Cookie'));
    const headerToken = c.req.header(CSRF_HEADER);

    // Try header first, then form field
    let submittedToken = headerToken;
    if (!submittedToken) {
      try {
        const contentType = c.req.header('Content-Type') || '';
        if (contentType.includes('application/x-www-form-urlencoded')) {
          const body = await c.req.parseBody();
          submittedToken = body[CSRF_FIELD] as string;
        }
      } catch {
        // Ignore parse errors
      }
    }

    if (!cookieToken || !submittedToken || cookieToken !== submittedToken) {
      return c.text('CSRF validation failed', 403);
    }
  }

  await next();

  // Set/refresh CSRF cookie on all responses
  let csrfToken = getCsrfFromCookie(c.req.header('Cookie'));
  if (!csrfToken) {
    csrfToken = crypto.randomUUID();
  }

  c.header(
    'Set-Cookie',
    `${CSRF_COOKIE}=${csrfToken}; SameSite=Strict; Path=/; Secure`,
    { append: true }
  );

  // Make token available for templates
  c.set('csrfToken' as never, csrfToken as never);
}

/**
 * Get the CSRF token from the request cookie (for embedding in forms/HTMX headers).
 */
export function getCsrfToken(c: Context): string {
  return getCsrfFromCookie(c.req.header('Cookie')) ?? '';
}

export { CSRF_COOKIE, CSRF_HEADER, CSRF_FIELD };
