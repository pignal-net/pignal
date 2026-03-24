import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

import type { Context, MiddlewareHandler } from 'hono';

import type { ActionStoreRpc } from '@pignal/db';

import {
  createSiteActionSchema,
  updateSiteActionSchema,
  listSubmissionsQuerySchema,
  updateSubmissionStatusSchema,
} from '../validation/schemas';

/**
 * Configuration for action/submission route factories.
 * - `getActionStore`: How to obtain an ActionStoreRpc for the current request
 * - `middleware`: Optional middleware to apply to all routes (auth, etc.)
 */
export interface ActionRouteConfig {
  getActionStore: (c: Context) => ActionStoreRpc;
  middleware?: MiddlewareHandler[];
}

/**
 * Create admin CRUD routes for site actions (forms, lead capture).
 * All routes require authentication via the provided middleware.
 */
export function createActionRoutes(config: ActionRouteConfig) {
  const router = new Hono();

  if (config.middleware) {
    for (const mw of config.middleware) {
      router.use('*', mw);
    }
  }

  // GET / — List site actions
  router.get('/', async (c) => {
    const store = config.getActionStore(c);
    const status = c.req.query('status') as 'active' | 'paused' | 'archived' | undefined;
    const actions = await store.listActions(status ? { status } : undefined);
    return c.json(actions);
  });

  // POST / — Create site action
  router.post('/', zValidator('json', createSiteActionSchema), async (c) => {
    const store = config.getActionStore(c);
    const data = c.req.valid('json');

    const id = crypto.randomUUID();

    try {
      const result = await store.createAction({
        id,
        name: data.name,
        slug: data.slug,
        description: data.description,
        fields: data.fields,
        settings: data.settings,
      });

      return c.json(result, 201);
    } catch (err) {
      if (err instanceof Error && err.message.includes('already exists')) {
        throw new HTTPException(400, { message: err.message });
      }
      throw err;
    }
  });

  // GET /:id — Get site action by ID
  router.get('/:id', async (c) => {
    const store = config.getActionStore(c);
    const id = c.req.param('id');

    const result = await store.getAction(id);

    if (!result) {
      throw new HTTPException(404, { message: 'Action not found' });
    }

    return c.json(result);
  });

  // PATCH /:id — Update site action
  router.patch('/:id', zValidator('json', updateSiteActionSchema), async (c) => {
    const store = config.getActionStore(c);
    const id = c.req.param('id');
    const data = c.req.valid('json');

    if (Object.keys(data).length === 0) {
      throw new HTTPException(400, { message: 'No updates provided' });
    }

    try {
      const result = await store.updateAction(id, data);

      if (!result) {
        throw new HTTPException(404, { message: 'Action not found' });
      }

      return c.json(result);
    } catch (err) {
      if (err instanceof Error && err.message.includes('already exists')) {
        throw new HTTPException(400, { message: err.message });
      }
      throw err;
    }
  });

  // DELETE /:id — Delete site action
  router.delete('/:id', async (c) => {
    const store = config.getActionStore(c);
    const id = c.req.param('id');

    const deleted = await store.deleteAction(id);

    if (!deleted) {
      throw new HTTPException(404, { message: 'Action not found' });
    }

    return c.json({ success: true });
  });

  return router;
}

/**
 * Create admin routes for managing form submissions.
 * All routes require authentication via the provided middleware.
 */
export function createSubmissionRoutes(config: ActionRouteConfig) {
  const router = new Hono();

  if (config.middleware) {
    for (const mw of config.middleware) {
      router.use('*', mw);
    }
  }

  // GET / — List submissions (paginated, filterable)
  router.get('/', zValidator('query', listSubmissionsQuerySchema), async (c) => {
    const store = config.getActionStore(c);
    const params = c.req.valid('query');

    const result = await store.listSubmissions({
      actionId: params.actionId,
      status: params.status,
      limit: params.limit,
      offset: params.offset,
    });

    return c.json({
      submissions: result.submissions,
      total: result.total,
      limit: params.limit,
      offset: params.offset,
    });
  });

  // GET /stats — Submission stats
  router.get('/stats', async (c) => {
    const store = config.getActionStore(c);
    const stats = await store.submissionStats();
    return c.json(stats);
  });

  // GET /export/:actionId — Export submissions
  router.get('/export/:actionId', async (c) => {
    const store = config.getActionStore(c);
    const actionId = c.req.param('actionId');
    const format = c.req.query('format') === 'csv' ? 'csv' : 'json';

    const exported = await store.exportSubmissions(actionId, format);

    if (format === 'csv') {
      c.header('Content-Type', 'text/csv; charset=utf-8');
      c.header('Content-Disposition', `attachment; filename="submissions-${actionId}.csv"`);
      return c.body(exported);
    }

    c.header('Content-Type', 'application/json; charset=utf-8');
    return c.body(exported);
  });

  // GET /:id — Get single submission
  router.get('/:id', async (c) => {
    const store = config.getActionStore(c);
    const id = c.req.param('id');

    const result = await store.getSubmission(id);

    if (!result) {
      throw new HTTPException(404, { message: 'Submission not found' });
    }

    return c.json(result);
  });

  // PATCH /:id — Update submission status
  router.patch('/:id', zValidator('json', updateSubmissionStatusSchema), async (c) => {
    const store = config.getActionStore(c);
    const id = c.req.param('id');
    const { status } = c.req.valid('json');

    const updated = await store.updateSubmissionStatus(id, status);

    if (!updated) {
      throw new HTTPException(404, { message: 'Submission not found' });
    }

    return c.json({ success: true });
  });

  // DELETE /:id — Delete submission
  router.delete('/:id', async (c) => {
    const store = config.getActionStore(c);
    const id = c.req.param('id');

    const deleted = await store.deleteSubmission(id);

    if (!deleted) {
      throw new HTTPException(404, { message: 'Submission not found' });
    }

    return c.json({ success: true });
  });

  return router;
}
