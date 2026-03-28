import type {
  ItemWithMeta,
  ItemStoreRpc,
  MetadataResult,
  ItemTypeWithActions,
  WorkspaceSelect,
  ActionStoreRpc,
  SiteActionSelect,
  SubmissionWithAction,
  TypeActionSelect,
  ActionStats,
} from '@pignal/db';

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
  getMetadataToolSchema,
  batchUpdateSettingsSchema,
  ALLOWED_SETTINGS_KEYS,
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
  type CreateActionToolInput,
  type UpdateActionToolInput,
  type ListActionsToolInput,
  type ListSubmissionsToolInput,
  type ManageSubmissionToolInput,
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
  type DeleteActionToolInput,
  type DeleteSubmissionToolInput,
  type ExportSubmissionsToolInput,
  type GetMetadataToolInput,
} from '../validation/schemas';

// --- Metadata fields for formatting ---

export const METADATA_FIELDS = [
  'type_id',
  'workspace_id',
  'validation_action_id',
  'source_ai',
  'created_at',
  'updated_at',
] as const;

export type MetadataField = (typeof METADATA_FIELDS)[number];

// --- Formatting utilities ---

export function formatItem(s: ItemWithMeta, include?: Set<MetadataField>): string {
  const meta = [s.typeName, s.workspaceName ?? 'No workspace'];
  if (s.validationActionLabel) meta.push(s.validationActionLabel);
  if (s.isArchived === 1) meta.push('Archived');

  if (s.tags?.length) meta.push(`Tags: ${s.tags.join(', ')}`);

  const lines = [`ID: ${s.id}`, `**${s.keySummary}**`, meta.join(' | ')];

  if (include) {
    const extra: string[] = [];
    if (include.has('type_id')) extra.push(`Type ID: ${s.typeId}`);
    if (include.has('workspace_id')) extra.push(`Workspace ID: ${s.workspaceId ?? 'None'}`);
    if (include.has('validation_action_id'))
      extra.push(`Validation Action ID: ${s.validationActionId ?? 'None'}`);
    if (include.has('source_ai')) extra.push(`Source AI: ${s.sourceAi}`);
    if (include.has('created_at')) extra.push(`Created: ${s.createdAt}`);
    if (include.has('updated_at')) extra.push(`Updated: ${s.updatedAt}`);
    if (extra.length) lines.push(extra.join(' | '));
  }

  lines.push('---', `Content:\n${s.content}`);

  return lines.join('\n');
}

export function toIncludeSet(fields?: MetadataField[]): Set<MetadataField> | undefined {
  return fields?.length ? new Set(fields) : undefined;
}

export function formatWorkspace(w: WorkspaceSelect): string {
  const lines = [`ID: ${w.id}`, `**${w.name}** (${w.visibility})`];
  if (w.description) lines.push(w.description);
  return lines.join('\n');
}

export function formatType(t: ItemTypeWithActions): string {
  const lines = [`ID: ${t.id}`, `**${t.icon ?? '•'} ${t.name}**`];
  if (t.description) lines.push(t.description);
  if (t.color) lines.push(`Color: ${t.color}`);
  if (t.guidance) {
    const g = t.guidance;
    if (g.whenToUse) lines.push(`When to use: ${g.whenToUse}`);
    if (g.pattern) lines.push(`Pattern: "${g.pattern}"`);
    if (g.example) lines.push(`Example: "${g.example}"`);
    if (g.contentHints) lines.push(`Content tip: ${g.contentHints}`);
  }
  if (t.actions.length) {
    lines.push(`Validation actions: ${t.actions.map((a) => a.label).join(', ')}`);
  }
  return lines.join('\n');
}

// --- Dynamic metadata text builder ---

interface QualityGuidelines {
  keySummary?: { tips?: string };
  content?: { tips?: string };
  formatting?: string[];
  avoid?: string[];
}

interface ValidationLimits {
  keySummary?: { min?: number; max?: number };
  content?: { min?: number; max?: number };
}

function parseJsonSetting<T>(value: string | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

/** Vocabulary for domain-specific terminology in metadata text. Structurally compatible with TemplateVocabulary from @pignal/templates. */
interface Vocabulary {
  item: string;
  itemPlural: string;
  type: string;
  typePlural: string;
  workspace: string;
  workspacePlural: string;
  vouch: string;
  vouched: string;
}

export function buildMetadataText(metadata: MetadataResult, vocabulary?: Vocabulary): string {
  const v = vocabulary ?? { item: 'item', itemPlural: 'items', type: 'type', typePlural: 'types', workspace: 'workspace', workspacePlural: 'workspaces', vouch: 'vouch', vouched: 'vouched' };
  const guidelines = parseJsonSetting<QualityGuidelines>(
    metadata.settings.quality_guidelines,
    {}
  );
  const limits = parseJsonSetting<ValidationLimits>(
    metadata.settings.validation_limits,
    {}
  );

  const qualityLines = ['== QUALITY GUIDELINES ==', ''];

  const ktMin = limits.keySummary?.min ?? 20;
  const ktMax = limits.keySummary?.max ?? 140;
  qualityLines.push(`keySummary (${ktMin}-${ktMax} chars):`);
  if (guidelines.keySummary?.tips) {
    qualityLines.push(`- ${guidelines.keySummary.tips}`);
  }
  qualityLines.push('');

  const cMax = limits.content?.max ?? 10000;
  qualityLines.push(`content (up to ${cMax.toLocaleString()} chars):`);
  if (guidelines.content?.tips) {
    qualityLines.push(`- ${guidelines.content.tips}`);
  }
  qualityLines.push('');

  if (guidelines.formatting?.length) {
    qualityLines.push('CONTENT FORMATTING — pick the right markdown for the data:');
    for (const fmt of guidelines.formatting) {
      qualityLines.push(`- ${fmt}`);
    }
    qualityLines.push('');
  }

  if (guidelines.avoid?.length) {
    qualityLines.push('AVOID:');
    for (const item of guidelines.avoid) {
      qualityLines.push(`- ${item}`);
    }
    qualityLines.push('');
  }

  qualityLines.push(
    'General:',
    `- Always choose the most specific ${v.type} that fits.`,
    `- Assign a ${v.workspace} if the ${v.item} clearly belongs to one context.`
  );

  const typesText = metadata.types
    .map((t) => {
      const actions = t.actions.map((a) => `  - ${a.label} (${a.id})`).join('\n');
      const lines = [`${t.icon ?? '•'} ${t.name} (${t.id}): ${t.description ?? ''}`];
      if (t.guidance) {
        if (t.guidance.whenToUse) lines.push(`  When to use: ${t.guidance.whenToUse}`);
        if (t.guidance.pattern) lines.push(`  keySummary pattern: "${t.guidance.pattern}"`);
        if (t.guidance.example) lines.push(`  Example: "${t.guidance.example}"`);
        if (t.guidance.contentHints) lines.push(`  Content tip: ${t.guidance.contentHints}`);
      }
      lines.push(`  Validation actions:\n${actions}`);
      return lines.join('\n');
    })
    .join('\n\n');

  const workspacesText = metadata.workspaces
    .map((w) => `- ${w.name} (${w.id})${w.description ? `: ${w.description}` : ''}`)
    .join('\n');

  return [
    qualityLines.join('\n'),
    '',
    `== ${v.typePlural.toUpperCase()} ==`,
    typesText,
    '',
    `== ${v.workspacePlural.toUpperCase()} ==`,
    workspacesText,
  ].join('\n');
}

// --- Tool operation functions ---

export async function saveItem(
  store: ItemStoreRpc,
  input: SaveItemToolInput,
  sourceAi: string
): Promise<ItemWithMeta> {
  return store.create({
    id: crypto.randomUUID(),
    keySummary: input.keySummary,
    content: input.content,
    typeId: input.typeId,
    workspaceId: input.workspaceId,
    sourceAi,
    tags: input.tags,
  });
}

export async function listItems(
  store: ItemStoreRpc,
  input: ListItemsToolInput
): Promise<{ items: ItemWithMeta[]; total: number }> {
  return store.list({
    typeId: input.typeId,
    workspaceId: input.workspaceId,
    isArchived: input.isArchived,
    limit: input.limit ?? 20,
    offset: input.offset ?? 0,
  });
}

export async function searchItems(
  store: ItemStoreRpc,
  input: SearchItemsToolInput
): Promise<{ items: ItemWithMeta[]; total: number }> {
  return store.list({
    q: input.query,
    typeId: input.typeId,
    workspaceId: input.workspaceId,
    limit: input.limit ?? 20,
  });
}

export async function validateItem(
  store: ItemStoreRpc,
  input: ValidateItemToolInput
): Promise<ItemWithMeta | null> {
  return store.validate(input.itemId, input.actionId);
}

export async function getMetadata(store: ItemStoreRpc): Promise<MetadataResult> {
  return store.getMetadata();
}

export async function updateItem(
  store: ItemStoreRpc,
  input: UpdateItemToolInput
): Promise<ItemWithMeta | null> {
  const { itemId, ...updateFields } = input;
  return store.update(itemId, updateFields);
}

export async function createWorkspace(
  store: ItemStoreRpc,
  input: CreateWorkspaceToolInput
): Promise<WorkspaceSelect> {
  return store.createWorkspace({
    id: crypto.randomUUID(),
    name: input.name,
    description: input.description,
    visibility: input.visibility,
  });
}

export async function createType(
  store: ItemStoreRpc,
  input: CreateTypeToolInput
): Promise<ItemTypeWithActions> {
  return store.createType({
    id: crypto.randomUUID(),
    name: input.name,
    description: input.description,
    color: input.color,
    icon: input.icon,
    guidance: input.guidance,
    actions: input.actions,
  });
}

export async function vouchItem(
  store: ItemStoreRpc,
  input: VouchItemToolInput
): Promise<ItemWithMeta | null> {
  return store.vouch(input.itemId, {
    visibility: input.visibility,
    slug: input.slug,
  });
}

export async function batchVouchItems(
  store: ItemStoreRpc,
  input: BatchVouchItemsToolInput
): Promise<{ succeeded: { id: string; slug: string | null; visibility: string }[]; failed: { id: string; error: string }[] }> {
  const succeeded: { id: string; slug: string | null; visibility: string }[] = [];
  const failed: { id: string; error: string }[] = [];

  for (const item of input.items) {
    try {
      const result = await store.vouch(item.itemId, {
        visibility: item.visibility,
        slug: item.slug,
      });
      if (result) {
        succeeded.push({
          id: result.id,
          slug: result.slug,
          visibility: result.visibility ?? item.visibility,
        });
      } else {
        failed.push({ id: item.itemId, error: 'Item not found' });
      }
    } catch (err) {
      failed.push({
        id: item.itemId,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  return { succeeded, failed };
}

// --- Site Actions formatting utilities ---

export function formatAction(a: SiteActionSelect): string {
  const fields = JSON.parse(a.fields) as { name: string; type: string; label: string; required?: boolean }[];
  const fieldList = fields.map(f => `  - ${f.label} (${f.type}${f.required ? ', required' : ''})`).join('\n');
  return [
    `ID: ${a.id}`,
    `**${a.name}** (/${a.slug})`,
    `Status: ${a.status} | Submissions: ${a.submissionCount}`,
    a.description ? `Description: ${a.description}` : null,
    `Fields:\n${fieldList}`,
    `Embed in content: {{action:${a.slug}}}`,
  ].filter(Boolean).join('\n');
}

export function formatSubmission(s: SubmissionWithAction): string {
  const dataEntries = Object.entries(s.data).map(([k, v]) => `  ${k}: ${v}`).join('\n');
  return [
    `ID: ${s.id}`,
    `Form: ${s.actionName} (${s.actionSlug})`,
    `Status: ${s.status} | Submitted: ${s.createdAt}`,
    `Data:\n${dataEntries}`,
  ].join('\n');
}

// --- Site Actions tool operation functions ---

export async function createActionOp(store: ActionStoreRpc, input: CreateActionToolInput): Promise<string> {
  const action = await store.createAction({
    id: crypto.randomUUID(),
    ...input,
  });
  return `Action created successfully.\n\n${formatAction(action)}\n\nEmbed in any item content with: {{action:${action.slug}}}`;
}

export async function updateActionOp(store: ActionStoreRpc, input: UpdateActionToolInput): Promise<string> {
  const { actionId, ...params } = input;
  const action = await store.updateAction(actionId, params);
  if (!action) return 'Action not found.';
  return `Action updated.\n\n${formatAction(action)}`;
}

export async function listActionsOp(store: ActionStoreRpc, input: ListActionsToolInput): Promise<string> {
  const actions = await store.listActions(input.status ? { status: input.status } : undefined);
  if (actions.length === 0) return 'No actions found.';
  return actions.map(formatAction).join('\n\n---\n\n');
}

export async function listSubmissionsOp(store: ActionStoreRpc, input: ListSubmissionsToolInput): Promise<string> {
  const { submissions, total } = await store.listSubmissions(input);
  if (submissions.length === 0) return 'No submissions found.';
  const header = `Showing ${submissions.length} of ${total} submissions`;
  return header + '\n\n' + submissions.map(formatSubmission).join('\n\n---\n\n');
}

export async function manageSubmissionOp(store: ActionStoreRpc, input: ManageSubmissionToolInput): Promise<string> {
  const success = await store.updateSubmissionStatus(input.submissionId, input.status);
  if (!success) return 'Submission not found.';
  return `Submission ${input.submissionId} marked as "${input.status}".`;
}

// --- Lifecycle tool operations ---

export async function deleteItem(store: ItemStoreRpc, input: DeleteItemToolInput): Promise<boolean> {
  return store.delete(input.itemId);
}

export async function archiveItem(store: ItemStoreRpc, input: ArchiveItemToolInput): Promise<ItemWithMeta | null> {
  return store.archive(input.itemId);
}

export async function unarchiveItem(store: ItemStoreRpc, input: UnarchiveItemToolInput): Promise<ItemWithMeta | null> {
  return store.unarchive(input.itemId);
}

export async function updateTypeOp(store: ItemStoreRpc, input: UpdateTypeToolInput): Promise<ItemTypeWithActions | null> {
  const { typeId, ...params } = input;
  return store.updateType(typeId, params);
}

export async function deleteTypeOp(store: ItemStoreRpc, input: DeleteTypeToolInput): Promise<boolean> {
  return store.deleteType(input.typeId);
}

export async function addTypeActionOp(store: ItemStoreRpc, input: AddTypeActionToolInput): Promise<TypeActionSelect> {
  return store.addTypeAction(input.typeId, { label: input.label, sortOrder: input.sortOrder });
}

export async function removeTypeActionOp(store: ItemStoreRpc, input: RemoveTypeActionToolInput): Promise<boolean> {
  return store.removeTypeAction(input.actionId);
}

export async function updateWorkspaceOp(store: ItemStoreRpc, input: UpdateWorkspaceToolInput): Promise<WorkspaceSelect | null> {
  const { workspaceId, ...params } = input;
  return store.updateWorkspace(workspaceId, params);
}

export async function deleteWorkspaceOp(store: ItemStoreRpc, input: DeleteWorkspaceToolInput): Promise<boolean> {
  return store.deleteWorkspace(input.workspaceId);
}

export async function updateSettingsOp(
  store: ItemStoreRpc,
  input: UpdateSettingsToolInput
): Promise<{ updated: string[]; errors: Array<{ key: string; error: string }> }> {
  const updated: string[] = [];
  const errors: Array<{ key: string; error: string }> = [];
  for (const { key, value } of input.settings) {
    if (!ALLOWED_SETTINGS_KEYS.has(key)) {
      errors.push({ key, error: `Unknown setting key: ${key}` });
      continue;
    }
    await store.updateSetting(key, value);
    updated.push(key);
  }
  return { updated, errors };
}

export async function deleteActionOp(store: ActionStoreRpc, input: DeleteActionToolInput): Promise<boolean> {
  return store.deleteAction(input.actionId);
}

export async function deleteSubmissionOp(store: ActionStoreRpc, input: DeleteSubmissionToolInput): Promise<boolean> {
  return store.deleteSubmission(input.submissionId);
}

export async function getSubmissionStatsOp(store: ActionStoreRpc): Promise<ActionStats> {
  return store.submissionStats();
}

export async function exportSubmissionsOp(store: ActionStoreRpc, input: ExportSubmissionsToolInput): Promise<string> {
  return store.exportSubmissions(input.actionId, input.format ?? 'json');
}

// --- Re-export schemas for tool registration ---

export {
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
  getMetadataToolSchema,
  batchUpdateSettingsSchema,
  ALLOWED_SETTINGS_KEYS,
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
  type CreateActionToolInput,
  type UpdateActionToolInput,
  type ListActionsToolInput,
  type ListSubmissionsToolInput,
  type ManageSubmissionToolInput,
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
  type DeleteActionToolInput,
  type DeleteSubmissionToolInput,
  type ExportSubmissionsToolInput,
  type GetMetadataToolInput,
};
