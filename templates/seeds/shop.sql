-- Seed data for shop template: product categories, review actions, collections, settings

-- Item types (shop: product categories)
INSERT OR IGNORE INTO `item_types` (`id`, `name`, `description`, `color`, `icon`, `guidance`, `is_system`, `sort_order`, `created_at`, `updated_at`) VALUES ('a1b2c3d4-1111-4000-8000-000000000001', 'Physical Product', 'Tangible goods and merchandise', '#10B981', '📦', '{"pattern":"[Product name] — [key feature or variant]","example":"Wireless Bluetooth Headphones — Active Noise Cancelling","whenToUse":"Use for physical items that can be shipped","contentHints":"Include specifications, materials, dimensions, and care instructions. Use tables for specs."}', 1, 0, '2026-02-02T03:14:21.468Z', '2026-02-02T03:14:21.468Z');
INSERT OR IGNORE INTO `item_types` (`id`, `name`, `description`, `color`, `icon`, `guidance`, `is_system`, `sort_order`, `created_at`, `updated_at`) VALUES ('a1b2c3d4-2222-4000-8000-000000000002', 'Digital Product', 'Downloads, licenses, and digital goods', '#3B82F6', '💾', '{"pattern":"[Product name] — [format or edition]","example":"UI Kit Pro — Figma + Sketch Bundle","whenToUse":"Use for downloadable or digital-only products","contentHints":"Include file formats, compatibility, license terms, and what is included."}', 1, 1, '2026-02-02T03:14:21.468Z', '2026-02-02T03:14:21.468Z');
INSERT OR IGNORE INTO `item_types` (`id`, `name`, `description`, `color`, `icon`, `guidance`, `is_system`, `sort_order`, `created_at`, `updated_at`) VALUES ('a1b2c3d4-3333-4000-8000-000000000003', 'Service', 'Professional services and subscriptions', '#8B5CF6', '🔧', '{"pattern":"[Service name] — [scope or tier]","example":"Website Audit — Full SEO + Performance Review","whenToUse":"Use for services, consultations, or subscription offerings","contentHints":"Describe what is included, deliverables, timeline, and any prerequisites."}', 1, 2, '2026-02-02T03:14:21.468Z', '2026-02-02T03:14:21.468Z');

-- Review actions: Physical Product
INSERT OR IGNORE INTO `type_actions` (`id`, `type_id`, `label`, `sort_order`, `created_at`) VALUES ('b1b2c3d4-1111-4000-8000-000000000001', 'a1b2c3d4-1111-4000-8000-000000000001', 'In Stock', 0, '2026-02-02T03:14:21.468Z');
INSERT OR IGNORE INTO `type_actions` (`id`, `type_id`, `label`, `sort_order`, `created_at`) VALUES ('b1b2c3d4-1111-4000-8000-000000000002', 'a1b2c3d4-1111-4000-8000-000000000001', 'Out of Stock', 1, '2026-02-02T03:14:21.468Z');
INSERT OR IGNORE INTO `type_actions` (`id`, `type_id`, `label`, `sort_order`, `created_at`) VALUES ('b1b2c3d4-1111-4000-8000-000000000003', 'a1b2c3d4-1111-4000-8000-000000000001', 'Discontinued', 2, '2026-02-02T03:14:21.468Z');

-- Review actions: Digital Product
INSERT OR IGNORE INTO `type_actions` (`id`, `type_id`, `label`, `sort_order`, `created_at`) VALUES ('b1b2c3d4-2222-4000-8000-000000000001', 'a1b2c3d4-2222-4000-8000-000000000002', 'Available', 0, '2026-02-02T03:14:21.468Z');
INSERT OR IGNORE INTO `type_actions` (`id`, `type_id`, `label`, `sort_order`, `created_at`) VALUES ('b1b2c3d4-2222-4000-8000-000000000002', 'a1b2c3d4-2222-4000-8000-000000000002', 'Updated', 1, '2026-02-02T03:14:21.468Z');
INSERT OR IGNORE INTO `type_actions` (`id`, `type_id`, `label`, `sort_order`, `created_at`) VALUES ('b1b2c3d4-2222-4000-8000-000000000003', 'a1b2c3d4-2222-4000-8000-000000000002', 'Deprecated', 2, '2026-02-02T03:14:21.468Z');

-- Review actions: Service
INSERT OR IGNORE INTO `type_actions` (`id`, `type_id`, `label`, `sort_order`, `created_at`) VALUES ('b1b2c3d4-3333-4000-8000-000000000001', 'a1b2c3d4-3333-4000-8000-000000000003', 'Accepting Clients', 0, '2026-02-02T03:14:21.468Z');
INSERT OR IGNORE INTO `type_actions` (`id`, `type_id`, `label`, `sort_order`, `created_at`) VALUES ('b1b2c3d4-3333-4000-8000-000000000002', 'a1b2c3d4-3333-4000-8000-000000000003', 'Fully Booked', 1, '2026-02-02T03:14:21.468Z');
INSERT OR IGNORE INTO `type_actions` (`id`, `type_id`, `label`, `sort_order`, `created_at`) VALUES ('b1b2c3d4-3333-4000-8000-000000000003', 'a1b2c3d4-3333-4000-8000-000000000003', 'Paused', 2, '2026-02-02T03:14:21.468Z');

-- Collections (shop: product organization)
INSERT OR IGNORE INTO `workspaces` (`id`, `name`, `description`, `visibility`, `is_default`, `created_at`, `updated_at`) VALUES ('c1b2c3d4-1111-4000-8000-000000000001', 'New Arrivals', 'Recently added products', 'public', 1, '2026-02-02T03:14:21.468Z', '2026-02-02T03:14:21.468Z');
INSERT OR IGNORE INTO `workspaces` (`id`, `name`, `description`, `visibility`, `is_default`, `created_at`, `updated_at`) VALUES ('c1b2c3d4-2222-4000-8000-000000000002', 'Featured', 'Hand-picked highlights', 'public', 1, '2026-02-02T03:14:21.468Z', '2026-02-02T03:14:21.468Z');
INSERT OR IGNORE INTO `workspaces` (`id`, `name`, `description`, `visibility`, `is_default`, `created_at`, `updated_at`) VALUES ('c1b2c3d4-3333-4000-8000-000000000003', 'Sale', 'Discounted items', 'public', 1, '2026-02-02T03:14:21.468Z', '2026-02-02T03:14:21.468Z');

-- Shop-specific settings
INSERT OR IGNORE INTO `settings` (`key`, `value`, `updated_at`) VALUES ('source_title', 'My Shop', datetime('now'));
INSERT OR IGNORE INTO `settings` (`key`, `value`, `updated_at`) VALUES ('source_description', 'Browse our product catalog', datetime('now'));

-- Shop quality guidelines: optimized for product listings
INSERT OR IGNORE INTO `settings` (`key`, `value`, `updated_at`) VALUES ('quality_guidelines', '{"keySummary":{"tips":"Use clear product name with key variant or feature. Example: Wireless Headphones — Active Noise Cancelling, Black"},"content":{"tips":"Write for shoppers scanning quickly. Lead with what the product does, then specs and details."},"formatting":["Tables: specifications, dimensions, compatibility","Bullet lists: features, what is included, requirements","Numbered lists: setup steps, usage instructions","Headings: separate Description, Specifications, What is Included sections","Bold: highlight key specs or standout features"],"avoid":["Vague descriptions without specifics","Marketing fluff without substance","Missing key specs (size, weight, compatibility)","Repeating the product name in the description body"]}', datetime('now'));
INSERT OR IGNORE INTO `settings` (`key`, `value`, `updated_at`) VALUES ('validation_limits', '{"keySummary":{"min":10,"max":200},"content":{"min":1,"max":20000},"sourceAi":{"min":1,"max":100}}', datetime('now'));
