import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

import type { SignalWithMeta } from '@pignal/db';

import type { RouteFactoryConfig, PublicSignalField } from '../types';
import { PUBLIC_SIGNAL_FIELDS } from '../types';

const PUBLIC_FIELDS_SET = new Set<string>(PUBLIC_SIGNAL_FIELDS);

/** Default fields for list endpoints (excludes heavy `content`). */
const LIST_DEFAULTS = new Set<PublicSignalField>(
  PUBLIC_SIGNAL_FIELDS.filter((f) => f !== 'content'),
);

/** Default fields for single-item endpoints (includes `content`). */
const ALL_DEFAULTS = new Set<PublicSignalField>(PUBLIC_SIGNAL_FIELDS);

/** Parse and validate `?fields=` query param. Returns null if invalid field found. */
function parseFields(raw: string | undefined, defaults: Set<PublicSignalField>): Set<PublicSignalField> | null {
  if (!raw) return defaults;
  const requested = raw.split(',').map((f) => f.trim()).filter(Boolean);
  for (const f of requested) {
    if (!PUBLIC_FIELDS_SET.has(f)) return null;
  }
  const fields = new Set<PublicSignalField>(requested as PublicSignalField[]);
  fields.add('id'); // id is always included
  return fields;
}

function toPublicSignal(row: SignalWithMeta, fields: Set<PublicSignalField>) {
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
 * Create public routes (no auth) for vouched signals data access.
 */
export function createPublicRoutes(config: Pick<RouteFactoryConfig, 'getStore'>) {
  const router = new Hono();

  // GET /signals -- List vouched signals (paginated JSON)
  router.get('/signals', async (c) => {
    const store = config.getStore(c);

    const limit = Math.min(parseInt(c.req.query('limit') ?? '20', 10) || 20, 100);
    const offset = parseInt(c.req.query('offset') ?? '0', 10) || 0;
    const updatedAfter = c.req.query('updatedAfter') ?? undefined;

    const fields = parseFields(c.req.query('fields'), LIST_DEFAULTS);
    if (!fields) {
      throw new HTTPException(400, { message: `Invalid fields. Allowed: ${PUBLIC_SIGNAL_FIELDS.join(', ')}` });
    }

    const result = await store.listPublic({ limit, offset, updatedAfter });

    return c.json({
      items: result.items.map((row) => toPublicSignal(row, fields)),
      total: result.total,
      limit,
      offset,
    });
  });

  // GET /signals/:slug -- Get single vouched signal by slug (JSON)
  router.get('/signals/:slug', async (c) => {
    const store = config.getStore(c);
    const slug = c.req.param('slug');

    const fields = parseFields(c.req.query('fields'), ALL_DEFAULTS);
    if (!fields) {
      throw new HTTPException(400, { message: `Invalid fields. Allowed: ${PUBLIC_SIGNAL_FIELDS.join(', ')}` });
    }

    const result = await store.getBySlug(slug);
    if (!result) {
      throw new HTTPException(404, { message: 'Signal not found' });
    }

    return c.json(toPublicSignal(result, fields));
  });

  // GET /s/:token -- Get single unlisted signal by share token (JSON)
  router.get('/s/:token', async (c) => {
    const store = config.getStore(c);
    const token = c.req.param('token');

    const fields = parseFields(c.req.query('fields'), ALL_DEFAULTS);
    if (!fields) {
      throw new HTTPException(400, { message: `Invalid fields. Allowed: ${PUBLIC_SIGNAL_FIELDS.join(', ')}` });
    }

    const result = await store.getByShareToken(token);
    if (!result) {
      throw new HTTPException(404, { message: 'Not found' });
    }

    return c.json(toPublicSignal(result, fields));
  });

  return router;
}
