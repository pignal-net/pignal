import type { D1Database, DurableObjectNamespace } from '@cloudflare/workers-types';

import type { ActionStoreRpc, ItemStoreRpc } from '@pignal/db';
import type { EventBus } from '@pignal/core/events/event-bus';

export type Env = {
  DB: D1Database;
  MCP_AGENT: DurableObjectNamespace;
  SERVER_TOKEN: string;
  TEMPLATE?: string;
  /** CORS allowed origins: unset = same-origin, "*" = all, comma-separated = explicit list */
  CORS_ORIGIN?: string;
  /** Per-site visitor secret for hub SSO (managed sites only). */
  VISITOR_SITE_SECRET?: string;
};

/**
 * Variables set on the Hono context by middleware.
 */
/** Visitor identity from hub SSO (null if not authenticated). */
export type VisitorContext = {
  id: string;
  login: string;
  name: string;
  role: 'admin' | 'visitor';
} | null;

export type Variables = {
  store: ItemStoreRpc;
  actionStore: ActionStoreRpc;
  /** Permissions granted by the authenticated token. Set by tokenAuth middleware. */
  authPermissions: string[];
  /** Workspace IDs the token is restricted to. null = all workspaces. Set by tokenAuth middleware. */
  authWorkspaceIds: string[] | null;
  /** Template name resolved from env.TEMPLATE. Set by store middleware. */
  templateName: string;
  /** EventBus instance for dispatching lifecycle events. Set by store middleware. */
  eventBus: EventBus;
  /** Visitor identity from hub SSO (null if not authenticated). Set by visitorMiddleware. */
  visitor: VisitorContext;
};
