import type { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { drizzle } from 'drizzle-orm/d1';

import { ApiKeyStore } from '@pignal/core/store/api-keys';
import { timingSafeEqual } from '@pignal/core/auth/timing-safe';
import type { Env, Variables } from '../types';

/**
 * Bearer token authentication middleware for the self-hosted server.
 * Validates `Authorization: Bearer <token>` against:
 * 1. SERVER_TOKEN env var (fast path — admin access, all scopes)
 * 2. api_keys table (scoped access with optional workspace restriction)
 *
 * Sets on context:
 * - authPermissions: string[] — granted permissions ('admin' for SERVER_TOKEN)
 * - authWorkspaceIds: string[] | null — workspace restriction (null = all)
 *
 * Skips OPTIONS requests to allow CORS preflight through.
 */
export async function tokenAuth(c: Context<{ Bindings: Env; Variables: Variables }>, next: Next) {
  if (c.req.method === 'OPTIONS') {
    return next();
  }

  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new HTTPException(401, {
      message: 'Missing or invalid Authorization header',
    });
  }

  const token = authHeader.slice(7);

  // Fast path: SERVER_TOKEN grants full admin access (timing-safe comparison)
  if (await timingSafeEqual(token, c.env.SERVER_TOKEN, c.env.SERVER_TOKEN)) {
    c.set('authPermissions', ['admin']);
    c.set('authWorkspaceIds', null);
    await next();
    return;
  }

  // Fallback: check api_keys table (SHA-256 hash lookup — no timing leak)
  const db = drizzle(c.env.DB);
  const keyStore = new ApiKeyStore(db);
  const result = await keyStore.validate(token);

  if (result) {
    c.set('authPermissions', result.scopes);
    c.set('authWorkspaceIds', result.workspaceIds);
    await next();
    return;
  }

  throw new HTTPException(401, { message: 'Invalid authentication token' });
}
