import type { D1Database, DurableObjectNamespace } from '@cloudflare/workers-types';

import type { SignalStoreRpc } from '@pignal/db';

export type Env = {
  DB: D1Database;
  MCP_AGENT: DurableObjectNamespace;
  SERVER_TOKEN: string;
};

/**
 * Variables set on the Hono context by middleware.
 */
export type Variables = {
  store: SignalStoreRpc;
  /** Permissions granted by the authenticated token. Set by tokenAuth middleware. */
  authPermissions: string[];
  /** Workspace IDs the token is restricted to. null = all workspaces. Set by tokenAuth middleware. */
  authWorkspaceIds: string[] | null;
};
