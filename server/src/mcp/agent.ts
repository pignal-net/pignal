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
  deleteItem,
  archiveItem,
  unarchiveItem,
  updateTypeOp,
  deleteTypeOp,
  addTypeActionOp,
  removeTypeActionOp,
  updateWorkspaceOp,
  deleteWorkspaceOp,
  updateSettingsOp,
  createActionOp,
  updateActionOp,
  listActionsOp,
  listSubmissionsOp,
  manageSubmissionOp,
  deleteActionOp,
  deleteSubmissionOp,
  getSubmissionStatsOp,
  exportSubmissionsOp,
  saveItemToolSchema,
  listItemsToolSchema,
  searchItemsToolSchema,
  validateItemToolSchema,
  updateItemToolSchema,
  createWorkspaceToolSchema,
  createTypeToolSchema,
  vouchItemToolSchema,
  batchVouchItemsToolSchema,
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
  createActionToolSchema,
  updateActionToolSchema,
  listActionsToolSchema,
  listSubmissionsToolSchema,
  manageSubmissionToolSchema,
  deleteActionToolSchema,
  deleteSubmissionToolSchema,
  getSubmissionStatsToolSchema,
  exportSubmissionsToolSchema,
  getMetadataToolSchema,
  getSettingsRegistryByGroup,
  type SaveItemToolInput,
  type ListItemsToolInput,
  type SearchItemsToolInput,
  type ValidateItemToolInput,
  type UpdateItemToolInput,
  type CreateWorkspaceToolInput,
  type CreateTypeToolInput,
  type VouchItemToolInput,
  type BatchVouchItemsToolInput,
  type DeleteItemToolInput,
  type ArchiveItemToolInput,
  type UnarchiveItemToolInput,
  type UpdateTypeToolInput,
  type DeleteTypeToolInput,
  type AddTypeActionToolInput,
  type RemoveTypeActionToolInput,
  type UpdateWorkspaceToolInput,
  type DeleteWorkspaceToolInput,
  type UpdateSettingsToolInput,
  type CreateActionToolInput,
  type UpdateActionToolInput,
  type ListActionsToolInput,
  type ListSubmissionsToolInput,
  type ManageSubmissionToolInput,
  type DeleteActionToolInput,
  type DeleteSubmissionToolInput,
  type ExportSubmissionsToolInput,
  type GetMetadataToolInput,
  type MetadataField,
} from '@pignal/core/mcp';
import { resolvedConfig } from '@pignal/templates/resolved';
import {
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
    const config = resolvedConfig;
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
    const config = resolvedConfig;
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
        inputSchema: getMetadataToolSchema.shape,
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async (input: GetMetadataToolInput) => {
        const metadata = await getMetadata(store);
        const settings = await store.getSettings();
        const siteLocale = settings.source_locale || 'en';

        // Add language context so AI produces content in the configured locale
        const LOCALE_NAMES: Record<string, string> = { en: 'English', vi: 'Vietnamese', zh: 'Chinese' };
        const langName = LOCALE_NAMES[siteLocale] || siteLocale;
        const langContext = siteLocale !== 'en'
          ? `\n\nIMPORTANT: This site's content language is ${langName} (${siteLocale}). All item titles, summaries, and content MUST be written in ${langName}.`
          : '';

        // No sections = full metadata (default behavior)
        if (!input.sections || input.sections.length === 0) {
          const text = buildMetadataText(metadata, config.vocabulary);
          return {
            content: [{ type: 'text' as const, text: text + langContext }],
          };
        }

        // Build combined response for requested sections
        const requested = new Set(input.sections);
        const parts: string[] = [];

        if (requested.has('settings')) {
          const registry = getSettingsRegistryByGroup();
          const lines: string[] = ['== SETTINGS ==', ''];
          for (const [group, defs] of Object.entries(registry)) {
            if (defs.length === 0) continue;
            lines.push(`--- ${group.toUpperCase()} ---`);
            for (const def of defs) {
              const currentVal = settings[def.key] ?? '(not set)';
              const opts = def.options ? ` [${def.options.join(', ')}]` : '';
              lines.push(`  ${def.key} (${def.valueType}${opts}): ${def.description}`);
              lines.push(`    Current: ${currentVal}`);
            }
            lines.push('');
          }
          parts.push(lines.join('\n'));
        }

        if (requested.has('types')) {
          const v = config.vocabulary;
          const typesText = metadata.types
            .map((t) => {
              const actions = t.actions.map((a) => `  - ${a.label} (${a.id})`).join('\n');
              const tLines = [`${t.icon ?? '•'} ${t.name} (${t.id}): ${t.description ?? ''}`];
              if (t.guidance) {
                if (t.guidance.whenToUse) tLines.push(`  When to use: ${t.guidance.whenToUse}`);
                if (t.guidance.pattern) tLines.push(`  keySummary pattern: "${t.guidance.pattern}"`);
                if (t.guidance.example) tLines.push(`  Example: "${t.guidance.example}"`);
                if (t.guidance.contentHints) tLines.push(`  Content tip: ${t.guidance.contentHints}`);
              }
              tLines.push(`  Validation actions:\n${actions}`);
              return tLines.join('\n');
            })
            .join('\n\n');
          parts.push(`== ${v.typePlural.toUpperCase()} ==\n${typesText}`);
        }

        if (requested.has('workspaces')) {
          const v = config.vocabulary;
          const wsText = metadata.workspaces
            .map((w) => `- ${w.name} (${w.id})${w.description ? `: ${w.description}` : ''}`)
            .join('\n');
          parts.push(`== ${v.workspacePlural.toUpperCase()} ==\n${wsText}`);
        }

        if (requested.has('guidelines')) {
          const text = buildMetadataText(metadata, config.vocabulary);
          const guidelinesEnd = text.indexOf('\n== ');
          parts.push(guidelinesEnd > 0 ? text.substring(0, guidelinesEnd) : text);
        }

        return {
          content: [{ type: 'text' as const, text: parts.join('\n\n') + langContext }],
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

    // Delete item tool
    server.registerTool(
      'delete_item',
      {
        description: td.delete_item ?? 'Permanently delete an item by ID.',
        inputSchema: deleteItemToolSchema.shape,
        annotations: {
          readOnlyHint: false,
          destructiveHint: true,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async (input: DeleteItemToolInput) => {
        const rl_deleted = (config.mcp?.responseLabels as Record<string, string>)?.deleted ?? 'Item deleted.';
        const deleted = await deleteItem(store, input);
        return {
          content: [{ type: 'text' as const, text: deleted ? rl_deleted : rl.notFound }],
        };
      }
    );

    // Archive item tool
    server.registerTool(
      'archive_item',
      {
        description: td.archive_item ?? 'Archive an item (soft-delete, recoverable via unarchive).',
        inputSchema: archiveItemToolSchema.shape,
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async (input: ArchiveItemToolInput) => {
        const result = await archiveItem(store, input);
        if (!result) {
          return { content: [{ type: 'text' as const, text: rl.notFound }] };
        }
        return {
          content: [{ type: 'text' as const, text: `Archived.\n\n${formatItem(result)}` }],
        };
      }
    );

    // Unarchive item tool
    server.registerTool(
      'unarchive_item',
      {
        description: td.unarchive_item ?? 'Restore an archived item to active status.',
        inputSchema: unarchiveItemToolSchema.shape,
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async (input: UnarchiveItemToolInput) => {
        const result = await unarchiveItem(store, input);
        if (!result) {
          return { content: [{ type: 'text' as const, text: rl.notFound }] };
        }
        return {
          content: [{ type: 'text' as const, text: `Unarchived.\n\n${formatItem(result)}` }],
        };
      }
    );

    // --- Type management tools ---

    // Update type tool
    server.registerTool(
      'update_type',
      {
        description: td.update_type ?? 'Update a type\'s name, description, color, icon, or guidance.',
        inputSchema: withDescriptions(updateTypeToolSchema.shape, sd, 'update_type'),
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async (input: UpdateTypeToolInput) => {
        const result = await updateTypeOp(store, input);
        if (!result) {
          return { content: [{ type: 'text' as const, text: 'Type not found.' }] };
        }
        return {
          content: [{ type: 'text' as const, text: `Type updated.\n\n${formatType(result)}` }],
        };
      }
    );

    // Delete type tool
    server.registerTool(
      'delete_type',
      {
        description: td.delete_type ?? 'Delete a type. Fails if items of this type exist.',
        inputSchema: deleteTypeToolSchema.shape,
        annotations: {
          readOnlyHint: false,
          destructiveHint: true,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async (input: DeleteTypeToolInput) => {
        try {
          const deleted = await deleteTypeOp(store, input);
          return {
            content: [{ type: 'text' as const, text: deleted ? 'Type deleted.' : 'Type not found.' }],
          };
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unknown error';
          return {
            content: [{ type: 'text' as const, text: `Cannot delete type: ${msg}` }],
          };
        }
      }
    );

    // Add type action tool
    server.registerTool(
      'add_type_action',
      {
        description: td.add_type_action ?? 'Add a validation action to a type (e.g., "Reviewed", "Approved").',
        inputSchema: addTypeActionToolSchema.shape,
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: false,
          openWorldHint: false,
        },
      },
      async (input: AddTypeActionToolInput) => {
        const result = await addTypeActionOp(store, input);
        return {
          content: [{ type: 'text' as const, text: `Validation action added: ${result.label}` }],
        };
      }
    );

    // Remove type action tool
    server.registerTool(
      'remove_type_action',
      {
        description: td.remove_type_action ?? 'Remove a validation action from a type.',
        inputSchema: removeTypeActionToolSchema.shape,
        annotations: {
          readOnlyHint: false,
          destructiveHint: true,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async (input: RemoveTypeActionToolInput) => {
        const removed = await removeTypeActionOp(store, input);
        return {
          content: [{ type: 'text' as const, text: removed ? 'Validation action removed.' : 'Action not found.' }],
        };
      }
    );

    // --- Workspace management tools ---

    // Update workspace tool
    server.registerTool(
      'update_workspace',
      {
        description: td.update_workspace ?? 'Update a workspace\'s name, description, or visibility.',
        inputSchema: withDescriptions(updateWorkspaceToolSchema.shape, sd, 'update_workspace'),
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async (input: UpdateWorkspaceToolInput) => {
        const result = await updateWorkspaceOp(store, input);
        if (!result) {
          return { content: [{ type: 'text' as const, text: 'Workspace not found.' }] };
        }
        return {
          content: [{ type: 'text' as const, text: `Workspace updated.\n\n${formatWorkspace(result)}` }],
        };
      }
    );

    // Delete workspace tool
    server.registerTool(
      'delete_workspace',
      {
        description: td.delete_workspace ?? 'Delete a workspace.',
        inputSchema: deleteWorkspaceToolSchema.shape,
        annotations: {
          readOnlyHint: false,
          destructiveHint: true,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async (input: DeleteWorkspaceToolInput) => {
        const deleted = await deleteWorkspaceOp(store, input);
        return {
          content: [{ type: 'text' as const, text: deleted ? 'Workspace deleted.' : 'Workspace not found.' }],
        };
      }
    );

    // --- Settings tool ---

    // Update settings tool
    server.registerTool(
      'update_settings',
      {
        description: td.update_settings ?? 'Update one or more site settings. Call get_metadata with sections=settings to discover available keys and current values.',
        inputSchema: updateSettingsToolSchema.shape,
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async (input: UpdateSettingsToolInput) => {
        const { updated, errors } = await updateSettingsOp(store, input);
        const lines: string[] = [];
        if (updated.length) {
          lines.push(`Updated: ${updated.join(', ')}`);
        }
        for (const e of errors) {
          lines.push(`Error for "${e.key}": ${e.error}`);
        }
        return {
          content: [{ type: 'text' as const, text: lines.join('\n') || 'No changes.' }],
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

    // Delete action tool
    server.registerTool(
      'delete_action',
      {
        description: td.delete_action ?? 'Permanently delete a site action (form) and all its submissions.',
        inputSchema: deleteActionToolSchema.shape,
        annotations: {
          readOnlyHint: false,
          destructiveHint: true,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async (input: DeleteActionToolInput) => {
        const deleted = await deleteActionOp(actionStore, input);
        return {
          content: [{ type: 'text' as const, text: deleted ? 'Action deleted.' : 'Action not found.' }],
        };
      }
    );

    // Delete submission tool
    server.registerTool(
      'delete_submission',
      {
        description: td.delete_submission ?? 'Permanently delete a form submission.',
        inputSchema: deleteSubmissionToolSchema.shape,
        annotations: {
          readOnlyHint: false,
          destructiveHint: true,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async (input: DeleteSubmissionToolInput) => {
        const deleted = await deleteSubmissionOp(actionStore, input);
        return {
          content: [{ type: 'text' as const, text: deleted ? 'Submission deleted.' : 'Submission not found.' }],
        };
      }
    );

    // Get submission stats tool
    server.registerTool(
      'get_submission_stats',
      {
        description: td.get_submission_stats ?? 'Get aggregated submission statistics across all forms.',
        inputSchema: getSubmissionStatsToolSchema.shape,
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async () => {
        const stats = await getSubmissionStatsOp(actionStore);
        const lines: string[] = [
          `Total actions: ${stats.totalActions}`,
          `Total submissions: ${stats.totalSubmissions}`,
        ];
        if (Object.keys(stats.byAction).length) {
          lines.push('', 'By action:');
          for (const [name, count] of Object.entries(stats.byAction)) {
            lines.push(`  ${name}: ${count}`);
          }
        }
        if (Object.keys(stats.byStatus).length) {
          lines.push('', 'By status:');
          for (const [status, count] of Object.entries(stats.byStatus)) {
            lines.push(`  ${status}: ${count}`);
          }
        }
        return {
          content: [{ type: 'text' as const, text: lines.join('\n') }],
        };
      }
    );

    // Export submissions tool
    server.registerTool(
      'export_submissions',
      {
        description: td.export_submissions ?? 'Export all submissions for a form as JSON or CSV.',
        inputSchema: exportSubmissionsToolSchema.shape,
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async (input: ExportSubmissionsToolInput) => {
        const data = await exportSubmissionsOp(actionStore, input);
        return {
          content: [{ type: 'text' as const, text: data }],
        };
      }
    );
  }
}
