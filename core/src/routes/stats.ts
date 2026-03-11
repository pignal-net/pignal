import { Hono } from 'hono';

import type { RouteFactoryConfig } from '../types';

/**
 * Create stats and metadata routes with configurable store resolution and middleware.
 */
export function createStatsRoutes(config: RouteFactoryConfig) {
  const router = new Hono();

  if (config.middleware) {
    for (const mw of config.middleware) {
      router.use('*', mw);
    }
  }

  // GET /stats
  router.get('/stats', async (c) => {
    const store = config.getStore(c);
    const stats = await store.stats();
    return c.json(stats);
  });

  // GET /metadata
  router.get('/metadata', async (c) => {
    const store = config.getStore(c);
    const metadata = await store.getMetadata();
    return c.json(metadata);
  });

  return router;
}
