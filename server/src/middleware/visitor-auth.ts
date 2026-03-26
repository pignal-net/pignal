import type { Context, Next } from 'hono';
import type { Env, Variables } from '../types';

const SITE_TOKEN_ISSUER = 'pignal-dispatch';

/**
 * Visitor authentication middleware for API + web routes.
 *
 * Verifies the per-site JWT from X-Pignal-Visitor-Token header
 * using VISITOR_SITE_SECRET (set during provisioning for managed sites).
 *
 * Skips silently if VISITOR_SITE_SECRET is not set (self-hosted mode).
 */
export async function visitorAuth(
  c: Context<{ Bindings: Env; Variables: Variables }>,
  next: Next
) {
  const token = c.req.header('X-Pignal-Visitor-Token');
  const secret = c.env.VISITOR_SITE_SECRET;

  if (!token || !secret) {
    c.set('visitor', null);
    return next();
  }

  const hostname = new URL(c.req.url).hostname;

  try {
    const payload = await verifySiteToken(token, secret, hostname);
    c.set('visitor', {
      id: payload.sub,
      login: payload.login,
      name: payload.name,
      role: payload.role,
    });
  } catch {
    c.set('visitor', null);
  }

  return next();
}

// ---------------------------------------------------------------------------
// Inline HS256 JWT verification (Web Crypto API only)
// ---------------------------------------------------------------------------

function fromBase64Url(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function verifySiteToken(
  token: string,
  secret: string,
  expectedSite: string
): Promise<{ sub: string; login: string; name: string; role: 'admin' | 'visitor'; site: string }> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT');

  const [headerB64, payloadB64, signatureB64] = parts;
  const signingInput = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    fromBase64Url(signatureB64) as Uint8Array<ArrayBuffer>,
    new TextEncoder().encode(signingInput)
  );

  if (!valid) throw new Error('Invalid signature');

  const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(payloadB64))) as Record<string, unknown>;

  if (payload.iss !== SITE_TOKEN_ISSUER) throw new Error('Invalid issuer');
  if (!payload.exp || Math.floor(Date.now() / 1000) >= (payload.exp as number)) throw new Error('Expired');
  if (payload.site !== expectedSite) throw new Error('Site mismatch');

  const role = payload.role as string;
  if (role !== 'admin' && role !== 'visitor') throw new Error('Invalid role');

  return {
    sub: payload.sub as string,
    login: payload.login as string,
    name: payload.name as string,
    role: role as 'admin' | 'visitor',
    site: payload.site as string,
  };
}
