import { McpAgent } from 'agents/mcp';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { drizzle } from 'drizzle-orm/d1';
import type { ZodTypeAny } from 'zod';

import { ItemStore } from '@pignal/core/store';
import { ActionStore } from '@pignal/core/store/action-store';
import {
  formatItem,
  formatWorkspace,
  formatType,
  toIncludeSet,
  buildMetadataText,
  saveItem,
  listItems,
  searchItems,
  validateItem,
  getMetadata,
  updateItem,
  createWorkspace,
  createType,
  vouchItem,
  batchVouchItems,
  createActionOp,
  updateActionOp,
  listActionsOp,
  listSubmissionsOp,
  manageSubmissionOp,
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
  type SaveItemToolInput,
  type ListItemsToolInput,
  type SearchItemsToolInput,
  type ValidateItemToolInput,
  type UpdateItemToolInput,
  type CreateWorkspaceToolInput,
  type CreateTypeToolInput,
  type VouchItemToolInput,
  type BatchVouchItemsToolInput,
  type CreateActionToolInput,
  type UpdateActionToolInput,
  type ListActionsToolInput,
  type ListSubmissionsToolInput,
  type ManageSubmissionToolInput,
  type MetadataField,
} from '@pignal/core/mcp';
import {
  getTemplateConfig,
  formatResponseLabel,
  DEFAULT_TEMPLATE_CONFIG,
} from '@pignal/templates';

import type { Env } from '../types';

/**
 * Clone a Zod schema shape and override field descriptions with template-specific text.
 * Keys in overrides are formatted as "toolName.fieldName" (e.g. "save_item.keySummary").
 */
function withDescriptions<T extends Record<string, ZodTypeAny>>(
  shape: T,
  overrides: Record<string, string>,
  toolName: string
): T {
  const result = { ...shape };
  for (const [key, desc] of Object.entries(overrides)) {
    const [tool, fieldName] = key.split('.');
    if (tool === toolName && fieldName && fieldName in result) {
      (result as Record<string, ZodTypeAny>)[fieldName] = result[fieldName].describe(desc);
    }
  }
  return result;
}

/**
 * Self-hosted MCP agent. Single-user, no OAuth — uses D1 directly.
 *
 * Template-driven: instructions, tool descriptions, response labels,
 * and schema field descriptions are resolved from the active template
 * config (blog, shop, etc.).
 *
 * Scope enforcement is handled at the middleware level (in index.ts)
 * BEFORE requests reach this agent. The middleware parses JSON-RPC
 * messages and blocks tool calls that exceed the token's scopes.
 */
export class SelfHostedMcpAgent extends McpAgent<Env, unknown, Record<string, unknown>> {
  server = this.createServer();

  private async createServer(): Promise<McpServer> {
    const config = getTemplateConfig(this.env.TEMPLATE || 'blog');
    return new McpServer(
      { name: 'pignal', version: '1.0.0' },
      { instructions: config.mcp.instructions }
    );
  }

  private getStore() {
    const db = drizzle(this.env.DB);
    return new ItemStore(db);
  }

  private getActionStore() {
    const db = drizzle(this.env.DB);
    return new ActionStore(db);
  }

  async init() {
    const store = this.getStore();
    const config = getTemplateConfig(this.env.TEMPLATE || 'blog');
    const td = config.mcp.toolDescriptions;
    const rl = config.mcp.responseLabels;
    const sd = config.mcp.schemaDescriptions;
    const server = await this.server;

    // Save item tool
    server.registerTool(
      'save_item',
      {
        description: td.save_item ?? DEFAULT_TEMPLATE_CONFIG.mcp.toolDescriptions.save_item,
        inputSchema: withDescriptions(saveItemToolSchema.shape, sd, 'save_item'),
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: false,
          openWorldHint: false,
        },
      },
      async (input: SaveItemToolInput) => {
        const result = await saveItem(store, input, 'mcp-self-hosted');
        return {
          content: [
            {
              type: 'text' as const,
              text: `${rl.saved}\n\n${formatItem(result)}`,
            },
          ],
        };
      }
    );

    // List items tool
    server.registerTool(
      'list_items',
      {
        description: td.list_items ?? DEFAULT_TEMPLATE_CONFIG.mcp.toolDescriptions.list_items,
        inputSchema: listItemsToolSchema.shape,
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async (input: ListItemsToolInput) => {
        const result = await listItems(store, input);
        const include = toIncludeSet(input.include_metadata as MetadataField[] | undefined);
        const list = result.items
          .map((s, i) => `${i + 1}. ${formatItem(s, include)}`)
          .join('\n\n');

        const foundText = formatResponseLabel(rl.found, {
          total: result.total,
          count: result.items.length,
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: `${foundText}:\n\n${list || `${rl.notFound}`}`,
            },
          ],
        };
      }
    );

    // Search items tool
    server.registerTool(
      'search_items',
      {
        description: td.search_items ?? DEFAULT_TEMPLATE_CONFIG.mcp.toolDescriptions.search_items,
        inputSchema: searchItemsToolSchema.shape,
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async (input: SearchItemsToolInput) => {
        const result = await searchItems(store, input);
        const include = toIncludeSet(input.include_metadata as MetadataField[] | undefined);
        const list = result.items
          .map((s, i) => `${i + 1}. ${formatItem(s, include)}`)
          .join('\n\n');

        return {
          content: [
            {
              type: 'text' as const,
              text: `Search results for "${input.query}" (${result.total} matches):\n\n${list || `${rl.notFound}`}`,
            },
          ],
        };
      }
    );

    // Get metadata tool (types + workspaces + settings — all from DB)
    server.registerTool(
      'get_metadata',
      {
        description: td.get_metadata ?? DEFAULT_TEMPLATE_CONFIG.mcp.toolDescriptions.get_metadata,
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async () => {
        const metadata = await getMetadata(store);
        const text = buildMetadataText(metadata, config.vocabulary);

        return {
          content: [
            {
              type: 'text' as const,
              text,
            },
          ],
        };
      }
    );

    // Validate item tool
    server.registerTool(
      'validate_item',
      {
        description: td.validate_item ?? DEFAULT_TEMPLATE_CONFIG.mcp.toolDescriptions.validate_item,
        inputSchema: validateItemToolSchema.shape,
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async (input: ValidateItemToolInput) => {
        const result = await validateItem(store, input);
        if (!result) {
          return {
            content: [
              {
                type: 'text' as const,
                text: rl.notFound,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text' as const,
              text: `${rl.validated}\n\n${formatItem(result)}`,
            },
          ],
        };
      }
    );

    // Update item tool
    server.registerTool(
      'update_item',
      {
        description: td.update_item ?? DEFAULT_TEMPLATE_CONFIG.mcp.toolDescriptions.update_item,
        inputSchema: withDescriptions(updateItemToolSchema.shape, sd, 'update_item'),
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async (input: UpdateItemToolInput) => {
        const result = await updateItem(store, input);
        if (!result) {
          return {
            content: [
              {
                type: 'text' as const,
                text: rl.notFound,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text' as const,
              text: `${rl.updated}\n\n${formatItem(result)}`,
            },
          ],
        };
      }
    );

    // Create workspace tool
    server.registerTool(
      'create_workspace',
      {
        description: td.create_workspace ?? DEFAULT_TEMPLATE_CONFIG.mcp.toolDescriptions.create_workspace,
        inputSchema: withDescriptions(createWorkspaceToolSchema.shape, sd, 'create_workspace'),
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: false,
          openWorldHint: false,
        },
      },
      async (input: CreateWorkspaceToolInput) => {
        const result = await createWorkspace(store, input);
        return {
          content: [
            {
              type: 'text' as const,
              text: `${rl.workspaceCreated}\n\n${formatWorkspace(result)}`,
            },
          ],
        };
      }
    );

    // Create type tool
    server.registerTool(
      'create_type',
      {
        description: td.create_type ?? DEFAULT_TEMPLATE_CONFIG.mcp.toolDescriptions.create_type,
        inputSchema: withDescriptions(createTypeToolSchema.shape, sd, 'create_type'),
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: false,
          openWorldHint: false,
        },
      },
      async (input: CreateTypeToolInput) => {
        const result = await createType(store, input);
        return {
          content: [
            {
              type: 'text' as const,
              text: `${rl.typeCreated}\n\n${formatType(result)}`,
            },
          ],
        };
      }
    );

    // Vouch item tool (change visibility)
    server.registerTool(
      'vouch_item',
      {
        description: td.vouch_item ?? DEFAULT_TEMPLATE_CONFIG.mcp.toolDescriptions.vouch_item,
        inputSchema: vouchItemToolSchema.shape,
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async (input: VouchItemToolInput) => {
        const result = await vouchItem(store, input);
        if (!result) {
          return {
            content: [
              {
                type: 'text' as const,
                text: rl.notFound,
              },
            ],
          };
        }

        const visibilityInfo =
          result.visibility === 'vouched'
            ? `Visibility: vouched | Slug: ${result.slug}`
            : result.visibility === 'unlisted'
              ? `Visibility: unlisted | Share token: ${result.shareToken}`
              : 'Visibility: private';

        return {
          content: [
            {
              type: 'text' as const,
              text: `${rl.visibilityUpdated}\n\n${visibilityInfo}\n\n${formatItem(result)}`,
            },
          ],
        };
      }
    );

    // Batch vouch items tool
    server.registerTool(
      'batch_vouch_items',
      {
        description: td.batch_vouch_items ?? DEFAULT_TEMPLATE_CONFIG.mcp.toolDescriptions.batch_vouch_items,
        inputSchema: batchVouchItemsToolSchema.shape,
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async (input: BatchVouchItemsToolInput) => {
        const result = await batchVouchItems(store, input);

        const lines: string[] = [];
        lines.push(`${rl.batchComplete} ${result.succeeded.length} succeeded, ${result.failed.length} failed.`);

        if (result.succeeded.length) {
          lines.push('', 'Succeeded:');
          for (const s of result.succeeded) {
            const slug = s.slug ? ` → /item/${s.slug}` : '';
            lines.push(`- ${s.id} (${s.visibility}${slug})`);
          }
        }

        if (result.failed.length) {
          lines.push('', 'Failed:');
          for (const f of result.failed) {
            lines.push(`- ${f.id}: ${f.error}`);
          }
        }

        return {
          content: [
            {
              type: 'text' as const,
              text: lines.join('\n'),
            },
          ],
        };
      }
    );

    // --- Site Actions tools ---

    const actionStore = this.getActionStore();

    // Create action tool
    server.registerTool(
      'create_action',
      {
        description: td.create_action ?? 'Create a site action (form) for lead capture, contact, newsletter signup, etc. Returns the slug for embedding in content via {{action:slug}}.',
        inputSchema: createActionToolSchema.shape,
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: false,
          openWorldHint: false,
        },
      },
      async (input: CreateActionToolInput) => {
        const text = await createActionOp(actionStore, input);
        return {
          content: [{ type: 'text' as const, text }],
        };
      }
    );

    // Update action tool
    server.registerTool(
      'update_action',
      {
        description: td.update_action ?? 'Update a site action — modify fields, settings, status, or slug.',
        inputSchema: updateActionToolSchema.shape,
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async (input: UpdateActionToolInput) => {
        const text = await updateActionOp(actionStore, input);
        return {
          content: [{ type: 'text' as const, text }],
        };
      }
    );

    // List actions tool
    server.registerTool(
      'list_actions',
      {
        description: td.list_actions ?? 'List all site actions (forms) with submission counts and field definitions.',
        inputSchema: listActionsToolSchema.shape,
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async (input: ListActionsToolInput) => {
        const text = await listActionsOp(actionStore, input);
        return {
          content: [{ type: 'text' as const, text }],
        };
      }
    );

    // List submissions tool
    server.registerTool(
      'list_submissions',
      {
        description: td.list_submissions ?? 'List form submissions with filtering by action and status.',
        inputSchema: listSubmissionsToolSchema.shape,
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async (input: ListSubmissionsToolInput) => {
        const text = await listSubmissionsOp(actionStore, input);
        return {
          content: [{ type: 'text' as const, text }],
        };
      }
    );

    // Manage submission tool
    server.registerTool(
      'manage_submission',
      {
        description: td.manage_submission ?? 'Update the status of a form submission (mark as read, replied, archived, or spam).',
        inputSchema: manageSubmissionToolSchema.shape,
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async (input: ManageSubmissionToolInput) => {
        const text = await manageSubmissionOp(actionStore, input);
        return {
          content: [{ type: 'text' as const, text }],
        };
      }
    );
  }
}
