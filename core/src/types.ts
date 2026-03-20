import type { Context, MiddlewareHandler } from 'hono';

import type { ItemStoreRpc } from '@pignal/db';

/**
 * Configuration for route factories.
 * - `getStore`: How to obtain an ItemStoreRpc for the current request
 *   (any Drizzle SQLite database instance)
 * - `middleware`: Optional middleware to apply to all routes (auth, etc.)
 */
export interface RouteFactoryConfig {
  getStore: (c: Context) => ItemStoreRpc;
  middleware?: MiddlewareHandler[];
}

/** Fields safe to expose on public API endpoints. */
export const PUBLIC_ITEM_FIELDS = [
  'id', 'keySummary', 'content', 'typeId', 'typeName',
  'workspaceId', 'workspaceName',
  'sourceAi', 'validationActionLabel', 'tags',
  'slug', 'vouchedAt', 'createdAt', 'updatedAt',
] as const;

export type PublicItemField = (typeof PUBLIC_ITEM_FIELDS)[number];

/**
 * Item response type with boolean isArchived (converted from integer).
 */
export type Item = {
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

export type ItemListResponse = {
  items: Item[];
  total: number;
  limit: number;
  offset: number;
};
