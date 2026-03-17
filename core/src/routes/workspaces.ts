import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

import type { RouteFactoryConfig } from '../types';
import { createWorkspaceSchema, updateWorkspaceSchema } from '../validation/schemas';

/**
 * Create workspace management routes with configurable store resolution and middleware.
 */
export function createWorkspaceRoutes(config: RouteFactoryConfig) {
  const router = new Hono();

  if (config.middleware) {
    for (const mw of config.middleware) {
      router.use('*', mw);
    }
  }

  // GET /workspaces
  router.get('/', async (c) => {
    const store = config.getStore(c);
    const result = await store.listWorkspaces();
    return c.json(result);
  });

  // POST /workspaces
  router.post('/', zValidator('json', createWorkspaceSchema), async (c) => {
    const store = config.getStore(c);
    const data = c.req.valid('json');

    const result = await store.createWorkspace({
      id: crypto.randomUUID(),
      name: data.name,
      description: data.description,
      visibility: data.visibility,
    });

    return c.json(result, 201);
  });

  // GET /workspaces/:id
  router.get('/:id', async (c) => {
    const store = config.getStore(c);
    const id = c.req.param('id');
    const result = await store.getWorkspace(id);

    if (!result) {
      throw new HTTPException(404, { message: 'Workspace not found' });
    }

    return c.json(result);
  });

  // PATCH /workspaces/:id
  router.patch('/:id', zValidator('json', updateWorkspaceSchema), async (c) => {
    const store = config.getStore(c);
    const id = c.req.param('id');
    const data = c.req.valid('json');

    if (Object.keys(data).length === 0) {
      throw new HTTPException(400, { message: 'No updates provided' });
    }

    const result = await store.updateWorkspace(id, data);

    if (!result) {
      throw new HTTPException(404, { message: 'Workspace not found' });
    }

    return c.json(result);
  });

  // DELETE /workspaces/:id
  router.delete('/:id', async (c) => {
    const store = config.getStore(c);
    const id = c.req.param('id');

    const deleted = await store.deleteWorkspace(id);
    if (!deleted) {
      throw new HTTPException(404, { message: 'Workspace not found' });
    }

    return c.json({ success: true });
  });

  return router;
}
