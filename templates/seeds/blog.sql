-- Seed data for blog template: signal types, validation actions, workspaces, settings

-- Item types (blog: Insight, Decision, Problem Solution, Core Point)
INSERT OR IGNORE INTO `item_types` (`id`, `name`, `description`, `color`, `icon`, `guidance`, `is_system`, `sort_order`, `created_at`, `updated_at`) VALUES ('0396b9f9-df4c-4724-aac4-552d10703c41', 'Insight', 'New understanding', '#8B5CF6', '💡', '{"pattern":"[I learned/discovered] + [specific finding] + [implication]","example":"Learned PKCE is required for mobile OAuth — our auth flow needs refactoring","whenToUse":"Use for new understanding, discoveries, or learning moments","contentHints":"Explain what you learned, why it matters, and how it changes your thinking."}', 1, 0, '2026-02-02T03:14:21.468Z', '2026-02-02T03:14:21.468Z');
INSERT OR IGNORE INTO `item_types` (`id`, `name`, `description`, `color`, `icon`, `guidance`, `is_system`, `sort_order`, `created_at`, `updated_at`) VALUES ('f238b161-f773-4670-aab5-baa339ae0912', 'Decision', 'Choice + reasoning', '#3B82F6', '⚡', '{"pattern":"[Decided/Chose] + [specific action] + [because reason]","example":"Chose Postgres over MySQL because our app needs complex join queries","whenToUse":"Use for choices made with reasoning","contentHints":"List the options considered, the criteria, and why the chosen option won. A comparison table works well here."}', 1, 1, '2026-02-02T03:14:21.468Z', '2026-02-02T03:14:21.468Z');
INSERT OR IGNORE INTO `item_types` (`id`, `name`, `description`, `color`, `icon`, `guidance`, `is_system`, `sort_order`, `created_at`, `updated_at`) VALUES ('3ace0808-3e9d-4ee9-9262-e390ab65bc61', 'Problem Solution', 'Challenge resolved', '#10B981', '✓', '{"pattern":"[Problem] → [Specific solution]","example":"Memory leak in useEffect → Add cleanup function returning clearInterval","whenToUse":"Use for challenges that were resolved","contentHints":"Describe the symptoms, root cause, solution steps, and how to verify the fix. Code blocks for any commands or snippets."}', 1, 2, '2026-02-02T03:14:21.468Z', '2026-02-02T03:14:21.468Z');
INSERT OR IGNORE INTO `item_types` (`id`, `name`, `description`, `color`, `icon`, `guidance`, `is_system`, `sort_order`, `created_at`, `updated_at`) VALUES ('6afa7636-c1a9-4ad8-b710-9ba8edb36ce8', 'Core Point', 'Reference fact', '#F59E0B', '📌', '{"pattern":"[Topic]: [Key fact or principle]","example":"React Server Components: Use for data fetching, client components for interactivity","whenToUse":"Use for reference facts, principles, or key information","contentHints":"Structure as a reference card — use tables for specs/comparisons, lists for rules, headings to separate sections."}', 1, 3, '2026-02-02T03:14:21.468Z', '2026-02-02T03:14:21.468Z');

-- Validation actions: Insight
INSERT OR IGNORE INTO `type_actions` (`id`, `type_id`, `label`, `sort_order`, `created_at`) VALUES ('29f2c428-52f9-409f-844a-1dbc04449ea8', '0396b9f9-df4c-4724-aac4-552d10703c41', 'Confirmed', 0, '2026-02-02T03:14:21.468Z');
INSERT OR IGNORE INTO `type_actions` (`id`, `type_id`, `label`, `sort_order`, `created_at`) VALUES ('9246e28a-344c-4b07-98ae-015c6763e8a1', '0396b9f9-df4c-4724-aac4-552d10703c41', 'Wrong', 1, '2026-02-02T03:14:21.468Z');
INSERT OR IGNORE INTO `type_actions` (`id`, `type_id`, `label`, `sort_order`, `created_at`) VALUES ('38dbbc02-37ed-4fd0-b9fb-80ba17de5a53', '0396b9f9-df4c-4724-aac4-552d10703c41', 'Uncertain', 2, '2026-02-02T03:14:21.468Z');
INSERT OR IGNORE INTO `type_actions` (`id`, `type_id`, `label`, `sort_order`, `created_at`) VALUES ('68efa82f-fdeb-445f-a224-3dc257a07557', '0396b9f9-df4c-4724-aac4-552d10703c41', 'Evolved', 3, '2026-02-02T03:14:21.468Z');

-- Validation actions: Decision
INSERT OR IGNORE INTO `type_actions` (`id`, `type_id`, `label`, `sort_order`, `created_at`) VALUES ('dab1afbb-d9d6-43ef-ad65-d35e42af09d2', 'f238b161-f773-4670-aab5-baa339ae0912', 'Good call', 0, '2026-02-02T03:14:21.468Z');
INSERT OR IGNORE INTO `type_actions` (`id`, `type_id`, `label`, `sort_order`, `created_at`) VALUES ('610e811d-f46b-4809-9098-495a27cb3ec7', 'f238b161-f773-4670-aab5-baa339ae0912', 'Regret', 1, '2026-02-02T03:14:21.468Z');
INSERT OR IGNORE INTO `type_actions` (`id`, `type_id`, `label`, `sort_order`, `created_at`) VALUES ('24661518-e9c4-4ce0-baf4-efcf540ac9a2', 'f238b161-f773-4670-aab5-baa339ae0912', 'Mixed', 2, '2026-02-02T03:14:21.468Z');
INSERT OR IGNORE INTO `type_actions` (`id`, `type_id`, `label`, `sort_order`, `created_at`) VALUES ('af03347e-2d4f-4fad-b828-b88d83b11109', 'f238b161-f773-4670-aab5-baa339ae0912', 'Too early', 3, '2026-02-02T03:14:21.468Z');

-- Validation actions: Problem Solution
INSERT OR IGNORE INTO `type_actions` (`id`, `type_id`, `label`, `sort_order`, `created_at`) VALUES ('cc3a13fe-24e0-417d-8840-4d62d8dab343', '3ace0808-3e9d-4ee9-9262-e390ab65bc61', 'Worked', 0, '2026-02-02T03:14:21.468Z');
INSERT OR IGNORE INTO `type_actions` (`id`, `type_id`, `label`, `sort_order`, `created_at`) VALUES ('904d8e7c-317a-4463-935f-cb4b28ac8a54', '3ace0808-3e9d-4ee9-9262-e390ab65bc61', 'Failed', 1, '2026-02-02T03:14:21.468Z');
INSERT OR IGNORE INTO `type_actions` (`id`, `type_id`, `label`, `sort_order`, `created_at`) VALUES ('8a5ff45f-2262-4007-b145-947c74ed851c', '3ace0808-3e9d-4ee9-9262-e390ab65bc61', 'Partial', 2, '2026-02-02T03:14:21.468Z');

-- Validation actions: Core Point
INSERT OR IGNORE INTO `type_actions` (`id`, `type_id`, `label`, `sort_order`, `created_at`) VALUES ('5ee5f1c7-813c-46dd-811c-3ceef6f46287', '6afa7636-c1a9-4ad8-b710-9ba8edb36ce8', 'Accurate', 0, '2026-02-02T03:14:21.468Z');
INSERT OR IGNORE INTO `type_actions` (`id`, `type_id`, `label`, `sort_order`, `created_at`) VALUES ('275402ab-5daa-42fe-9c9e-706b1747b374', '6afa7636-c1a9-4ad8-b710-9ba8edb36ce8', 'Outdated', 1, '2026-02-02T03:14:21.468Z');
INSERT OR IGNORE INTO `type_actions` (`id`, `type_id`, `label`, `sort_order`, `created_at`) VALUES ('ed49aa73-5209-434e-a390-f8084108656d', '6afa7636-c1a9-4ad8-b710-9ba8edb36ce8', 'Incomplete', 2, '2026-02-02T03:14:21.468Z');

-- Workspaces (blog: knowledge management oriented)
INSERT OR IGNORE INTO `workspaces` (`id`, `name`, `description`, `is_default`, `created_at`, `updated_at`) VALUES ('2fdee0c1-2961-4081-8661-fbbd3d5bea2f', 'Docs', 'Documentation and references', 1, '2026-02-02T03:14:21.468Z', '2026-02-02T03:14:21.468Z');
INSERT OR IGNORE INTO `workspaces` (`id`, `name`, `description`, `is_default`, `created_at`, `updated_at`) VALUES ('1ea32f32-7a29-4f0c-bb32-48be28f3c05f', 'Study', 'Learning and research', 1, '2026-02-02T03:14:21.468Z', '2026-02-02T03:14:21.468Z');
INSERT OR IGNORE INTO `workspaces` (`id`, `name`, `description`, `is_default`, `created_at`, `updated_at`) VALUES ('89031f94-66e4-482c-aa5a-f42a305f424a', 'Work', 'Professional and projects', 1, '2026-02-02T03:14:21.468Z', '2026-02-02T03:14:21.468Z');
INSERT OR IGNORE INTO `workspaces` (`id`, `name`, `description`, `is_default`, `created_at`, `updated_at`) VALUES ('959d9d06-b90b-4abe-83b3-4814df690ed6', 'Personal', 'Personal development and life', 1, '2026-02-02T03:14:21.468Z', '2026-02-02T03:14:21.468Z');

-- Blog-specific settings
INSERT OR IGNORE INTO `settings` (`key`, `value`, `updated_at`) VALUES ('source_title', 'My Signals', datetime('now'));
INSERT OR IGNORE INTO `settings` (`key`, `value`, `updated_at`) VALUES ('source_description', 'Insights captured from AI conversations', datetime('now'));

-- Blog quality guidelines: optimized for knowledge capture and recall
INSERT OR IGNORE INTO `settings` (`key`, `value`, `updated_at`) VALUES ('quality_guidelines', '{"keySummary":{"tips":"Use first-person I/My framing for better recall. Follow the type-specific pattern from guidance."},"content":{"tips":"Write for your future self reviewing this days later. ALWAYS restructure raw data into proper markdown."},"formatting":["Tables: structured/comparative data","Bullet lists: grouped items, options, non-sequential points","Numbered lists: sequential steps, ranked items, procedures","Headings: separate distinct sections within longer content","Code blocks: commands, snippets, config, error messages","Paragraphs: reasoning, context, narrative explanation"],"avoid":["Bold-only pseudo-structure","Flat text walls without hierarchy","Raw copy-paste without restructuring","Repeating the keySummary in the content"]}', datetime('now'));
INSERT OR IGNORE INTO `settings` (`key`, `value`, `updated_at`) VALUES ('validation_limits', '{"keySummary":{"min":20,"max":140},"content":{"min":1,"max":10000},"sourceAi":{"min":1,"max":100}}', datetime('now'));
