-- Schema: item types, type actions, workspaces, items, settings, api keys

CREATE TABLE `item_types` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`color` text,
	`icon` text,
	`guidance` text,
	`is_system` integer DEFAULT 0,
	`sort_order` integer DEFAULT 0,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);

CREATE UNIQUE INDEX `item_types_name_unique` ON `item_types` (`name`);

CREATE TABLE `type_actions` (
	`id` text PRIMARY KEY NOT NULL,
	`type_id` text NOT NULL,
	`label` text NOT NULL,
	`sort_order` integer DEFAULT 0,
	`created_at` text NOT NULL,
	FOREIGN KEY (`type_id`) REFERENCES `item_types`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE UNIQUE INDEX `idx_type_actions_type_label` ON `type_actions` (`type_id`,`label`);

CREATE TABLE `workspaces` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`visibility` text NOT NULL DEFAULT 'private',
	`is_default` integer DEFAULT 0,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);

CREATE UNIQUE INDEX `workspaces_name_unique` ON `workspaces` (`name`);

CREATE TABLE `items` (
	`id` text PRIMARY KEY NOT NULL,
	`key_summary` text NOT NULL,
	`content` text NOT NULL,
	`type_id` text NOT NULL,
	`workspace_id` text,
	`source_ai` text NOT NULL,
	`validation_action_id` text,
	`tags` text,
	`is_archived` integer DEFAULT 0,
	`visibility` text DEFAULT 'private',
	`slug` text,
	`share_token` text,
	`pinned_at` text,
	`vouched_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`type_id`) REFERENCES `item_types`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`validation_action_id`) REFERENCES `type_actions`(`id`) ON UPDATE no action ON DELETE set null
);

CREATE INDEX `idx_items_type_id` ON `items` (`type_id`);
CREATE INDEX `idx_items_workspace_id` ON `items` (`workspace_id`);
CREATE INDEX `idx_items_archived` ON `items` (`is_archived`);
CREATE INDEX `idx_items_created` ON `items` (`created_at`);
CREATE INDEX `idx_items_visibility` ON `items` (`visibility`);
CREATE UNIQUE INDEX `idx_items_slug` ON `items` (`slug`);
CREATE UNIQUE INDEX `idx_items_share_token` ON `items` (`share_token`);
CREATE INDEX `idx_items_pinned` ON `items` (`pinned_at`);
CREATE INDEX `idx_items_updated` ON `items` (`updated_at`);

CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE `api_keys` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`key_hash` text NOT NULL,
	`scopes` text NOT NULL DEFAULT 'list_items,get_metadata',
	`workspace_ids` text,
	`created_at` text NOT NULL DEFAULT (datetime('now')),
	`last_used_at` text,
	`expires_at` text
);

CREATE INDEX `idx_api_keys_hash` ON `api_keys` (`key_hash`);

-- Default settings (template-independent)
INSERT OR IGNORE INTO `settings` (`key`, `value`, `updated_at`) VALUES ('max_actions_per_type', '3', datetime('now'));
INSERT OR IGNORE INTO `settings` (`key`, `value`, `updated_at`) VALUES ('owner_name', 'Pignal', datetime('now'));

-- Source page settings: layout
INSERT OR IGNORE INTO `settings` (`key`, `value`, `updated_at`) VALUES ('source_posts_per_page', '20', datetime('now'));
INSERT OR IGNORE INTO `settings` (`key`, `value`, `updated_at`) VALUES ('source_show_toc', 'true', datetime('now'));
INSERT OR IGNORE INTO `settings` (`key`, `value`, `updated_at`) VALUES ('source_show_reading_time', 'true', datetime('now'));
INSERT OR IGNORE INTO `settings` (`key`, `value`, `updated_at`) VALUES ('source_card_style', 'list', datetime('now'));
INSERT OR IGNORE INTO `settings` (`key`, `value`, `updated_at`) VALUES ('source_code_theme', 'default', datetime('now'));

-- Source page settings: branding (empty defaults)
INSERT OR IGNORE INTO `settings` (`key`, `value`, `updated_at`) VALUES ('source_logo_text', '', datetime('now'));
INSERT OR IGNORE INTO `settings` (`key`, `value`, `updated_at`) VALUES ('source_color_primary', '', datetime('now'));
INSERT OR IGNORE INTO `settings` (`key`, `value`, `updated_at`) VALUES ('source_color_secondary', '', datetime('now'));
INSERT OR IGNORE INTO `settings` (`key`, `value`, `updated_at`) VALUES ('source_color_background', '', datetime('now'));
INSERT OR IGNORE INTO `settings` (`key`, `value`, `updated_at`) VALUES ('source_color_text', '', datetime('now'));
INSERT OR IGNORE INTO `settings` (`key`, `value`, `updated_at`) VALUES ('source_color_muted', '', datetime('now'));
INSERT OR IGNORE INTO `settings` (`key`, `value`, `updated_at`) VALUES ('source_social_github', '', datetime('now'));
INSERT OR IGNORE INTO `settings` (`key`, `value`, `updated_at`) VALUES ('source_social_twitter', '', datetime('now'));
INSERT OR IGNORE INTO `settings` (`key`, `value`, `updated_at`) VALUES ('source_custom_footer', '', datetime('now'));
INSERT OR IGNORE INTO `settings` (`key`, `value`, `updated_at`) VALUES ('source_custom_css', '', datetime('now'));
INSERT OR IGNORE INTO `settings` (`key`, `value`, `updated_at`) VALUES ('source_custom_head', '', datetime('now'));
