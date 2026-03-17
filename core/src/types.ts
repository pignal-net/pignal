import type { Context, MiddlewareHandler } from 'hono';

import type { SignalStoreRpc } from '@pignal/db';

/**
 * Configuration for route factories.
 * - `getStore`: How to obtain a SignalStoreRpc for the current request
 *   (any Drizzle SQLite database instance)
 * - `middleware`: Optional middleware to apply to all routes (auth, etc.)
 */
export interface RouteFactoryConfig {
  getStore: (c: Context) => SignalStoreRpc;
  middleware?: MiddlewareHandler[];
}

/** Fields safe to expose on public API endpoints. */
export const PUBLIC_SIGNAL_FIELDS = [
  'id', 'keySummary', 'content', 'typeId', 'typeName',
  'workspaceId', 'workspaceName',
  'sourceAi', 'validationActionLabel', 'tags',
  'slug', 'vouchedAt', 'createdAt', 'updatedAt',
] as const;

export type PublicSignalField = (typeof PUBLIC_SIGNAL_FIELDS)[number];

/**
 * Signal response type with boolean isArchived (converted from integer).
 */
export type Signal = {
  id: string;
  keySummary: string;
  content: string;
  typeId: string;
  typeName: string;
  workspaceId: string | null;
  workspaceName: string | null;
  sourceAi: string;
  validationActionId: string | null;
  validationActionLabel: string | null;
  tags: string[] | null;
  pinnedAt: string | null;
  isArchived: boolean;
  visibility: string;
  slug: string | null;
  shareToken: string | null;
  vouchedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SignalListResponse = {
  items: Signal[];
  total: number;
  limit: number;
  offset: number;
};
