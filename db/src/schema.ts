import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const itemTypes = sqliteTable('item_types', {
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

export type ItemTypeSelect = typeof itemTypes.$inferSelect;
export type ItemTypeInsert = typeof itemTypes.$inferInsert;

export const typeActions = sqliteTable(
  'type_actions',
  {
    id: text('id').primaryKey(),
    typeId: text('type_id')
      .notNull()
      .references(() => itemTypes.id, { onDelete: 'cascade' }),
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

export const items = sqliteTable(
  'items',
  {
    id: text('id').primaryKey(),
    keySummary: text('key_summary').notNull(),
    content: text('content').notNull(),
    typeId: text('type_id')
      .notNull()
      .references(() => itemTypes.id),
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
    index('idx_items_type_id').on(table.typeId),
    index('idx_items_workspace_id').on(table.workspaceId),
    index('idx_items_archived').on(table.isArchived),
    index('idx_items_created').on(table.createdAt),
    index('idx_items_visibility').on(table.visibility),
    uniqueIndex('idx_items_slug').on(table.slug),
    uniqueIndex('idx_items_share_token').on(table.shareToken),
  ]
);

export type ItemSelect = typeof items.$inferSelect;
export type ItemInsert = typeof items.$inferInsert;

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
    scopes: text('scopes').notNull().default('list_items,get_metadata'),
    workspaceIds: text('workspace_ids'), // Nullable: null = all workspaces, comma-separated UUIDs = restricted
    createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
    lastUsedAt: text('last_used_at'),
    expiresAt: text('expires_at'),
  },
  (table) => [index('idx_api_keys_hash').on(table.keyHash)]
);

export type ApiKeySelect = typeof apiKeys.$inferSelect;
export type ApiKeyInsert = typeof apiKeys.$inferInsert;

// --- Site Actions (forms, lead capture, etc.) ---

export const siteActions = sqliteTable(
  'site_actions',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
    fields: text('fields').notNull(), // JSON: SiteActionField[]
    settings: text('settings').notNull().default('{}'), // JSON: SiteActionSettings
    status: text('status').notNull().default('active'), // 'active' | 'paused' | 'archived'
    submissionCount: integer('submission_count').default(0),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [uniqueIndex('idx_site_actions_slug').on(table.slug), index('idx_site_actions_status').on(table.status)]
);

export type SiteActionSelect = typeof siteActions.$inferSelect;
export type SiteActionInsert = typeof siteActions.$inferInsert;

export const submissions = sqliteTable(
  'submissions',
  {
    id: text('id').primaryKey(),
    actionId: text('action_id')
      .notNull()
      .references(() => siteActions.id, { onDelete: 'cascade' }),
    data: text('data').notNull(), // JSON: Record<string, string>
    status: text('status').notNull().default('new'), // 'new' | 'read' | 'replied' | 'archived' | 'spam'
    ipHash: text('ip_hash'),
    referrer: text('referrer'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    index('idx_submissions_action').on(table.actionId, table.createdAt),
    index('idx_submissions_status').on(table.actionId, table.status),
  ]
);

export type SubmissionSelect = typeof submissions.$inferSelect;
export type SubmissionInsert = typeof submissions.$inferInsert;

// --- Page Views (analytics) ---

export const pageViews = sqliteTable(
  'page_views',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    path: text('path').notNull(),
    slug: text('slug'),
    referrer: text('referrer'),
    country: text('country'),
    createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  },
  (table) => [index('idx_views_path_date').on(table.path, table.createdAt), index('idx_views_slug').on(table.slug)]
);

export type PageViewSelect = typeof pageViews.$inferSelect;
export type PageViewInsert = typeof pageViews.$inferInsert;
