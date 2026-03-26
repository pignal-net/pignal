import type { Context, Next } from 'hono';

// Strict CSP for admin/authenticated routes — no unsafe-inline scripts
const ADMIN_CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'", // HTMX inline styles require unsafe-inline for style only
  "font-src 'self'",
  "img-src 'self' data: https://github.com https://avatars.githubusercontent.com",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

// Permissive CSP for public source routes — supports custom head HTML injection
// (analytics scripts, external fonts, custom stylesheets, etc.)
const PUBLIC_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https:",
  "style-src 'self' 'unsafe-inline' https:",
  "font-src 'self' https: data:",
  "img-src 'self' data: https:",
  "connect-src 'self' https:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

/** Strip locale prefix from path for route matching. */
function stripLocale(path: string): string {
  const match = path.match(/^\/(en|vi|zh)(\/.*)?$/);
  return match ? (match[2] || '/') : path;
}

/** Public route prefixes that get the permissive CSP. */
function isPublicRoute(path: string): boolean {
  const p = stripLocale(path);
  return p === '/' ||
    p.startsWith('/item/') ||
    p.startsWith('/s/') ||
    p.startsWith('/static/') ||
    p === '/feed.xml' ||
    p === '/robots.txt' ||
    p === '/sitemap.xml' ||
    p.startsWith('/sitemap-') ||
    p === '/llms.txt' ||
    p === '/llms-full.txt';
}

/**
 * Security headers middleware applied to all responses.
 * Uses a strict CSP for admin routes and a permissive CSP for public source routes.
 */
export async function securityHeaders(c: Context, next: Next) {
  await next();

  const csp = isPublicRoute(c.req.path) ? PUBLIC_CSP : ADMIN_CSP;
  c.header('Content-Security-Policy', csp);
  c.header('X-Frame-Options', 'DENY');
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
}
