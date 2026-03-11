import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

import type { SignalWithMeta } from '@pignal/db';

import type { RouteFactoryConfig, Signal, SignalListResponse } from '../types';
import {
  createSignalSchema,
  listQuerySchema,
  updateSignalSchema,
  validateSchema,
  vouchSchema,
} from '../validation/schemas';

function toSignal(row: SignalWithMeta): Signal {
  return {
    id: row.id,
    keySummary: row.keySummary,
    content: row.content,
    typeId: row.typeId,
    typeName: row.typeName,
    workspaceId: row.workspaceId,
    workspaceName: row.workspaceName,
    sourceAi: row.sourceAi,
    validationActionId: row.validationActionId,
    validationActionLabel: row.validationActionLabel,
    tags: row.tags,
    isArchived: row.isArchived === 1,
    visibility: row.visibility ?? 'private',
    slug: row.slug,
    shareToken: row.shareToken,
    vouchedAt: row.vouchedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * Create signal routes with configurable store resolution and middleware.
 */
export function createSignalRoutes(config: RouteFactoryConfig) {
  const router = new Hono();

  if (config.middleware) {
    for (const mw of config.middleware) {
      router.use('*', mw);
    }
  }

  // GET /signals
  router.get('/', zValidator('query', listQuerySchema), async (c) => {
    const store = config.getStore(c);
    const params = c.req.valid('query');

    const result = await store.list({
      typeId: params.typeId,
      workspaceId: params.workspaceId,
      isArchived: params.isArchived,
      visibility: params.visibility,
      limit: params.limit,
      offset: params.offset,
      q: params.q,
    });

    const response: SignalListResponse = {
      items: result.items.map(toSignal),
      total: result.total,
      limit: params.limit,
      offset: params.offset,
    };

    return c.json(response);
  });

  // GET /signals/:id
  router.get('/:id', async (c) => {
    const store = config.getStore(c);
    const id = c.req.param('id');

    const result = await store.get(id);

    if (!result) {
      throw new HTTPException(404, { message: 'Signal not found' });
    }

    return c.json(toSignal(result));
  });

  // POST /signals
  router.post('/', zValidator('json', createSignalSchema), async (c) => {
    const store = config.getStore(c);
    const data = c.req.valid('json');

    const id = crypto.randomUUID();

    try {
      const result = await store.create({
        id,
        keySummary: data.keySummary,
        content: data.content,
        typeId: data.typeId,
        workspaceId: data.workspaceId,
        tags: data.tags,
        sourceAi: data.sourceAi,
      });

      return c.json(toSignal(result), 201);
    } catch (err) {
      if (err instanceof Error && err.message.includes('must be at')) {
        throw new HTTPException(400, { message: err.message });
      }
      throw err;
    }
  });

  // PATCH /signals/:id
  router.patch('/:id', zValidator('json', updateSignalSchema), async (c) => {
    const store = config.getStore(c);
    const id = c.req.param('id');
    const data = c.req.valid('json');

    if (Object.keys(data).length === 0) {
      throw new HTTPException(400, { message: 'No updates provided' });
    }

    try {
      const result = await store.update(id, {
        keySummary: data.keySummary,
        content: data.content,
        typeId: data.typeId,
        workspaceId: data.workspaceId,
        tags: data.tags,
      });

      if (!result) {
        throw new HTTPException(404, { message: 'Signal not found' });
      }

      return c.json(toSignal(result));
    } catch (err) {
      if (err instanceof Error && err.message.includes('must be at')) {
        throw new HTTPException(400, { message: err.message });
      }
      throw err;
    }
  });

  // DELETE /signals/:id
  router.delete('/:id', async (c) => {
    const store = config.getStore(c);
    const id = c.req.param('id');

    const deleted = await store.delete(id);

    if (!deleted) {
      throw new HTTPException(404, { message: 'Signal not found' });
    }

    return c.json({ success: true });
  });

  // POST /signals/:id/validate
  router.post('/:id/validate', zValidator('json', validateSchema), async (c) => {
    const store = config.getStore(c);
    const id = c.req.param('id');
    const { actionId } = c.req.valid('json');

    try {
      const result = await store.validate(id, actionId);
      if (!result) {
        throw new HTTPException(404, { message: 'Signal not found' });
      }
      return c.json(toSignal(result));
    } catch (err) {
      if (err instanceof Error && err.message.includes('Action')) {
        throw new HTTPException(400, { message: err.message });
      }
      throw err;
    }
  });

  // POST /signals/:id/archive
  router.post('/:id/archive', async (c) => {
    const store = config.getStore(c);
    const id = c.req.param('id');

    const result = await store.archive(id);

    if (!result) {
      throw new HTTPException(404, { message: 'Signal not found' });
    }

    return c.json(toSignal(result));
  });

  // POST /signals/:id/unarchive
  router.post('/:id/unarchive', async (c) => {
    const store = config.getStore(c);
    const id = c.req.param('id');

    const result = await store.unarchive(id);

    if (!result) {
      throw new HTTPException(404, { message: 'Signal not found' });
    }

    return c.json(toSignal(result));
  });

  // POST /signals/:id/vouch
  router.post('/:id/vouch', zValidator('json', vouchSchema), async (c) => {
    const store = config.getStore(c);
    const id = c.req.param('id');
    const data = c.req.valid('json');

    const result = await store.vouch(id, data);

    if (!result) {
      throw new HTTPException(404, { message: 'Signal not found' });
    }

    return c.json(toSignal(result));
  });

  return router;
}
