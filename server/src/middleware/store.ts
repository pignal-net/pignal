import type { Context, Next } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { ItemStore } from '@pignal/core/store';
import { ActionStore } from '@pignal/core/store/action-store';
import { EventBus } from '@pignal/core/events/event-bus';
import { createDefaultFieldTypes } from '@pignal/core/actions/field-types';
import { createWebhookListener } from '@pignal/core/webhooks/dispatcher';

import type { Env, Variables } from '../types';

/**
 * Middleware that creates an ItemStore, ActionStore, and EventBus from D1
 * and sets them on context.
 * All route handlers access the stores via `c.get('store')` and `c.get('actionStore')`.
 */
export async function storeMiddleware(c: Context<{ Bindings: Env; Variables: Variables }>, next: Next) {
  const db = drizzle(c.env.DB);
  const eventBus = new EventBus();

  const store = new ItemStore(db, eventBus);

  const fieldTypes = createDefaultFieldTypes();
  const actionStore = new ActionStore(db, fieldTypes, eventBus);

  // Register webhook listener for all events
  eventBus.on('*', createWebhookListener(() => store.getSettings()));

  c.set('store', store);
  c.set('actionStore', actionStore);
  c.set('eventBus', eventBus);
  await next();
}
