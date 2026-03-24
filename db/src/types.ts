import type {
  ItemSelect,
  ItemTypeSelect,
  TypeActionSelect,
  WorkspaceSelect,
  SettingSelect,
  ApiKeySelect,
  SiteActionSelect,
  SubmissionSelect,
  PageViewSelect,
} from './schema';

export type {
  ItemSelect,
  ItemTypeSelect,
  TypeActionSelect,
  WorkspaceSelect,
  SettingSelect,
  ApiKeySelect,
  SiteActionSelect,
  SubmissionSelect,
  PageViewSelect,
};

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

// --- Site Actions types ---

/** Supported form field types. Extensible via FieldTypeRegistry. */
export type SiteActionFieldType = 'text' | 'email' | 'textarea' | 'select' | 'url' | 'tel' | 'number' | 'checkbox';

/** A single field definition within a site action form. */
export interface SiteActionField {
  name: string;
  type: SiteActionFieldType;
  label: string;
  required?: boolean;
  placeholder?: string;
  maxLength?: number;
  options?: { value: string; label: string }[];
}

/** Per-action settings stored as JSON in the settings column. */
export interface SiteActionSettings {
  success_message?: string;
  redirect_url?: string;
  require_honeypot?: boolean;
  webhook_url?: string;
  rate_limit_per_hour?: number;
}

export type SiteActionStatus = 'active' | 'paused' | 'archived';
export type SubmissionStatus = 'new' | 'read' | 'replied' | 'archived' | 'spam';

export interface CreateActionParams {
  id: string;
  name: string;
  slug: string;
  description?: string;
  fields: SiteActionField[];
  settings?: SiteActionSettings;
}

export interface UpdateActionParams {
  name?: string;
  slug?: string;
  description?: string | null;
  fields?: SiteActionField[];
  settings?: SiteActionSettings;
  status?: SiteActionStatus;
}

export interface ListSubmissionsParams {
  actionId?: string;
  status?: SubmissionStatus;
  limit?: number;
  offset?: number;
}

export interface SubmissionMeta {
  ipHash?: string;
  referrer?: string;
}

export interface SubmissionWithAction {
  id: string;
  actionId: string;
  actionName: string;
  actionSlug: string;
  data: Record<string, string>;
  status: string;
  ipHash: string | null;
  referrer: string | null;
  createdAt: string;
}

export interface ActionStats {
  totalActions: number;
  totalSubmissions: number;
  byAction: Record<string, number>;
  byStatus: Record<string, number>;
}

/** Interface for site action + submission operations. Implemented by ActionStore. */
export interface ActionStoreRpc {
  // Site Actions CRUD
  listActions(params?: { status?: SiteActionStatus }): Promise<SiteActionSelect[]>;
  getAction(id: string): Promise<SiteActionSelect | null>;
  getActionBySlug(slug: string): Promise<SiteActionSelect | null>;
  createAction(params: CreateActionParams): Promise<SiteActionSelect>;
  updateAction(id: string, params: UpdateActionParams): Promise<SiteActionSelect | null>;
  deleteAction(id: string): Promise<boolean>;

  // Submissions
  submitForm(actionSlug: string, data: Record<string, string>, meta: SubmissionMeta): Promise<SubmissionSelect>;
  listSubmissions(params: ListSubmissionsParams): Promise<{ submissions: SubmissionWithAction[]; total: number }>;
  getSubmission(id: string): Promise<SubmissionWithAction | null>;
  updateSubmissionStatus(id: string, status: SubmissionStatus): Promise<boolean>;
  deleteSubmission(id: string): Promise<boolean>;
  exportSubmissions(actionId: string, format: 'json' | 'csv'): Promise<string>;
  submissionStats(): Promise<ActionStats>;
}
