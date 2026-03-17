import type {
  SignalSelect,
  SignalTypeSelect,
  TypeActionSelect,
  WorkspaceSelect,
  SettingSelect,
  ApiKeySelect,
} from './schema';

export type { SignalSelect, SignalTypeSelect, TypeActionSelect, WorkspaceSelect, SettingSelect, ApiKeySelect };

export interface ApiKeyInfo {
  id: string;
  name: string;
  scopes: string;
  workspaceIds: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
}

export interface SignalWithMeta {
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

export interface SignalTypeWithActions {
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
  types: SignalTypeWithActions[];
  workspaces: WorkspaceSelect[];
  settings: SettingsMap;
}

export interface SignalStoreRpc {
  list(params?: ListParams): Promise<{ items: SignalWithMeta[]; total: number }>;
  get(id: string): Promise<SignalWithMeta | null>;
  create(params: CreateParams): Promise<SignalWithMeta>;
  update(id: string, params: UpdateParams): Promise<SignalWithMeta | null>;
  delete(id: string): Promise<boolean>;
  validate(id: string, actionId: string | null): Promise<SignalWithMeta | null>;
  archive(id: string): Promise<SignalWithMeta | null>;
  unarchive(id: string): Promise<SignalWithMeta | null>;
  stats(): Promise<StatsResult>;

  listTypes(): Promise<SignalTypeWithActions[]>;
  getType(id: string): Promise<SignalTypeWithActions | null>;
  createType(params: CreateTypeParams): Promise<SignalTypeWithActions>;
  updateType(id: string, params: UpdateTypeParams): Promise<SignalTypeWithActions | null>;
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

  pin(id: string): Promise<SignalWithMeta | null>;
  unpin(id: string): Promise<SignalWithMeta | null>;

  vouch(id: string, params: VouchParams): Promise<SignalWithMeta | null>;
  getByShareToken(token: string): Promise<SignalWithMeta | null>;
  getBySlug(slug: string): Promise<SignalWithMeta | null>;
  listPublic(params?: ListParams): Promise<{ items: SignalWithMeta[]; total: number }>;
  listPublicCounts(params?: { tag?: string; q?: string }): Promise<{ total: number; byType: Record<string, number>; byWorkspace: Record<string, number> }>;
  listCounts(params?: { tag?: string; q?: string; isArchived?: boolean }): Promise<{ total: number; byType: Record<string, number>; byWorkspace: Record<string, number> }>;
}
