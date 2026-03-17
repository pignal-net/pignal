import type { Context, Next } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { SignalStore } from '@pignal/core/store';

import type { Env, Variables } from '../types';

/**
 * Middleware that creates a SignalStore from D1 and sets it on context.
 * All route handlers access the store via `c.get('store')`.
 */
export async function storeMiddleware(c: Context<{ Bindings: Env; Variables: Variables }>, next: Next) {
  const db = drizzle(c.env.DB);
  const store = new SignalStore(db);
  c.set('store', store);
  await next();
}
