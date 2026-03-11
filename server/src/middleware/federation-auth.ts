import type { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';

import type { Env } from '../types';

/**
 * Federation token validation middleware.
 * Validates cross-instance federation tokens.
 * Skips OPTIONS requests to allow CORS preflight through.
 */
export async function federationAuth(c: Context<{ Bindings: Env }>, next: Next) {
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

  // For now, federation tokens are validated against SERVER_TOKEN.
  // In the future, this will verify signed federation tokens.
  if (token !== c.env.SERVER_TOKEN) {
    throw new HTTPException(401, { message: 'Invalid federation token' });
  }

  await next();
}
