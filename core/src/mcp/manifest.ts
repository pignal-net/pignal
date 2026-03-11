import { zodToJsonSchema } from 'zod-to-json-schema';

import {
  saveSignalToolSchema,
  listSignalsToolSchema,
  searchSignalsToolSchema,
  validateSignalToolSchema,
  updateSignalToolSchema,
  createWorkspaceToolSchema,
  createTypeToolSchema,
  vouchSignalToolSchema,
  batchVouchSignalsToolSchema,
} from '../validation/schemas';
import type { ToolDefinition } from '../federation/types';

export function getDefaultToolManifest(): ToolDefinition[] {
  return [
    {
      name: 'save_signal',
      description:
        'Save a structured signal from this conversation for long-term retention. ALWAYS call get_metadata first — it provides required IDs, current limits, and quality guidelines for writing effective signals.',
      inputSchema: zodToJsonSchema(saveSignalToolSchema, {
        target: 'openApi3',
      }) as Record<string, unknown>,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
      },
      endpoint: { method: 'POST', path: '/api/signals' },
      requiredScopes: ['signals:write'],
      responseFormat: 'signal',
    },
    {
      name: 'list_signals',
      description:
        "Browse the user's signals with optional filters. Use to review existing signals or check for duplicates before saving.",
      inputSchema: zodToJsonSchema(listSignalsToolSchema, {
        target: 'openApi3',
      }) as Record<string, unknown>,
      annotations: { readOnlyHint: true, idempotentHint: true },
      endpoint: {
        method: 'GET',
        path: '/api/signals',
        queryParams: [
          'typeId',
          'workspaceId',
          'isArchived',
          'limit',
          'offset',
        ],
      },
      requiredScopes: ['signals:read'],
      responseFormat: 'signal_list',
    },
    {
      name: 'search_signals',
      description:
        'Search signals by keyword across summaries and content. Use to find related knowledge before saving or to locate signals for validation.',
      inputSchema: zodToJsonSchema(searchSignalsToolSchema, {
        target: 'openApi3',
      }) as Record<string, unknown>,
      annotations: { readOnlyHint: true, idempotentHint: true },
      endpoint: {
        method: 'GET',
        path: '/api/signals',
        queryParams: ['q', 'typeId', 'workspaceId', 'limit'],
      },
      requiredScopes: ['signals:read'],
      responseFormat: 'signal_list',
    },
    {
      name: 'get_metadata',
      description:
        'Get signal types, workspaces, and quality guidelines. ALWAYS call this first before save_signal or validate_signal.',
      annotations: { readOnlyHint: true, idempotentHint: true },
      endpoint: { method: 'GET', path: '/api/metadata' },
      requiredScopes: ['profile:read'],
      responseFormat: 'metadata',
    },
    {
      name: 'validate_signal',
      description:
        'Apply a validation action to a signal. Call get_metadata first for valid action IDs.',
      inputSchema: zodToJsonSchema(validateSignalToolSchema, {
        target: 'openApi3',
      }) as Record<string, unknown>,
      annotations: { readOnlyHint: false, idempotentHint: true },
      endpoint: {
        method: 'POST',
        path: '/api/signals/{signalId}/validate',
        pathParams: ['signalId'],
        bodyParams: ['actionId'],
      },
      requiredScopes: ['signals:write'],
      responseFormat: 'signal',
    },
    {
      name: 'update_signal',
      description:
        'Update an existing signal. Use to correct, expand, or reclassify a previously saved signal.',
      inputSchema: zodToJsonSchema(updateSignalToolSchema, {
        target: 'openApi3',
      }) as Record<string, unknown>,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
      },
      endpoint: {
        method: 'PATCH',
        path: '/api/signals/{signalId}',
        pathParams: ['signalId'],
      },
      requiredScopes: ['signals:write'],
      responseFormat: 'signal',
    },
    {
      name: 'create_workspace',
      description:
        'Create a new workspace for organizing signals by project or context. Call get_metadata first to see existing workspaces.',
      inputSchema: zodToJsonSchema(createWorkspaceToolSchema, {
        target: 'openApi3',
      }) as Record<string, unknown>,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
      },
      endpoint: { method: 'POST', path: '/api/workspaces' },
      requiredScopes: ['signals:write'],
      responseFormat: 'raw',
    },
    {
      name: 'create_type',
      description:
        'Create a new signal type with validation actions. Call get_metadata first to see existing types and avoid duplicates.',
      inputSchema: zodToJsonSchema(createTypeToolSchema, {
        target: 'openApi3',
      }) as Record<string, unknown>,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
      },
      endpoint: { method: 'POST', path: '/api/types' },
      requiredScopes: ['signals:write'],
      responseFormat: 'raw',
    },
    {
      name: 'vouch_signal',
      description:
        'Change a signal\'s visibility: "vouched" makes it public with a URL slug, "unlisted" creates a share link, "private" hides it. Use to publish signals to the source page.',
      inputSchema: zodToJsonSchema(vouchSignalToolSchema, {
        target: 'openApi3',
      }) as Record<string, unknown>,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
      },
      endpoint: {
        method: 'POST',
        path: '/api/signals/{signalId}/vouch',
        pathParams: ['signalId'],
        bodyParams: ['visibility', 'slug'],
      },
      requiredScopes: ['signals:write'],
      responseFormat: 'signal',
    },
    {
      name: 'batch_vouch_signals',
      description:
        'Change visibility for multiple signals at once (max 50). Each signal can have its own visibility and optional slug. Use to publish a batch of signals to the source page.',
      inputSchema: zodToJsonSchema(batchVouchSignalsToolSchema, {
        target: 'openApi3',
      }) as Record<string, unknown>,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
      },
      endpoint: {
        method: 'POST',
        path: '/api/signals/batch-vouch',
      },
      requiredScopes: ['signals:write'],
      responseFormat: 'raw',
    },
  ];
}
