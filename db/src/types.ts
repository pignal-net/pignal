import type {
  ItemSelect,
  ItemTypeSelect,
  TypeActionSelect,
  WorkspaceSelect,
  SettingSelect,
  ApiKeySelect,
} from './schema';

export type { ItemSelect, ItemTypeSelect, TypeActionSelect, WorkspaceSelect, SettingSelect, ApiKeySelect };

export interface ApiKeyInfo {
  id: string;
  name: string;
  scopes: string;
  workspaceIds: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
}

export interface ItemWithMeta {
  id: string;
  keySummary: string;
  content: string;
  typeId: string;
  typeName: string;
  workspaceId: string | null;
  workspaceName: string | null;
  sourceAi: string;
  validationActionId: string | null;
  validationActionLabel: string | null;
  tags: string[] | null;
  pinnedAt: string | null;
  isArchived: number | null;
  visibility: string | null;
  slug: string | null;
  shareToken: string | null;
  vouchedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TypeGuidance {
  pattern?: string;
  example?: string;
  whenToUse?: string;
  contentHints?: string;
}

export interface TypeActionDef {
  label: string;
  sortOrder?: number;
}

export interface ItemTypeWithActions {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  guidance: TypeGuidance | null;
  isSystem: boolean;
  sortOrder: number;
  actions: TypeActionSelect[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTypeParams {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  guidance?: TypeGuidance;
  actions: TypeActionDef[];
}

export interface UpdateTypeParams {
  name?: string;
  description?: string;
  color?: string | null;
  icon?: string | null;
  guidance?: TypeGuidance | null;
}

export interface CreateWorkspaceParams {
  id: string;
  name: string;
  description?: string;
  visibility?: 'public' | 'private';
}

export interface UpdateWorkspaceParams {
  name?: string;
  description?: string;
  visibility?: 'public' | 'private';
}

export interface ListParams {
  typeId?: string;
  workspaceId?: string;
  isArchived?: boolean;
  visibility?: 'private' | 'unlisted' | 'vouched';
  limit?: number;
  offset?: number;
  q?: string;
  tag?: string; // Filter by tag (exact match within JSON array)
  updatedAfter?: string; // ISO 8601, exclusive lower bound on updatedAt
  sort?: 'newest' | 'oldest';
}

export interface VouchParams {
  visibility: 'private' | 'unlisted' | 'vouched';
  slug?: string;
}

export interface CreateParams {
  id: string;
  keySummary: string;
  content: string;
  typeId: string;
  workspaceId?: string;
  sourceAi: string;
  tags?: string[];
}

export interface UpdateParams {
  keySummary?: string;
  content?: string;
  typeId?: string;
  workspaceId?: string | null;
  tags?: string[] | null;
}

export interface ValidationStats {
  validated: number;
  unvalidated: number;
  byAction: Record<string, number>;
}

export interface StatsResult {
  total: number;
  archivedCount: number;
  byType: Record<string, number>;
  byWorkspace: Record<string, number>;
  validationStats: ValidationStats;
}

export type SettingsMap = Record<string, string>;

export interface MetadataResult {
  types: ItemTypeWithActions[];
  workspaces: WorkspaceSelect[];
  settings: SettingsMap;
}

export interface ItemStoreRpc {
  list(params?: ListParams): Promise<{ items: ItemWithMeta[]; total: number }>;
  get(id: string): Promise<ItemWithMeta | null>;
  create(params: CreateParams): Promise<ItemWithMeta>;
  update(id: string, params: UpdateParams): Promise<ItemWithMeta | null>;
  delete(id: string): Promise<boolean>;
  validate(id: string, actionId: string | null): Promise<ItemWithMeta | null>;
  archive(id: string): Promise<ItemWithMeta | null>;
  unarchive(id: string): Promise<ItemWithMeta | null>;
  stats(): Promise<StatsResult>;

  listTypes(): Promise<ItemTypeWithActions[]>;
  getType(id: string): Promise<ItemTypeWithActions | null>;
  createType(params: CreateTypeParams): Promise<ItemTypeWithActions>;
  updateType(id: string, params: UpdateTypeParams): Promise<ItemTypeWithActions | null>;
  deleteType(id: string): Promise<boolean>;
  addTypeAction(typeId: string, action: TypeActionDef): Promise<TypeActionSelect>;
  removeTypeAction(actionId: string): Promise<boolean>;

  listWorkspaces(): Promise<WorkspaceSelect[]>;
  getWorkspace(id: string): Promise<WorkspaceSelect | null>;
  createWorkspace(params: CreateWorkspaceParams): Promise<WorkspaceSelect>;
  updateWorkspace(id: string, params: UpdateWorkspaceParams): Promise<WorkspaceSelect | null>;
  deleteWorkspace(id: string): Promise<boolean>;

  getSettings(): Promise<SettingsMap>;
  getSetting(key: string): Promise<string | null>;
  updateSetting(key: string, value: string): Promise<void>;

  getMetadata(): Promise<MetadataResult>;

  pin(id: string): Promise<ItemWithMeta | null>;
  unpin(id: string): Promise<ItemWithMeta | null>;

  vouch(id: string, params: VouchParams): Promise<ItemWithMeta | null>;
  getByShareToken(token: string): Promise<ItemWithMeta | null>;
  getBySlug(slug: string): Promise<ItemWithMeta | null>;
  listPublic(params?: ListParams): Promise<{ items: ItemWithMeta[]; total: number }>;
  listPublicCounts(params?: { tag?: string; q?: string }): Promise<{ total: number; byType: Record<string, number>; byWorkspace: Record<string, number>; byWorkspaceType: Record<string, Record<string, number>> }>;
  listCounts(params?: { tag?: string; q?: string; isArchived?: boolean }): Promise<{ total: number; byType: Record<string, number>; byWorkspace: Record<string, number>; byWorkspaceType: Record<string, Record<string, number>> }>;
}
