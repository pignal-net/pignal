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
  q: z.string().optional(),
  tag: z.string().optional(),
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

// --- Settings schema ---

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

export type SaveItemToolInput = z.infer<typeof saveItemToolSchema>;
export type ListItemsToolInput = z.infer<typeof listItemsToolSchema>;
export type SearchItemsToolInput = z.infer<typeof searchItemsToolSchema>;
export type ValidateItemToolInput = z.infer<typeof validateItemToolSchema>;
export type UpdateItemToolInput = z.infer<typeof updateItemToolSchema>;
export type CreateWorkspaceToolInput = z.infer<typeof createWorkspaceToolSchema>;
export type CreateTypeToolInput = z.infer<typeof createTypeToolSchema>;
export type VouchItemToolInput = z.infer<typeof vouchItemToolSchema>;
export type BatchVouchItemsToolInput = z.infer<typeof batchVouchItemsToolSchema>;
