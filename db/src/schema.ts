import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const signalTypes = sqliteTable('signal_types', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  color: text('color'),
  icon: text('icon'),
  guidance: text('guidance'), // JSON: { pattern?, example?, whenToUse?, contentHints? }
  isSystem: integer('is_system').default(0),
  sortOrder: integer('sort_order').default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export type SignalTypeSelect = typeof signalTypes.$inferSelect;
export type SignalTypeInsert = typeof signalTypes.$inferInsert;

export const typeActions = sqliteTable(
  'type_actions',
  {
    id: text('id').primaryKey(),
    typeId: text('type_id')
      .notNull()
      .references(() => signalTypes.id, { onDelete: 'cascade' }),
    label: text('label').notNull(),
    sortOrder: integer('sort_order').default(0),
    createdAt: text('created_at').notNull(),
  },
  (table) => [uniqueIndex('idx_type_actions_type_label').on(table.typeId, table.label)]
);

export type TypeActionSelect = typeof typeActions.$inferSelect;
export type TypeActionInsert = typeof typeActions.$inferInsert;

export const workspaces = sqliteTable('workspaces', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  visibility: text('visibility').notNull().default('private'),
  isDefault: integer('is_default').default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export type WorkspaceSelect = typeof workspaces.$inferSelect;
export type WorkspaceInsert = typeof workspaces.$inferInsert;

export const signals = sqliteTable(
  'signals',
  {
    id: text('id').primaryKey(),
    keySummary: text('key_summary').notNull(),
    content: text('content').notNull(),
    typeId: text('type_id')
      .notNull()
      .references(() => signalTypes.id),
    workspaceId: text('workspace_id').references(() => workspaces.id, { onDelete: 'set null' }),
    sourceAi: text('source_ai').notNull(),
    validationActionId: text('validation_action_id').references(() => typeActions.id, {
      onDelete: 'set null',
    }),
    isArchived: integer('is_archived').default(0),
    visibility: text('visibility').default('private'),
    slug: text('slug'),
    shareToken: text('share_token'),
    tags: text('tags'), // JSON array of lowercase strings, e.g. '["react","hooks"]'
    pinnedAt: text('pinned_at'),
    vouchedAt: text('vouched_at'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('idx_signals_type_id').on(table.typeId),
    index('idx_signals_workspace_id').on(table.workspaceId),
    index('idx_signals_archived').on(table.isArchived),
    index('idx_signals_created').on(table.createdAt),
    index('idx_signals_visibility').on(table.visibility),
    uniqueIndex('idx_signals_slug').on(table.slug),
    uniqueIndex('idx_signals_share_token').on(table.shareToken),
  ]
);

export type SignalSelect = typeof signals.$inferSelect;
export type SignalInsert = typeof signals.$inferInsert;

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export type SettingSelect = typeof settings.$inferSelect;
export type SettingInsert = typeof settings.$inferInsert;

export const apiKeys = sqliteTable(
  'api_keys',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    keyHash: text('key_hash').notNull(),
    scopes: text('scopes').notNull().default('list_signals,get_metadata'),
    workspaceIds: text('workspace_ids'), // Nullable: null = all workspaces, comma-separated UUIDs = restricted
    createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
    lastUsedAt: text('last_used_at'),
    expiresAt: text('expires_at'),
  },
  (table) => [index('idx_api_keys_hash').on(table.keyHash)]
);

export type ApiKeySelect = typeof apiKeys.$inferSelect;
export type ApiKeyInsert = typeof apiKeys.$inferInsert;
