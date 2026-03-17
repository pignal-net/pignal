import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

import type { RouteFactoryConfig } from '../types';
import { addActionSchema, createTypeSchema, updateTypeSchema } from '../validation/schemas';

/**
 * Create type management routes with configurable store resolution and middleware.
 */
export function createTypeRoutes(config: RouteFactoryConfig) {
  const router = new Hono();

  if (config.middleware) {
    for (const mw of config.middleware) {
      router.use('*', mw);
    }
  }

  // GET /types
  router.get('/', async (c) => {
    const store = config.getStore(c);
    const types = await store.listTypes();
    return c.json(types);
  });

  // POST /types
  router.post('/', zValidator('json', createTypeSchema), async (c) => {
    const store = config.getStore(c);
    const data = c.req.valid('json');

    const result = await store.createType({
      id: crypto.randomUUID(),
      name: data.name,
      description: data.description,
      color: data.color,
      icon: data.icon,
      guidance: data.guidance,
      actions: data.actions,
    });

    return c.json(result, 201);
  });

  // GET /types/:id
  router.get('/:id', async (c) => {
    const store = config.getStore(c);
    const id = c.req.param('id');
    const result = await store.getType(id);

    if (!result) {
      throw new HTTPException(404, { message: 'Type not found' });
    }

    return c.json(result);
  });

  // PATCH /types/:id
  router.patch('/:id', zValidator('json', updateTypeSchema), async (c) => {
    const store = config.getStore(c);
    const id = c.req.param('id');
    const data = c.req.valid('json');

    if (Object.keys(data).length === 0) {
      throw new HTTPException(400, { message: 'No updates provided' });
    }

    const result = await store.updateType(id, data);

    if (!result) {
      throw new HTTPException(404, { message: 'Type not found' });
    }

    return c.json(result);
  });

  // DELETE /types/:id
  router.delete('/:id', async (c) => {
    const store = config.getStore(c);
    const id = c.req.param('id');

    try {
      const deleted = await store.deleteType(id);
      if (!deleted) {
        throw new HTTPException(404, { message: 'Type not found' });
      }
      return c.json({ success: true });
    } catch (err) {
      if (err instanceof Error && err.message.includes('Cannot delete')) {
        throw new HTTPException(409, { message: err.message });
      }
      throw err;
    }
  });

  // POST /types/:id/actions
  router.post('/:id/actions', zValidator('json', addActionSchema), async (c) => {
    const store = config.getStore(c);
    const typeId = c.req.param('id');
    const data = c.req.valid('json');

    const [type, maxActionsRaw] = await Promise.all([
      store.getType(typeId),
      store.getSetting('max_actions_per_type'),
    ]);
    if (!type) {
      throw new HTTPException(404, { message: 'Type not found' });
    }
    const maxActions = parseInt(maxActionsRaw ?? '3', 10) || 3;
    if (type.actions.length >= maxActions) {
      throw new HTTPException(400, { message: `Maximum ${maxActions} actions per type` });
    }

    try {
      const action = await store.addTypeAction(typeId, data);
      return c.json(action, 201);
    } catch (err) {
      if (err instanceof Error && err.message === 'Type not found') {
        throw new HTTPException(404, { message: 'Type not found' });
      }
      throw err;
    }
  });

  // DELETE /types/:id/actions/:actionId
  router.delete('/:id/actions/:actionId', async (c) => {
    const store = config.getStore(c);
    const actionId = c.req.param('actionId');

    const deleted = await store.removeTypeAction(actionId);
    if (!deleted) {
      throw new HTTPException(404, { message: 'Action not found' });
    }

    return c.json({ success: true });
  });

  return router;
}
