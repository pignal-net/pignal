import { z } from 'zod';

// --- Item schemas ---

// Hard limits (technical ceiling). Soft limits are configured via settings and enforced by ItemStore.
export const createItemSchema = z.object({
  keySummary: z.string().min(1).max(500),
  content: z.string().min(1).max(50000),
  typeId: z.string().uuid(),
  workspaceId: z.string().uuid().optional(),
  sourceAi: z.string().min(1).max(200),
  tags: z.array(z.string().min(1).max(50)).max(20).optional(),
});

export const updateItemSchema = z.object({
  keySummary: z.string().min(1).max(500).optional(),
  content: z.string().min(1).max(50000).optional(),
  typeId: z.string().uuid().optional(),
  workspaceId: z.string().uuid().nullable().optional(),
  tags: z.array(z.string().min(1).max(50)).max(20).nullable().optional(),
});

export const validateSchema = z.object({
  actionId: z.string().uuid().nullable(),
});

export const listQuerySchema = z.object({
  typeId: z.string().optional(),
  workspaceId: z.string().optional(),
  isArchived: z.coerce.boolean().optional().default(false),
  visibility: z.enum(['private', 'unlisted', 'vouched']).optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
  offset: z.coerce.number().min(0).optional().default(0),
  q: z.string().max(500).optional(),
  tag: z.string().max(100).optional(),
});

export const vouchSchema = z.object({
  visibility: z.enum(['private', 'unlisted', 'vouched']),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/).optional(),
});

// --- Type schemas ---

export const actionDefSchema = z.object({
  label: z.string().min(1).max(50),
  sortOrder: z.number().int().optional(),
});

export const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be hex format #RRGGBB')
  .optional();

export const guidanceSchema = z
  .object({
    pattern: z.string().max(500).optional(),
    example: z.string().max(1000).optional(),
    whenToUse: z.string().max(500).optional(),
    contentHints: z.string().max(500).optional(),
  })
  .optional();

export const createTypeSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(500).optional(),
  color: hexColorSchema,
  icon: z.string().min(1).max(10).optional(),
  guidance: guidanceSchema,
  actions: z.array(actionDefSchema).min(1).max(10),
});

export const updateTypeSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().max(500).optional(),
  color: hexColorSchema.nullable(),
  icon: z.string().min(1).max(10).optional().nullable(),
  guidance: guidanceSchema.nullable(),
});

export const addActionSchema = z.object({
  label: z.string().min(1).max(50),
  sortOrder: z.number().int().optional(),
});

// --- Workspace schemas ---

export const workspaceVisibilitySchema = z.enum(['public', 'private']);

export const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  visibility: workspaceVisibilitySchema.optional().default('private'),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  visibility: workspaceVisibilitySchema.optional(),
});

// --- Settings registry ---

export type SettingValueType = 'string' | 'boolean' | 'number' | 'color' | 'url' | 'json' | 'select' | 'textarea';
export type SettingGroup = 'general' | 'branding' | 'social' | 'content' | 'cta' | 'advanced';

export interface SettingDefinition {
  group: SettingGroup;
  description: string;
  valueType: SettingValueType;
  options?: string[];
}

/** Single source of truth for all allowed settings. Adding a key here auto-enables it in the API and MCP. */
export const SETTINGS_REGISTRY: Record<string, SettingDefinition> = {
  // --- General ---
  owner_name: { group: 'general', description: 'Site owner display name (used in SEO and JSON-LD)', valueType: 'string' },
  source_title: { group: 'general', description: 'Site title shown in navigation and browser tab', valueType: 'string' },
  source_description: { group: 'general', description: 'Site description for SEO meta tags', valueType: 'textarea' },
  source_locale: { group: 'general', description: 'Default site language', valueType: 'select', options: ['en', 'vi', 'zh'] },

  // --- Branding ---
  source_logo_text: { group: 'branding', description: 'Text-based logo shown when no logo image is set', valueType: 'string' },
  source_logo_url: { group: 'branding', description: 'Logo image URL displayed in navigation', valueType: 'url' },
  source_favicon_url: { group: 'branding', description: 'Favicon URL for browser tab icon', valueType: 'url' },
  source_og_image_url: { group: 'branding', description: 'Default Open Graph image for social media previews', valueType: 'url' },
  source_color_accent: { group: 'branding', description: 'Primary accent color for buttons, links, and highlights (hex)', valueType: 'color' },
  source_font_heading: { group: 'branding', description: 'Google Font for headings', valueType: 'select', options: ['Inter', 'Source Sans 3', 'DM Sans', 'Open Sans', 'Lora', 'Merriweather', 'Source Serif 4', 'Playfair Display', 'JetBrains Mono', 'Fira Code'] },
  source_font_body: { group: 'branding', description: 'Google Font for body text', valueType: 'select', options: ['Inter', 'Source Sans 3', 'DM Sans', 'Open Sans', 'Lora', 'Merriweather', 'Source Serif 4', 'Playfair Display', 'JetBrains Mono', 'Fira Code'] },

  // --- Social ---
  source_social_github: { group: 'social', description: 'GitHub profile URL', valueType: 'url' },
  source_social_twitter: { group: 'social', description: 'Twitter/X profile URL', valueType: 'url' },
  source_social_linkedin: { group: 'social', description: 'LinkedIn profile URL', valueType: 'url' },
  source_social_mastodon: { group: 'social', description: 'Mastodon profile URL', valueType: 'url' },
  source_social_youtube: { group: 'social', description: 'YouTube channel URL', valueType: 'url' },
  source_social_website: { group: 'social', description: 'Personal or company website URL', valueType: 'url' },

  // --- Content ---
  source_posts_per_page: { group: 'content', description: 'Number of items per page on the public source page', valueType: 'number' },
  source_show_reading_time: { group: 'content', description: 'Show estimated reading time on item posts', valueType: 'boolean' },
  source_code_theme: { group: 'content', description: 'Syntax highlighting theme for code blocks', valueType: 'select', options: ['default', 'github', 'monokai'] },
  source_custom_footer: { group: 'content', description: 'Custom footer text (replaces default "Powered by Pignal")', valueType: 'textarea' },
  quality_guidelines: { group: 'content', description: 'JSON quality rules for AI-authored content (keySummary tips, content tips, formatting, avoid list)', valueType: 'json' },
  validation_limits: { group: 'content', description: 'JSON field length limits (keySummary min/max, content min/max)', valueType: 'json' },
  max_actions_per_type: { group: 'content', description: 'Maximum validation actions allowed per item type (1-10)', valueType: 'number' },
  testimonial_type_name: { group: 'content', description: 'Item type name used for testimonial rendering via {{testimonials}} directive', valueType: 'string' },

  // --- CTA (Hero) ---
  cta_hero_enabled: { group: 'cta', description: 'Show hero CTA block on the source page', valueType: 'boolean' },
  cta_hero_title: { group: 'cta', description: 'Hero CTA heading text', valueType: 'string' },
  cta_hero_description: { group: 'cta', description: 'Hero CTA description text', valueType: 'textarea' },
  cta_hero_button_text: { group: 'cta', description: 'Hero CTA button label', valueType: 'string' },
  cta_hero_button_url: { group: 'cta', description: 'Hero CTA button link URL (mutually exclusive with action slug)', valueType: 'url' },
  cta_hero_action_slug: { group: 'cta', description: 'Hero CTA action form slug for inline form display', valueType: 'string' },
  // --- CTA (Post) ---
  cta_post_enabled: { group: 'cta', description: 'Show CTA block after item post content', valueType: 'boolean' },
  cta_post_title: { group: 'cta', description: 'Post CTA heading text', valueType: 'string' },
  cta_post_description: { group: 'cta', description: 'Post CTA description text', valueType: 'textarea' },
  cta_post_button_text: { group: 'cta', description: 'Post CTA button label', valueType: 'string' },
  cta_post_button_url: { group: 'cta', description: 'Post CTA button link URL', valueType: 'url' },
  cta_post_action_slug: { group: 'cta', description: 'Post CTA action form slug', valueType: 'string' },
  // --- CTA (Sticky) ---
  cta_sticky_enabled: { group: 'cta', description: 'Show sticky CTA bar at page bottom', valueType: 'boolean' },
  cta_sticky_text: { group: 'cta', description: 'Sticky CTA text content', valueType: 'string' },
  cta_sticky_button_text: { group: 'cta', description: 'Sticky CTA button label', valueType: 'string' },
  cta_sticky_button_url: { group: 'cta', description: 'Sticky CTA button link URL', valueType: 'url' },
  cta_sticky_action_slug: { group: 'cta', description: 'Sticky CTA action form slug', valueType: 'string' },

  // --- Advanced ---
  source_custom_css: { group: 'advanced', description: 'Custom CSS injected into public pages (sanitized)', valueType: 'textarea' },
  source_custom_head: { group: 'advanced', description: 'Custom HTML injected into <head> (for analytics, fonts, scripts)', valueType: 'textarea' },
  webhook_url: { group: 'advanced', description: 'Webhook endpoint URL for event delivery (HTTP POST)', valueType: 'url' },
  webhook_events: { group: 'advanced', description: 'Comma-separated list of webhook event types (empty = all events)', valueType: 'string' },
  webhook_secret: { group: 'advanced', description: 'HMAC-SHA256 secret for webhook signature verification', valueType: 'string' },
};

/** Derived from SETTINGS_REGISTRY — always in sync. */
export const ALLOWED_SETTINGS_KEYS = new Set(Object.keys(SETTINGS_REGISTRY));

/** Returns settings grouped by category for sectioned metadata and UI rendering. */
export function getSettingsRegistryByGroup(): Record<SettingGroup, Array<SettingDefinition & { key: string }>> {
  const groups: Record<SettingGroup, Array<SettingDefinition & { key: string }>> = {
    general: [], branding: [], social: [], content: [], cta: [], advanced: [],
  };
  for (const [key, def] of Object.entries(SETTINGS_REGISTRY)) {
    groups[def.group].push({ key, ...def });
  }
  return groups;
}

export const updateSettingSchema = z.object({
  value: z.string().min(1).max(10000),
});

// --- MCP tool schemas ---

export const saveItemToolSchema = z.object({
  keySummary: z
    .string()
    .min(1)
    .max(500)
    .describe(
      'Concise title or summary. Check get_metadata for current length limits and type-specific patterns.'
    ),
  content: z
    .string()
    .min(1)
    .max(50000)
    .describe(
      'Full content in markdown. Check get_metadata for current limits and formatting guidelines.'
    ),
  typeId: z
    .string()
    .describe('Type ID (from get_metadata). Choose the most specific type that fits.'),
  workspaceId: z
    .string()
    .optional()
    .describe('Optional workspace ID for organizing by context (from get_metadata).'),
  tags: z
    .array(z.string().min(1).max(50))
    .max(20)
    .optional()
    .describe('Optional tags for categorization. Use lowercase, relevant keywords.'),
});

export const listItemsToolSchema = z.object({
  typeId: z.string().optional().describe('Filter by type ID (from get_metadata).'),
  workspaceId: z.string().optional().describe('Filter by workspace ID (from get_metadata).'),
  isArchived: z
    .boolean()
    .optional()
    .default(false)
    .describe('Include archived items. Defaults to false (active only).'),
  limit: z.number().min(1).max(50).optional().default(20).describe('Number of results'),
  offset: z.number().min(0).optional().default(0).describe('Pagination offset'),
  include_metadata: z
    .array(
      z.enum([
        'type_id',
        'workspace_id',
        'validation_action_id',
        'source_ai',
        'created_at',
        'updated_at',
      ])
    )
    .optional()
    .describe(
      'Additional metadata fields to include: type_id, workspace_id, validation_action_id, source_ai, created_at, updated_at'
    ),
});

export const searchItemsToolSchema = z.object({
  query: z
    .string()
    .min(1)
    .max(200)
    .describe('Search keyword. Matches against titles and content.'),
  typeId: z.string().optional().describe('Filter by type ID (from get_metadata).'),
  workspaceId: z.string().optional().describe('Filter by workspace ID (from get_metadata).'),
  limit: z.number().min(1).max(50).optional().default(20).describe('Number of results'),
  include_metadata: z
    .array(
      z.enum([
        'type_id',
        'workspace_id',
        'validation_action_id',
        'source_ai',
        'created_at',
        'updated_at',
      ])
    )
    .optional()
    .describe(
      'Additional metadata fields to include: type_id, workspace_id, validation_action_id, source_ai, created_at, updated_at'
    ),
});

export const validateItemToolSchema = z.object({
  itemId: z.string().describe('ID of the item to validate (from list or search results).'),
  actionId: z
    .string()
    .nullable()
    .describe(
      'Validation action ID (from get_metadata), or null to clear.'
    ),
});

export const updateItemToolSchema = z.object({
  itemId: z.string().describe('ID of the item to update (from list or search results).'),
  keySummary: z
    .string()
    .min(1)
    .max(500)
    .optional()
    .describe('Updated title or summary. Check get_metadata for current length limits.'),
  content: z
    .string()
    .min(1)
    .max(50000)
    .optional()
    .describe('Updated content in markdown. Check get_metadata for current limits.'),
  typeId: z.string().optional().describe('New type ID (from get_metadata).'),
  workspaceId: z
    .string()
    .nullable()
    .optional()
    .describe('New workspace ID (from get_metadata), or null to remove.'),
  tags: z
    .array(z.string().min(1).max(50))
    .max(20)
    .nullable()
    .optional()
    .describe('Updated tags, or null to clear all tags.'),
});

export const createWorkspaceToolSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(100)
    .describe('Name. Use a clear, descriptive name.'),
  description: z
    .string()
    .max(500)
    .optional()
    .describe('Optional description.'),
  visibility: z
    .enum(['public', 'private'])
    .optional()
    .describe('Visibility: "public" (shown on source page) or "private" (default, hidden).'),
});

export const createTypeToolSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(50)
    .describe('Type name.'),
  description: z
    .string()
    .max(500)
    .optional()
    .describe('Brief description of when to use this type.'),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional()
    .describe('Hex color code (e.g., "#FF5733") for visual identification.'),
  icon: z
    .string()
    .min(1)
    .max(10)
    .optional()
    .describe('Emoji icon for the type (e.g., "🐛", "🏗️").'),
  guidance: z
    .object({
      pattern: z.string().max(500).optional().describe('Pattern for keySummary (e.g., "Fixed: [what] in [where]").'),
      example: z.string().max(1000).optional().describe('Example keySummary following the pattern.'),
      whenToUse: z.string().max(500).optional().describe('When this type should be chosen over others.'),
      contentHints: z.string().max(500).optional().describe('Tips for writing the content field.'),
    })
    .optional()
    .describe('Guidance for writing content of this type.'),
  actions: z
    .array(
      z.object({
        label: z.string().min(1).max(50).describe('Action label.'),
        sortOrder: z.number().int().optional().describe('Display order (lower = first).'),
      })
    )
    .min(1)
    .max(10)
    .describe('Validation actions for this type (at least 1).'),
});

export const vouchItemToolSchema = z.object({
  itemId: z.string().describe('ID of the item to vouch (from list or search results).'),
  visibility: z
    .enum(['private', 'unlisted', 'vouched'])
    .describe(
      'Target visibility: "vouched" makes it public with a slug, "unlisted" creates a share link, "private" reverts to hidden.'
    ),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/)
    .optional()
    .describe(
      'Optional custom URL slug for vouched items (lowercase alphanumeric + hyphens). Auto-generated from keySummary if omitted.'
    ),
});

export const batchVouchItemsToolSchema = z.object({
  items: z
    .array(
      z.object({
        itemId: z.string().describe('Item ID'),
        visibility: z
          .enum(['private', 'unlisted', 'vouched'])
          .describe('Target visibility'),
        slug: z
          .string()
          .min(1)
          .max(200)
          .regex(/^[a-z0-9-]+$/)
          .optional()
          .describe('Optional custom slug for vouched items'),
      })
    )
    .min(1)
    .max(50)
    .describe('Array of items to vouch (max 50 per batch).'),
});

// --- Site Action schemas ---

export const siteActionFieldSchema = z.object({
  name: z.string().min(1).max(50).regex(/^[a-z0-9_]+$/),
  type: z.enum(['text', 'email', 'textarea', 'select', 'url', 'tel', 'number', 'checkbox']),
  label: z.string().min(1).max(100),
  required: z.boolean().optional().default(false),
  placeholder: z.string().max(200).optional(),
  maxLength: z.number().int().min(1).max(10000).optional(),
  options: z.array(z.object({ value: z.string().min(1), label: z.string().min(1) })).optional(),
});

export const siteActionSettingsSchema = z.object({
  success_message: z.string().max(500).optional(),
  redirect_url: z.string().url().max(2000).optional(),
  require_honeypot: z.boolean().optional(),
  webhook_url: z.string().url().max(2000).optional(),
  rate_limit_per_hour: z.number().int().min(1).max(1000).optional(),
});

export const createSiteActionSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional(),
  fields: z.array(siteActionFieldSchema).min(1).max(20),
  settings: siteActionSettingsSchema.optional(),
});

export const updateSiteActionSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().max(500).nullable().optional(),
  fields: z.array(siteActionFieldSchema).min(1).max(20).optional(),
  settings: siteActionSettingsSchema.optional(),
  status: z.enum(['active', 'paused', 'archived']).optional(),
});

export const listSubmissionsQuerySchema = z.object({
  actionId: z.string().optional(),
  status: z.enum(['new', 'read', 'replied', 'archived', 'spam']).optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
  offset: z.coerce.number().min(0).optional().default(0),
});

export const updateSubmissionStatusSchema = z.object({
  status: z.enum(['new', 'read', 'replied', 'archived', 'spam']),
});

// --- MCP tool schemas for Site Actions ---

export const createActionToolSchema = z.object({
  name: z.string().min(1).max(100).describe('Display name for the form (e.g., "Contact Form", "Newsletter Signup").'),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).describe('URL-safe identifier. Use in content as {{action:slug}} to embed the form inline.'),
  description: z.string().max(500).optional().describe('Optional description shown above the form.'),
  fields: z.array(siteActionFieldSchema).min(1).max(20).describe('Form field definitions. Each field has name, type, label, and optional validation.'),
  settings: siteActionSettingsSchema.optional().describe('Optional settings: success_message, redirect_url, webhook_url, require_honeypot.'),
});

export const updateActionToolSchema = z.object({
  actionId: z.string().describe('ID of the action to update (from list_actions).'),
  name: z.string().min(1).max(100).optional().describe('Updated display name.'),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional().describe('Updated slug.'),
  description: z.string().max(500).nullable().optional().describe('Updated description, or null to clear.'),
  fields: z.array(siteActionFieldSchema).min(1).max(20).optional().describe('Updated field definitions (replaces all fields).'),
  settings: siteActionSettingsSchema.optional().describe('Updated settings (merged with existing).'),
  status: z.enum(['active', 'paused', 'archived']).optional().describe('Updated status.'),
});

export const listActionsToolSchema = z.object({
  status: z.enum(['active', 'paused', 'archived']).optional().describe('Filter by status. Omit to list all.'),
});

export const listSubmissionsToolSchema = z.object({
  actionId: z.string().optional().describe('Filter by action ID. Omit to list all submissions.'),
  status: z.enum(['new', 'read', 'replied', 'archived', 'spam']).optional().describe('Filter by submission status.'),
  limit: z.number().min(1).max(50).optional().default(20).describe('Number of results.'),
  offset: z.number().min(0).optional().default(0).describe('Pagination offset.'),
});

export const manageSubmissionToolSchema = z.object({
  submissionId: z.string().describe('ID of the submission to update.'),
  status: z.enum(['new', 'read', 'replied', 'archived', 'spam']).describe('New status for the submission.'),
});

// --- New MCP tool schemas (lifecycle management) ---

export const deleteItemToolSchema = z.object({
  itemId: z.string().describe('ID of the item to permanently delete.'),
});

export const archiveItemToolSchema = z.object({
  itemId: z.string().describe('ID of the item to archive.'),
});

export const unarchiveItemToolSchema = z.object({
  itemId: z.string().describe('ID of the item to unarchive (restore to active).'),
});

export const updateTypeToolSchema = z.object({
  typeId: z.string().describe('ID of the type to update (from get_metadata).'),
  name: z.string().min(1).max(50).optional().describe('Updated type name.'),
  description: z.string().max(500).optional().describe('Updated description.'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional().describe('Updated hex color, or null to clear.'),
  icon: z.string().min(1).max(10).nullable().optional().describe('Updated emoji icon, or null to clear.'),
  guidance: z.object({
    pattern: z.string().max(500).optional(),
    example: z.string().max(1000).optional(),
    whenToUse: z.string().max(500).optional(),
    contentHints: z.string().max(500).optional(),
  }).nullable().optional().describe('Updated writing guidance, or null to clear.'),
});

export const deleteTypeToolSchema = z.object({
  typeId: z.string().describe('ID of the type to delete. Fails if items of this type exist.'),
});

export const addTypeActionToolSchema = z.object({
  typeId: z.string().describe('ID of the type to add the validation action to.'),
  label: z.string().min(1).max(50).describe('Label for the validation action (e.g., "Reviewed", "Approved").'),
  sortOrder: z.number().int().optional().describe('Display order (lower = first).'),
});

export const removeTypeActionToolSchema = z.object({
  actionId: z.string().describe('ID of the validation action to remove (from get_metadata type details).'),
});

export const updateWorkspaceToolSchema = z.object({
  workspaceId: z.string().describe('ID of the workspace to update (from get_metadata).'),
  name: z.string().min(1).max(100).optional().describe('Updated name.'),
  description: z.string().max(500).optional().describe('Updated description.'),
  visibility: z.enum(['public', 'private']).optional().describe('Updated visibility.'),
});

export const deleteWorkspaceToolSchema = z.object({
  workspaceId: z.string().describe('ID of the workspace to delete.'),
});

export const updateSettingsToolSchema = z.object({
  settings: z.array(z.object({
    key: z.string().describe('Setting key (from get_metadata sections=settings).'),
    value: z.string().max(10000).describe('New value for the setting.'),
  })).min(1).max(20).describe('Array of settings to update (max 20 per batch). Call get_metadata with sections=settings to discover available keys.'),
});

export const deleteActionToolSchema = z.object({
  actionId: z.string().describe('ID of the site action (form) to delete.'),
});

export const deleteSubmissionToolSchema = z.object({
  submissionId: z.string().describe('ID of the submission to delete.'),
});

export const getSubmissionStatsToolSchema = z.object({});

export const exportSubmissionsToolSchema = z.object({
  actionId: z.string().describe('ID of the action whose submissions to export.'),
  format: z.enum(['json', 'csv']).optional().default('json').describe('Export format.'),
});

export const getMetadataToolSchema = z.object({
  sections: z.array(z.enum(['types', 'workspaces', 'settings', 'guidelines'])).optional()
    .describe('Sections to retrieve (e.g. ["types","settings"]). Omit for a lightweight summary. Pass multiple to fetch several at once.'),
});

export const batchUpdateSettingsSchema = z.object({
  settings: z.array(z.object({
    key: z.string(),
    value: z.string().max(10000),
  })).min(1).max(50),
});

// --- Type exports ---

export type SaveItemToolInput = z.infer<typeof saveItemToolSchema>;
export type ListItemsToolInput = z.infer<typeof listItemsToolSchema>;
export type SearchItemsToolInput = z.infer<typeof searchItemsToolSchema>;
export type ValidateItemToolInput = z.infer<typeof validateItemToolSchema>;
export type UpdateItemToolInput = z.infer<typeof updateItemToolSchema>;
export type CreateWorkspaceToolInput = z.infer<typeof createWorkspaceToolSchema>;
export type CreateTypeToolInput = z.infer<typeof createTypeToolSchema>;
export type VouchItemToolInput = z.infer<typeof vouchItemToolSchema>;
export type BatchVouchItemsToolInput = z.infer<typeof batchVouchItemsToolSchema>;
export type CreateSiteActionInput = z.infer<typeof createSiteActionSchema>;
export type UpdateSiteActionInput = z.infer<typeof updateSiteActionSchema>;
export type CreateActionToolInput = z.infer<typeof createActionToolSchema>;
export type UpdateActionToolInput = z.infer<typeof updateActionToolSchema>;
export type ListActionsToolInput = z.infer<typeof listActionsToolSchema>;
export type ListSubmissionsToolInput = z.infer<typeof listSubmissionsToolSchema>;
export type ManageSubmissionToolInput = z.infer<typeof manageSubmissionToolSchema>;
export type DeleteItemToolInput = z.infer<typeof deleteItemToolSchema>;
export type ArchiveItemToolInput = z.infer<typeof archiveItemToolSchema>;
export type UnarchiveItemToolInput = z.infer<typeof unarchiveItemToolSchema>;
export type UpdateTypeToolInput = z.infer<typeof updateTypeToolSchema>;
export type DeleteTypeToolInput = z.infer<typeof deleteTypeToolSchema>;
export type AddTypeActionToolInput = z.infer<typeof addTypeActionToolSchema>;
export type RemoveTypeActionToolInput = z.infer<typeof removeTypeActionToolSchema>;
export type UpdateWorkspaceToolInput = z.infer<typeof updateWorkspaceToolSchema>;
export type DeleteWorkspaceToolInput = z.infer<typeof deleteWorkspaceToolSchema>;
export type UpdateSettingsToolInput = z.infer<typeof updateSettingsToolSchema>;
export type DeleteActionToolInput = z.infer<typeof deleteActionToolSchema>;
export type DeleteSubmissionToolInput = z.infer<typeof deleteSubmissionToolSchema>;
export type ExportSubmissionsToolInput = z.infer<typeof exportSubmissionsToolSchema>;
export type GetMetadataToolInput = z.infer<typeof getMetadataToolSchema>;
