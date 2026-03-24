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
      annotations: { readOnlyHint: true, idempotentHint: true },
      endpoint: { method: 'GET', path: '/api/metadata' },
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
        path: '/api/actions/submissions',
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
        path: '/api/actions/submissions/{submissionId}',
        pathParams: ['submissionId'],
        bodyParams: ['status'],
      },
      requiredScopes: ['items:write'],
      responseFormat: 'raw',
    },
  ];
}
