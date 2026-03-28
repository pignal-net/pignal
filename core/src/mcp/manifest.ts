import { zodToJsonSchema } from 'zod-to-json-schema';

import {
  saveItemToolSchema,
  listItemsToolSchema,
  searchItemsToolSchema,
  validateItemToolSchema,
  updateItemToolSchema,
  createWorkspaceToolSchema,
  createTypeToolSchema,
  vouchItemToolSchema,
  batchVouchItemsToolSchema,
  createActionToolSchema,
  updateActionToolSchema,
  listActionsToolSchema,
  listSubmissionsToolSchema,
  manageSubmissionToolSchema,
  getMetadataToolSchema,
  deleteItemToolSchema,
  archiveItemToolSchema,
  unarchiveItemToolSchema,
  updateTypeToolSchema,
  deleteTypeToolSchema,
  addTypeActionToolSchema,
  removeTypeActionToolSchema,
  updateWorkspaceToolSchema,
  deleteWorkspaceToolSchema,
  updateSettingsToolSchema,
  deleteActionToolSchema,
  deleteSubmissionToolSchema,
  getSubmissionStatsToolSchema,
  exportSubmissionsToolSchema,
} from '../validation/schemas';
import type { ToolDefinition } from '../federation/types';

/** MCP config for template-specific tool descriptions. Structurally compatible with TemplateMcpConfig from @pignal/templates. */
interface McpConfig {
  toolDescriptions: Record<string, string>;
}

export function getDefaultToolManifest(mcpConfig?: McpConfig): ToolDefinition[] {
  const td = mcpConfig?.toolDescriptions;
  return [
    {
      name: 'save_item',
      description:
        td?.save_item ??
        'Save a structured item from this conversation for long-term retention. ALWAYS call get_metadata first — it provides required IDs, current limits, and quality guidelines for writing effective items.',
      inputSchema: zodToJsonSchema(saveItemToolSchema, {
        target: 'openApi3',
      }) as Record<string, unknown>,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
      },
      endpoint: { method: 'POST', path: '/api/items' },
      requiredScopes: ['items:write'],
      responseFormat: 'item',
    },
    {
      name: 'list_items',
      description:
        td?.list_items ??
        "Browse the user's items with optional filters. Use to review existing items or check for duplicates before saving.",
      inputSchema: zodToJsonSchema(listItemsToolSchema, {
        target: 'openApi3',
      }) as Record<string, unknown>,
      annotations: { readOnlyHint: true, idempotentHint: true },
      endpoint: {
        method: 'GET',
        path: '/api/items',
        queryParams: [
          'typeId',
          'workspaceId',
          'isArchived',
          'limit',
          'offset',
        ],
      },
      requiredScopes: ['items:read'],
      responseFormat: 'item_list',
    },
    {
      name: 'search_items',
      description:
        td?.search_items ??
        'Search items by keyword across summaries and content. Use to find related knowledge before saving or to locate items for validation.',
      inputSchema: zodToJsonSchema(searchItemsToolSchema, {
        target: 'openApi3',
      }) as Record<string, unknown>,
      annotations: { readOnlyHint: true, idempotentHint: true },
      endpoint: {
        method: 'GET',
        path: '/api/items',
        queryParams: ['q', 'typeId', 'workspaceId', 'limit'],
      },
      requiredScopes: ['items:read'],
      responseFormat: 'item_list',
    },
    {
      name: 'get_metadata',
      description:
        td?.get_metadata ??
        'Get item types, workspaces, and quality guidelines. ALWAYS call this first before save_item or validate_item.',
      inputSchema: zodToJsonSchema(getMetadataToolSchema, { target: 'openApi3' }) as Record<string, unknown>,
      annotations: { readOnlyHint: true, idempotentHint: true },
      endpoint: { method: 'GET', path: '/api/metadata', queryParams: ['sections'] },
      requiredScopes: ['profile:read'],
      responseFormat: 'metadata',
    },
    {
      name: 'validate_item',
      description:
        td?.validate_item ??
        'Apply a validation action to an item. Call get_metadata first for valid action IDs.',
      inputSchema: zodToJsonSchema(validateItemToolSchema, {
        target: 'openApi3',
      }) as Record<string, unknown>,
      annotations: { readOnlyHint: false, idempotentHint: true },
      endpoint: {
        method: 'POST',
        path: '/api/items/{itemId}/validate',
        pathParams: ['itemId'],
        bodyParams: ['actionId'],
      },
      requiredScopes: ['items:write'],
      responseFormat: 'item',
    },
    {
      name: 'update_item',
      description:
        td?.update_item ??
        'Update an existing item. Use to correct, expand, or reclassify a previously saved item.',
      inputSchema: zodToJsonSchema(updateItemToolSchema, {
        target: 'openApi3',
      }) as Record<string, unknown>,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
      },
      endpoint: {
        method: 'PATCH',
        path: '/api/items/{itemId}',
        pathParams: ['itemId'],
      },
      requiredScopes: ['items:write'],
      responseFormat: 'item',
    },
    {
      name: 'create_workspace',
      description:
        td?.create_workspace ??
        'Create a new workspace for organizing items by project or context. Call get_metadata first to see existing workspaces.',
      inputSchema: zodToJsonSchema(createWorkspaceToolSchema, {
        target: 'openApi3',
      }) as Record<string, unknown>,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
      },
      endpoint: { method: 'POST', path: '/api/workspaces' },
      requiredScopes: ['items:write'],
      responseFormat: 'raw',
    },
    {
      name: 'create_type',
      description:
        td?.create_type ??
        'Create a new item type with validation actions. Call get_metadata first to see existing types and avoid duplicates.',
      inputSchema: zodToJsonSchema(createTypeToolSchema, {
        target: 'openApi3',
      }) as Record<string, unknown>,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
      },
      endpoint: { method: 'POST', path: '/api/types' },
      requiredScopes: ['items:write'],
      responseFormat: 'raw',
    },
    {
      name: 'vouch_item',
      description:
        td?.vouch_item ??
        'Change an item\'s visibility: "vouched" makes it public with a URL slug, "unlisted" creates a share link, "private" hides it. Use to publish items to the source page.',
      inputSchema: zodToJsonSchema(vouchItemToolSchema, {
        target: 'openApi3',
      }) as Record<string, unknown>,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
      },
      endpoint: {
        method: 'POST',
        path: '/api/items/{itemId}/vouch',
        pathParams: ['itemId'],
        bodyParams: ['visibility', 'slug'],
      },
      requiredScopes: ['items:write'],
      responseFormat: 'item',
    },
    {
      name: 'batch_vouch_items',
      description:
        td?.batch_vouch_items ??
        'Change visibility for multiple items at once (max 50). Each item can have its own visibility and optional slug. Use to publish a batch of items to the source page.',
      inputSchema: zodToJsonSchema(batchVouchItemsToolSchema, {
        target: 'openApi3',
      }) as Record<string, unknown>,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
      },
      endpoint: {
        method: 'POST',
        path: '/api/items/batch-vouch',
      },
      requiredScopes: ['items:write'],
      responseFormat: 'raw',
    },
    {
      name: 'create_action',
      description:
        td?.create_action ??
        'Create a site action (form) for lead capture, contact, newsletter signup, etc. Returns the slug for embedding in content via {{action:slug}}.',
      inputSchema: zodToJsonSchema(createActionToolSchema, {
        target: 'openApi3',
      }) as Record<string, unknown>,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
      },
      endpoint: { method: 'POST', path: '/api/actions' },
      requiredScopes: ['items:write'],
      responseFormat: 'raw',
    },
    {
      name: 'update_action',
      description:
        td?.update_action ??
        'Update a site action — modify fields, settings, status, or slug.',
      inputSchema: zodToJsonSchema(updateActionToolSchema, {
        target: 'openApi3',
      }) as Record<string, unknown>,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
      },
      endpoint: {
        method: 'PATCH',
        path: '/api/actions/{actionId}',
        pathParams: ['actionId'],
      },
      requiredScopes: ['items:write'],
      responseFormat: 'raw',
    },
    {
      name: 'list_actions',
      description:
        td?.list_actions ??
        'List all site actions (forms) with submission counts and field definitions.',
      inputSchema: zodToJsonSchema(listActionsToolSchema, {
        target: 'openApi3',
      }) as Record<string, unknown>,
      annotations: { readOnlyHint: true, idempotentHint: true },
      endpoint: {
        method: 'GET',
        path: '/api/actions',
        queryParams: ['status'],
      },
      requiredScopes: ['items:read'],
      responseFormat: 'raw',
    },
    {
      name: 'list_submissions',
      description:
        td?.list_submissions ??
        'List form submissions with filtering by action and status.',
      inputSchema: zodToJsonSchema(listSubmissionsToolSchema, {
        target: 'openApi3',
      }) as Record<string, unknown>,
      annotations: { readOnlyHint: true, idempotentHint: true },
      endpoint: {
        method: 'GET',
        path: '/api/submissions',
        queryParams: ['actionId', 'status', 'limit', 'offset'],
      },
      requiredScopes: ['items:read'],
      responseFormat: 'raw',
    },
    {
      name: 'manage_submission',
      description:
        td?.manage_submission ??
        'Update the status of a form submission (mark as read, replied, archived, or spam).',
      inputSchema: zodToJsonSchema(manageSubmissionToolSchema, {
        target: 'openApi3',
      }) as Record<string, unknown>,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
      },
      endpoint: {
        method: 'PATCH',
        path: '/api/submissions/{submissionId}',
        pathParams: ['submissionId'],
        bodyParams: ['status'],
      },
      requiredScopes: ['items:write'],
      responseFormat: 'raw',
    },
    {
      name: 'delete_item',
      description:
        td?.delete_item ??
        'Permanently delete an item. This action cannot be undone — consider archiving instead if you may need the item later.',
      inputSchema: zodToJsonSchema(deleteItemToolSchema, {
        target: 'openApi3',
      }) as Record<string, unknown>,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
      },
      endpoint: {
        method: 'DELETE',
        path: '/api/items/{itemId}',
        pathParams: ['itemId'],
      },
      requiredScopes: ['items:write'],
      responseFormat: 'raw',
    },
    {
      name: 'archive_item',
      description:
        td?.archive_item ??
        'Archive an item to remove it from active views without deleting it. Archived items can be restored with unarchive_item.',
      inputSchema: zodToJsonSchema(archiveItemToolSchema, {
        target: 'openApi3',
      }) as Record<string, unknown>,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
      },
      endpoint: {
        method: 'POST',
        path: '/api/items/{itemId}/archive',
        pathParams: ['itemId'],
      },
      requiredScopes: ['items:write'],
      responseFormat: 'item',
    },
    {
      name: 'unarchive_item',
      description:
        td?.unarchive_item ??
        'Restore an archived item back to active status. Use list_items with isArchived=true to find archived items.',
      inputSchema: zodToJsonSchema(unarchiveItemToolSchema, {
        target: 'openApi3',
      }) as Record<string, unknown>,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
      },
      endpoint: {
        method: 'POST',
        path: '/api/items/{itemId}/unarchive',
        pathParams: ['itemId'],
      },
      requiredScopes: ['items:write'],
      responseFormat: 'item',
    },
    {
      name: 'update_type',
      description:
        td?.update_type ??
        'Update an item type\'s name, description, color, icon, or writing guidance. Call get_metadata first to see current type details.',
      inputSchema: zodToJsonSchema(updateTypeToolSchema, {
        target: 'openApi3',
      }) as Record<string, unknown>,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
      },
      endpoint: {
        method: 'PATCH',
        path: '/api/types/{typeId}',
        pathParams: ['typeId'],
      },
      requiredScopes: ['items:write'],
      responseFormat: 'raw',
    },
    {
      name: 'delete_type',
      description:
        td?.delete_type ??
        'Permanently delete an item type. Fails if any items still use this type — reassign or delete those items first.',
      inputSchema: zodToJsonSchema(deleteTypeToolSchema, {
        target: 'openApi3',
      }) as Record<string, unknown>,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
      },
      endpoint: {
        method: 'DELETE',
        path: '/api/types/{typeId}',
        pathParams: ['typeId'],
      },
      requiredScopes: ['items:write'],
      responseFormat: 'raw',
    },
    {
      name: 'add_type_action',
      description:
        td?.add_type_action ??
        'Add a validation action to an existing item type (e.g., "Reviewed", "Approved"). Call get_metadata first to see current type actions.',
      inputSchema: zodToJsonSchema(addTypeActionToolSchema, {
        target: 'openApi3',
      }) as Record<string, unknown>,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
      },
      endpoint: {
        method: 'POST',
        path: '/api/types/{typeId}/actions',
        pathParams: ['typeId'],
      },
      requiredScopes: ['items:write'],
      responseFormat: 'raw',
    },
    {
      name: 'remove_type_action',
      description:
        td?.remove_type_action ??
        'Remove a validation action from an item type. Items previously validated with this action will have their validation cleared.',
      inputSchema: zodToJsonSchema(removeTypeActionToolSchema, {
        target: 'openApi3',
      }) as Record<string, unknown>,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
      },
      endpoint: {
        method: 'DELETE',
        path: '/api/types/{typeId}/actions/{actionId}',
        pathParams: ['typeId', 'actionId'],
      },
      requiredScopes: ['items:write'],
      responseFormat: 'raw',
    },
    {
      name: 'update_workspace',
      description:
        td?.update_workspace ??
        'Update a workspace\'s name, description, or visibility. Call get_metadata first to see current workspace details.',
      inputSchema: zodToJsonSchema(updateWorkspaceToolSchema, {
        target: 'openApi3',
      }) as Record<string, unknown>,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
      },
      endpoint: {
        method: 'PATCH',
        path: '/api/workspaces/{workspaceId}',
        pathParams: ['workspaceId'],
      },
      requiredScopes: ['items:write'],
      responseFormat: 'raw',
    },
    {
      name: 'delete_workspace',
      description:
        td?.delete_workspace ??
        'Permanently delete a workspace. Items in this workspace will have their workspace cleared (not deleted).',
      inputSchema: zodToJsonSchema(deleteWorkspaceToolSchema, {
        target: 'openApi3',
      }) as Record<string, unknown>,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
      },
      endpoint: {
        method: 'DELETE',
        path: '/api/workspaces/{workspaceId}',
        pathParams: ['workspaceId'],
      },
      requiredScopes: ['items:write'],
      responseFormat: 'raw',
    },
    {
      name: 'update_settings',
      description:
        td?.update_settings ??
        'Update one or more site settings in a single batch. Call get_metadata with sections=settings to discover available setting keys and their current values.',
      inputSchema: zodToJsonSchema(updateSettingsToolSchema, {
        target: 'openApi3',
      }) as Record<string, unknown>,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
      },
      endpoint: {
        method: 'PATCH',
        path: '/api/settings',
      },
      requiredScopes: ['admin'],
      responseFormat: 'raw',
    },
    {
      name: 'delete_action',
      description:
        td?.delete_action ??
        'Permanently delete a site action (form) and all its submissions. This cannot be undone.',
      inputSchema: zodToJsonSchema(deleteActionToolSchema, {
        target: 'openApi3',
      }) as Record<string, unknown>,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
      },
      endpoint: {
        method: 'DELETE',
        path: '/api/actions/{actionId}',
        pathParams: ['actionId'],
      },
      requiredScopes: ['items:write'],
      responseFormat: 'raw',
    },
    {
      name: 'delete_submission',
      description:
        td?.delete_submission ??
        'Permanently delete a form submission. This cannot be undone.',
      inputSchema: zodToJsonSchema(deleteSubmissionToolSchema, {
        target: 'openApi3',
      }) as Record<string, unknown>,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
      },
      endpoint: {
        method: 'DELETE',
        path: '/api/submissions/{submissionId}',
        pathParams: ['submissionId'],
      },
      requiredScopes: ['items:write'],
      responseFormat: 'raw',
    },
    {
      name: 'get_submission_stats',
      description:
        td?.get_submission_stats ??
        'Get aggregate statistics for form submissions — total counts, status breakdown, and per-action summaries.',
      inputSchema: zodToJsonSchema(getSubmissionStatsToolSchema, {
        target: 'openApi3',
      }) as Record<string, unknown>,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
      },
      endpoint: {
        method: 'GET',
        path: '/api/submissions/stats',
      },
      requiredScopes: ['items:read'],
      responseFormat: 'raw',
    },
    {
      name: 'export_submissions',
      description:
        td?.export_submissions ??
        'Export all submissions for a specific action as JSON or CSV. Use to download form data for analysis or backup.',
      inputSchema: zodToJsonSchema(exportSubmissionsToolSchema, {
        target: 'openApi3',
      }) as Record<string, unknown>,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
      },
      endpoint: {
        method: 'GET',
        path: '/api/submissions/export/{actionId}',
        pathParams: ['actionId'],
        queryParams: ['format'],
      },
      requiredScopes: ['items:read'],
      responseFormat: 'raw',
    },
  ];
}
