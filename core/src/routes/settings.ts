import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import type { RouteFactoryConfig } from '../types';
import { updateSettingSchema, batchUpdateSettingsSchema, ALLOWED_SETTINGS_KEYS } from '../validation/schemas';

/**
 * Create settings management routes with configurable store resolution and middleware.
 */
export function createSettingsRoutes(config: RouteFactoryConfig) {
  const router = new Hono();

  if (config.middleware) {
    for (const mw of config.middleware) {
      router.use('*', mw);
    }
  }

  // GET / — returns all settings as JSON object
  router.get('/', async (c) => {
    const store = config.getStore(c);
    const settings = await store.getSettings();
    return c.json(settings);
  });

  // GET /:key — returns a single setting value
  router.get('/:key', async (c) => {
    const store = config.getStore(c);
    const key = c.req.param('key');
    const value = await store.getSetting(key);

    if (value === null) {
      return c.json({ error: 'Setting not found' }, 404);
    }

    return c.json({ key, value });
  });

  // PATCH / — batch update multiple settings
  router.patch('/', zValidator('json', batchUpdateSettingsSchema), async (c) => {
    const store = config.getStore(c);
    const { settings } = c.req.valid('json');

    const updated: string[] = [];
    const errors: Array<{ key: string; error: string }> = [];

    for (const { key, value } of settings) {
      if (!ALLOWED_SETTINGS_KEYS.has(key)) {
        errors.push({ key, error: `Unknown setting key: ${key}` });
        continue;
      }
      await store.updateSetting(key, value);
      updated.push(key);
    }

    return c.json({ updated, errors });
  });

  // PATCH /:key — update a single setting value
  router.patch('/:key', zValidator('json', updateSettingSchema), async (c) => {
    const store = config.getStore(c);
    const key = c.req.param('key');

    if (!ALLOWED_SETTINGS_KEYS.has(key)) {
      return c.json({ error: `Unknown setting key: ${key}` }, 400);
    }

    const { value } = c.req.valid('json');
    await store.updateSetting(key, value);
    return c.json({ key, value });
  });

  return router;
}
