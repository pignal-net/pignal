import { McpAgent } from 'agents/mcp';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { drizzle } from 'drizzle-orm/d1';

import { SignalStore } from '@pignal/core/store';
import {
  formatSignal,
  formatWorkspace,
  formatType,
  toIncludeSet,
  buildMetadataText,
  saveSignal,
  listSignals,
  searchSignals,
  validateSignal,
  getMetadata,
  updateSignal,
  createWorkspace,
  createType,
  vouchSignal,
  batchVouchSignals,
  saveSignalToolSchema,
  listSignalsToolSchema,
  searchSignalsToolSchema,
  validateSignalToolSchema,
  updateSignalToolSchema,
  createWorkspaceToolSchema,
  createTypeToolSchema,
  vouchSignalToolSchema,
  batchVouchSignalsToolSchema,
  type SaveSignalToolInput,
  type ListSignalsToolInput,
  type SearchSignalsToolInput,
  type ValidateSignalToolInput,
  type UpdateSignalToolInput,
  type CreateWorkspaceToolInput,
  type CreateTypeToolInput,
  type VouchSignalToolInput,
  type BatchVouchSignalsToolInput,
  type MetadataField,
} from '@pignal/core/mcp';

import type { Env } from '../types';

/**
 * Self-hosted MCP agent. Single-user, no OAuth — uses D1 directly.
 *
 * Scope enforcement is handled at the middleware level (in index.ts)
 * BEFORE requests reach this agent. The middleware parses JSON-RPC
 * messages and blocks tool calls that exceed the token's scopes.
 */
export class SelfHostedMcpAgent extends McpAgent<Env, unknown, Record<string, unknown>> {
  server = new McpServer(
    { name: 'pignal', version: '1.0.0' },
    {
      instructions:
        'Pignal is your personal signal store for capturing and organizing knowledge from AI conversations. ' +
        'Signals are structured notes with a type (insight, solution, pattern, etc.), key summary, content, and optional tags.\n\n' +
        'Available tools:\n' +
        '- save_signal: Capture a new signal from this conversation\n' +
        '- list_signals / search_signals: Browse and search your existing signals\n' +
        '- update_signal: Edit an existing signal\n' +
        '- validate_signal: Apply a validation action (vouch, archive, etc.)\n' +
        '- vouch_signal: Change signal visibility (private/unlisted/vouched)\n' +
        '- batch_vouch_signals: Change visibility for multiple signals at once\n' +
        '- get_metadata: Get available types, workspaces, and quality guidelines\n' +
        '- create_workspace / create_type: Organize your signals\n\n' +
        'Always call get_metadata first to learn the available signal types and quality guidelines before saving.',
    }
  );

  private getStore() {
    const db = drizzle(this.env.DB);
    return new SignalStore(db);
  }

  async init() {
    const store = this.getStore();

    // Save signal tool
    this.server.registerTool(
      'save_signal',
      {
        description:
          'Save a structured signal from this conversation for long-term retention. ALWAYS call get_metadata first — it provides required IDs, current limits, and quality guidelines for writing effective signals.',
        inputSchema: saveSignalToolSchema.shape,
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: false,
          openWorldHint: false,
        },
      },
      async (input: SaveSignalToolInput) => {
        const result = await saveSignal(store, input, 'mcp-self-hosted');
        return {
          content: [
            {
              type: 'text' as const,
              text: `Signal saved!\n\n${formatSignal(result)}`,
            },
          ],
        };
      }
    );

    // List signals tool
    this.server.registerTool(
      'list_signals',
      {
        description:
          "Browse the user's signals with optional filters. Use to review existing signals or check for duplicates before saving.",
        inputSchema: listSignalsToolSchema.shape,
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async (input: ListSignalsToolInput) => {
        const result = await listSignals(store, input);
        const include = toIncludeSet(input.include_metadata as MetadataField[] | undefined);
        const list = result.items
          .map((s, i) => `${i + 1}. ${formatSignal(s, include)}`)
          .join('\n\n');

        return {
          content: [
            {
              type: 'text' as const,
              text: `Found ${result.total} signals (showing ${result.items.length}):\n\n${list || 'No signals found.'}`,
            },
          ],
        };
      }
    );

    // Search signals tool
    this.server.registerTool(
      'search_signals',
      {
        description:
          'Search signals by keyword across summaries and content. Use to find related knowledge before saving or to locate signals for validation.',
        inputSchema: searchSignalsToolSchema.shape,
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async (input: SearchSignalsToolInput) => {
        const result = await searchSignals(store, input);
        const include = toIncludeSet(input.include_metadata as MetadataField[] | undefined);
        const list = result.items
          .map((s, i) => `${i + 1}. ${formatSignal(s, include)}`)
          .join('\n\n');

        return {
          content: [
            {
              type: 'text' as const,
              text: `Search results for "${input.query}" (${result.total} matches):\n\n${list || 'No matching signals found.'}`,
            },
          ],
        };
      }
    );

    // Get metadata tool (types + workspaces + settings — all from DB)
    this.server.registerTool(
      'get_metadata',
      {
        description:
          'Get signal types, workspaces, and quality guidelines. ALWAYS call this first before save_signal or validate_signal — the response contains required IDs, configurable limits, and detailed instructions for writing high-quality signals.',
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async () => {
        const metadata = await getMetadata(store);
        const text = buildMetadataText(metadata);

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

    // Validate signal tool
    this.server.registerTool(
      'validate_signal',
      {
        description:
          'Apply a validation action to a signal (e.g., Confirmed, Worked, Good call). Validation strengthens retention by forcing accuracy evaluation. Call get_metadata first for valid action IDs.',
        inputSchema: validateSignalToolSchema.shape,
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async (input: ValidateSignalToolInput) => {
        const result = await validateSignal(store, input);
        if (!result) {
          return {
            content: [
              {
                type: 'text' as const,
                text: 'Signal not found.',
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text' as const,
              text: `Signal validated!\n\n${formatSignal(result)}`,
            },
          ],
        };
      }
    );

    // Update signal tool
    this.server.registerTool(
      'update_signal',
      {
        description:
          'Update an existing signal. Use to correct, expand, or reclassify a previously saved signal.',
        inputSchema: updateSignalToolSchema.shape,
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async (input: UpdateSignalToolInput) => {
        const result = await updateSignal(store, input);
        if (!result) {
          return {
            content: [
              {
                type: 'text' as const,
                text: 'Signal not found.',
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text' as const,
              text: `Signal updated!\n\n${formatSignal(result)}`,
            },
          ],
        };
      }
    );

    // Create workspace tool
    this.server.registerTool(
      'create_workspace',
      {
        description:
          'Create a new workspace for organizing signals by project or context. Call get_metadata first to see existing workspaces.',
        inputSchema: createWorkspaceToolSchema.shape,
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
              text: `Workspace created!\n\n${formatWorkspace(result)}`,
            },
          ],
        };
      }
    );

    // Create type tool
    this.server.registerTool(
      'create_type',
      {
        description:
          'Create a new signal type with validation actions. Call get_metadata first to see existing types and avoid duplicates.',
        inputSchema: createTypeToolSchema.shape,
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
              text: `Type created!\n\n${formatType(result)}`,
            },
          ],
        };
      }
    );

    // Vouch signal tool (change visibility)
    this.server.registerTool(
      'vouch_signal',
      {
        description:
          'Change a signal\'s visibility: "vouched" makes it public with a URL slug, "unlisted" creates a share link, "private" hides it. Use to publish signals to the source page.',
        inputSchema: vouchSignalToolSchema.shape,
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async (input: VouchSignalToolInput) => {
        const result = await vouchSignal(store, input);
        if (!result) {
          return {
            content: [
              {
                type: 'text' as const,
                text: 'Signal not found.',
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
              text: `Signal visibility updated!\n\n${visibilityInfo}\n\n${formatSignal(result)}`,
            },
          ],
        };
      }
    );

    // Batch vouch signals tool
    this.server.registerTool(
      'batch_vouch_signals',
      {
        description:
          'Change visibility for multiple signals at once (max 50). Each signal can have its own visibility and optional slug. Use to publish a batch of signals to the source page.',
        inputSchema: batchVouchSignalsToolSchema.shape,
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async (input: BatchVouchSignalsToolInput) => {
        const result = await batchVouchSignals(store, input);

        const lines: string[] = [];
        lines.push(`Batch vouch complete: ${result.succeeded.length} succeeded, ${result.failed.length} failed.`);

        if (result.succeeded.length) {
          lines.push('', 'Succeeded:');
          for (const s of result.succeeded) {
            const slug = s.slug ? ` → /signal/${s.slug}` : '';
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
  }
}
