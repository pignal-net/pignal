import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

import type { ItemWithMeta } from '@pignal/db';

import type { RouteFactoryConfig, PublicItemField } from '../types';
import { PUBLIC_ITEM_FIELDS } from '../types';

const PUBLIC_FIELDS_SET = new Set<string>(PUBLIC_ITEM_FIELDS);

/** Default fields for list endpoints (excludes heavy `content`). */
const LIST_DEFAULTS = new Set<PublicItemField>(
  PUBLIC_ITEM_FIELDS.filter((f) => f !== 'content'),
);

/** Default fields for single-item endpoints (includes `content`). */
const ALL_DEFAULTS = new Set<PublicItemField>(PUBLIC_ITEM_FIELDS);

/** Parse and validate `?fields=` query param. Returns null if invalid field found. */
function parseFields(raw: string | undefined, defaults: Set<PublicItemField>): Set<PublicItemField> | null {
  if (!raw) return defaults;
  const requested = raw.split(',').map((f) => f.trim()).filter(Boolean);
  for (const f of requested) {
    if (!PUBLIC_FIELDS_SET.has(f)) return null;
  }
  const fields = new Set<PublicItemField>(requested as PublicItemField[]);
  fields.add('id'); // id is always included
  return fields;
}

function toPublicItem(row: ItemWithMeta, fields: Set<PublicItemField>) {
  const result: Record<string, unknown> = { id: row.id };
  if (fields.has('keySummary')) result.keySummary = row.keySummary;
  if (fields.has('content')) result.content = row.content;
  if (fields.has('typeId')) result.typeId = row.typeId;
  if (fields.has('typeName')) result.typeName = row.typeName;
  if (fields.has('sourceAi')) result.sourceAi = row.sourceAi;
  if (fields.has('validationActionLabel')) result.validationActionLabel = row.validationActionLabel;
  if (fields.has('tags')) result.tags = row.tags;
  if (fields.has('workspaceId')) result.workspaceId = row.workspaceId;
  if (fields.has('workspaceName')) result.workspaceName = row.workspaceName;
  if (fields.has('slug')) result.slug = row.slug;
  if (fields.has('vouchedAt')) result.vouchedAt = row.vouchedAt;
  if (fields.has('createdAt')) result.createdAt = row.createdAt;
  if (fields.has('updatedAt')) result.updatedAt = row.updatedAt;
  return result;
}

/**
 * Create public routes (no auth) for vouched items data access.
 */
export function createPublicRoutes(config: Pick<RouteFactoryConfig, 'getStore'>) {
  const router = new Hono();

  // GET /items -- List vouched items (paginated JSON)
  router.get('/items', async (c) => {
    const store = config.getStore(c);

    const limit = Math.min(parseInt(c.req.query('limit') ?? '20', 10) || 20, 100);
    const offset = parseInt(c.req.query('offset') ?? '0', 10) || 0;
    const updatedAfter = c.req.query('updatedAfter') ?? undefined;

    const fields = parseFields(c.req.query('fields'), LIST_DEFAULTS);
    if (!fields) {
      throw new HTTPException(400, { message: `Invalid fields. Allowed: ${PUBLIC_ITEM_FIELDS.join(', ')}` });
    }

    const result = await store.listPublic({ limit, offset, updatedAfter });

    return c.json({
      items: result.items.map((row) => toPublicItem(row, fields)),
      total: result.total,
      limit,
      offset,
    });
  });

  // GET /items/:slug -- Get single vouched item by slug (JSON)
  router.get('/items/:slug', async (c) => {
    const store = config.getStore(c);
    const slug = c.req.param('slug');

    const fields = parseFields(c.req.query('fields'), ALL_DEFAULTS);
    if (!fields) {
      throw new HTTPException(400, { message: `Invalid fields. Allowed: ${PUBLIC_ITEM_FIELDS.join(', ')}` });
    }

    const result = await store.getBySlug(slug);
    if (!result) {
      throw new HTTPException(404, { message: 'Item not found' });
    }

    return c.json(toPublicItem(result, fields));
  });

  // GET /s/:token -- Get single unlisted item by share token (JSON)
  router.get('/s/:token', async (c) => {
    const store = config.getStore(c);
    const token = c.req.param('token');

    const fields = parseFields(c.req.query('fields'), ALL_DEFAULTS);
    if (!fields) {
      throw new HTTPException(400, { message: `Invalid fields. Allowed: ${PUBLIC_ITEM_FIELDS.join(', ')}` });
    }

    const result = await store.getByShareToken(token);
    if (!result) {
      throw new HTTPException(404, { message: 'Not found' });
    }

    return c.json(toPublicItem(result, fields));
  });

  return router;
}
