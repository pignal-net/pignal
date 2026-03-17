import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import type { RouteFactoryConfig } from '../types';
import { updateSettingSchema } from '../validation/schemas';

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

  // PATCH /:key — update a single setting value
  router.patch('/:key', zValidator('json', updateSettingSchema), async (c) => {
    const store = config.getStore(c);
    const key = c.req.param('key');
    const { value } = c.req.valid('json');

    await store.updateSetting(key, value);
    return c.json({ key, value });
  });

  return router;
}
