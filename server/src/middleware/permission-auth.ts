import type { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';

import { hasPermission } from '@pignal/core/auth/permissions';
import type { Env, Variables } from '../types';

type HonoContext = Context<{ Bindings: Env; Variables: Variables }>;

/**
 * Simple permission enforcement middleware factory.
 * Requires exactly one named permission.
 *
 * Must be applied AFTER tokenAuth (which sets authPermissions on context).
 */
export function requirePermission(perm: string) {
  return async (c: HonoContext, next: Next) => {
    const perms = c.get('authPermissions');

    if (!perms) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }

    if (!hasPermission(perms, perm)) {
      throw new HTTPException(403, {
        message: `Insufficient permission: requires ${perm}`,
      });
    }

    await next();
  };
}

/**
 * Method-based permission middleware factory.
 * GET/HEAD/OPTIONS use `readPerm`, all other methods use `writePerm`.
 *
 * Used for routes where reads and writes need different permissions
 * (e.g., GET /api/types → get_metadata, POST /api/types → manage_types).
 */
export function requireByMethod(readPerm: string, writePerm: string) {
  return async (c: HonoContext, next: Next) => {
    const perms = c.get('authPermissions');

    if (!perms) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }

    const method = c.req.method.toUpperCase();
    const isRead = method === 'GET' || method === 'HEAD' || method === 'OPTIONS';
    const required = isRead ? readPerm : writePerm;

    if (!hasPermission(perms, required)) {
      throw new HTTPException(403, {
        message: `Insufficient permission: requires ${required}`,
      });
    }

    await next();
  };
}

/**
 * Signal route permission resolver middleware.
 *
 * Resolves the required permission from method + path:
 * - GET → list_signals
 * - POST (no sub-path) → save_signal
 * - PATCH → edit_signal
 * - DELETE → delete_signal
 * - POST .../validate → validate_signal
 * - POST .../archive|unarchive|vouch → edit_signal
 *
 * Must be applied AFTER tokenAuth (which sets authPermissions on context).
 */
export async function resolveSignalPermission(c: HonoContext, next: Next) {
  const perms = c.get('authPermissions');

  if (!perms) {
    throw new HTTPException(401, { message: 'Authentication required' });
  }

  const method = c.req.method.toUpperCase();
  let required: string;

  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    required = 'list_signals';
  } else if (method === 'DELETE') {
    required = 'delete_signal';
  } else if (method === 'PATCH') {
    required = 'edit_signal';
  } else if (method === 'POST') {
    const path = c.req.path;
    if (path.endsWith('/validate')) {
      required = 'validate_signal';
    } else if (
      path.endsWith('/archive') ||
      path.endsWith('/unarchive') ||
      path.endsWith('/vouch')
    ) {
      required = 'edit_signal';
    } else {
      required = 'save_signal';
    }
  } else {
    required = 'edit_signal';
  }

  if (!hasPermission(perms, required)) {
    throw new HTTPException(403, {
      message: `Insufficient permission: requires ${required}`,
    });
  }

  await next();
}

/**
 * MCP tool-to-permission mapping.
 * Each tool maps 1:1 to a named permission.
 */
const MCP_TOOL_PERMISSIONS: Record<string, string> = {
  save_signal: 'save_signal',
  list_signals: 'list_signals',
  search_signals: 'list_signals',
  validate_signal: 'validate_signal',
  get_metadata: 'get_metadata',
  update_signal: 'edit_signal',
  create_workspace: 'manage_workspaces',
  create_type: 'manage_types',
  vouch_signal: 'edit_signal',
  batch_vouch_signals: 'edit_signal',
};

/**
 * MCP permission enforcement middleware.
 *
 * Parses the JSON-RPC body of POST requests to identify `tools/call`
 * messages. Maps the tool name to the required permission and blocks
 * if the token lacks it.
 *
 * Non-tool messages (initialize, notifications, etc.) pass through.
 * GET requests (SSE stream setup) pass through.
 * Body is read via clone() to not consume the original stream.
 *
 * Must be applied AFTER tokenAuth (which sets authPermissions on context).
 */
export async function mcpPermissionCheck(c: HonoContext, next: Next) {
  // GET requests set up SSE stream — allow through
  if (c.req.method !== 'POST') {
    await next();
    return;
  }

  const perms = c.get('authPermissions');
  if (!perms) {
    throw new HTTPException(401, { message: 'Authentication required' });
  }

  // admin permission bypasses all checks
  if (perms.includes('admin')) {
    await next();
    return;
  }

  try {
    const body = (await c.req.raw.clone().json()) as {
      jsonrpc?: string;
      method?: string;
      params?: { name?: string };
      id?: string | number | null;
    };

    // Only enforce on tools/call messages
    if (body.method === 'tools/call' && body.params?.name) {
      const required = MCP_TOOL_PERMISSIONS[body.params.name];

      if (required && !hasPermission(perms, required)) {
        throw new HTTPException(403, {
          message: `Access denied: requires ${required} permission`,
        });
      }
    }
  } catch (err) {
    if (err instanceof HTTPException) throw err;
    // Body not parseable — let the MCP handler deal with it
  }

  await next();
}

/**
 * Workspace restriction middleware for signal routes.
 *
 * When an API key has workspace restrictions (authWorkspaceIds is non-null):
 * - POST /signals: validates body.workspaceId is in allowed list
 * - PATCH /signals/:id: validates body.workspaceId if present
 * - GET requests: allowed through (filtering done at query level)
 *
 * Uses `c.req.raw.clone().json()` to read the body non-destructively,
 * so downstream route handlers can still parse the original body.
 *
 * Must be applied AFTER tokenAuth (which sets authWorkspaceIds on context).
 */
export async function enforceWorkspaceRestriction(c: HonoContext, next: Next) {
  const workspaceIds = c.get('authWorkspaceIds');

  if (!workspaceIds) {
    await next();
    return;
  }

  const method = c.req.method.toUpperCase();
  const allowedSet = new Set(workspaceIds);

  if (method === 'POST' || method === 'PATCH') {
    try {
      const body = (await c.req.raw.clone().json()) as Record<string, unknown>;
      const wsId = body.workspaceId;
      if (typeof wsId === 'string' && !allowedSet.has(wsId)) {
        throw new HTTPException(403, {
          message: `API key does not have access to workspace ${wsId}`,
        });
      }
    } catch (err) {
      if (err instanceof HTTPException) throw err;
    }
  }

  await next();
}
