import type { D1Database, DurableObjectNamespace } from '@cloudflare/workers-types';

import type { ItemStoreRpc } from '@pignal/db';

export type Env = {
  DB: D1Database;
  MCP_AGENT: DurableObjectNamespace;
  SERVER_TOKEN: string;
  TEMPLATE?: string;
  /** CORS allowed origins: unset = same-origin, "*" = all, comma-separated = explicit list */
  CORS_ORIGIN?: string;
};

/**
 * Variables set on the Hono context by middleware.
 */
export type Variables = {
  store: ItemStoreRpc;
  /** Permissions granted by the authenticated token. Set by tokenAuth middleware. */
  authPermissions: string[];
  /** Workspace IDs the token is restricted to. null = all workspaces. Set by tokenAuth middleware. */
  authWorkspaceIds: string[] | null;
  /** Template name resolved from env.TEMPLATE. Set by store middleware. */
  templateName: string;
};
