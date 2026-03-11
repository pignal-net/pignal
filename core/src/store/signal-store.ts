import { and, asc, count, desc, eq, gt, inArray, isNotNull, isNull, like, or, sql } from 'drizzle-orm';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';

import {
  signals,
  signalTypes,
  typeActions,
  workspaces,
  settings,
  type SignalInsert,
  type SignalTypeSelect,
  type TypeActionSelect,
  type WorkspaceSelect,
} from '@pignal/db/schema';

import type {
  ListParams,
  CreateParams,
  UpdateParams,
  VouchParams,
  StatsResult,
  ValidationStats,
  SignalStoreRpc,
  SignalWithMeta,
  SignalTypeWithActions,
  CreateTypeParams,
  UpdateTypeParams,
  TypeActionDef,
  TypeGuidance,
  SettingsMap,
  MetadataResult,
  CreateWorkspaceParams,
  UpdateWorkspaceParams,
} from '@pignal/db';

/**
 * Pure business logic for signal storage.
 * Accepts any Drizzle SQLite database instance (DO SQLite or D1).
 * Zero Cloudflare-specific code — can run in any environment with a compatible DB.
 */
export class SignalStore implements SignalStoreRpc {
  private settingsCache: { value: SettingsMap; expiresAt: number } | null = null;
  private static readonly SETTINGS_TTL_MS = 60_000; // 1 minute

  // Both DO SQLite ('sync') and D1 ('async') extend BaseSQLiteDatabase.
  // All queries use await, which works with both modes at runtime.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private db: BaseSQLiteDatabase<any, any>) {}

  // --- Signal methods ---

  private readonly signalWithMetaSelect = {
    id: signals.id,
    keySummary: signals.keySummary,
    content: signals.content,
    typeId: signals.typeId,
    typeName: signalTypes.name,
    workspaceId: signals.workspaceId,
    workspaceName: workspaces.name,
    sourceAi: signals.sourceAi,
    validationActionId: signals.validationActionId,
    validationActionLabel: typeActions.label,
    tags: signals.tags,
    isArchived: signals.isArchived,
    visibility: signals.visibility,
    slug: signals.slug,
    shareToken: signals.shareToken,
    vouchedAt: signals.vouchedAt,
    createdAt: signals.createdAt,
    updatedAt: signals.updatedAt,
  };

  /** Parse tags JSON string into string array. */
  private parseTags(raw: string | null): string[] | null {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  /** Normalize tags: lowercase, dedupe, sort. */
  private normalizeTags(tags: string[] | undefined | null): string[] | null {
    if (!tags || tags.length === 0) return null;
    const normalized = [...new Set(tags.map((t) => t.toLowerCase().trim()).filter(Boolean))];
    normalized.sort();
    return normalized.length > 0 ? normalized : null;
  }

  /** Convert raw DB row to SignalWithMeta with parsed tags. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private withParsedTags(row: any): SignalWithMeta {
    return { ...row, tags: this.parseTags(row.tags) };
  }

  private async getWithMeta(id: string): Promise<SignalWithMeta | null> {
    const result = await this.db
      .select(this.signalWithMetaSelect)
      .from(signals)
      .innerJoin(signalTypes, eq(signals.typeId, signalTypes.id))
      .leftJoin(workspaces, eq(signals.workspaceId, workspaces.id))
      .leftJoin(typeActions, eq(signals.validationActionId, typeActions.id))
      .where(eq(signals.id, id))
      .limit(1);

    return result[0] ? this.withParsedTags(result[0]) : null;
  }

  async list(params: ListParams = {}): Promise<{ items: SignalWithMeta[]; total: number }> {
    const { typeId, workspaceId, isArchived = false, visibility, limit = 50, offset = 0, q, tag } = params;

    const conditions = [eq(signals.isArchived, isArchived ? 1 : 0)];

    if (typeId) {
      conditions.push(eq(signals.typeId, typeId));
    }
    if (workspaceId) {
      conditions.push(eq(signals.workspaceId, workspaceId));
    }
    if (visibility) {
      conditions.push(eq(signals.visibility, visibility));
    }
    if (q) {
      const escaped = q.replace(/[%_]/g, '\\$&');
      conditions.push(
        or(
          like(signals.keySummary, `%${escaped}%`),
          like(signals.content, `%${escaped}%`)
        )!
      );
    }
    if (tag) {
      // Match tag within JSON array: '["tag1","tag2"]' contains '"tagname"'
      const escaped = tag.toLowerCase().replace(/[%_"]/g, '\\$&');
      conditions.push(like(signals.tags, `%"${escaped}"%`));
    }

    const whereClause = and(...conditions);

    const [items, totalResult] = await Promise.all([
      this.db
        .select(this.signalWithMetaSelect)
        .from(signals)
        .innerJoin(signalTypes, eq(signals.typeId, signalTypes.id))
        .leftJoin(workspaces, eq(signals.workspaceId, workspaces.id))
        .leftJoin(typeActions, eq(signals.validationActionId, typeActions.id))
        .where(whereClause)
        .orderBy(desc(signals.createdAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ count: count() }).from(signals).where(whereClause),
    ]);

    return { items: items.map((r) => this.withParsedTags(r)), total: totalResult[0]?.count ?? 0 };
  }

  async get(id: string): Promise<SignalWithMeta | null> {
    return this.getWithMeta(id);
  }

  private async getValidationLimits(): Promise<Record<string, { min?: number; max?: number }>> {
    const raw = await this.getSetting('validation_limits');
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  private enforceSoftLimits(
    limits: Record<string, { min?: number; max?: number }>,
    fields: Record<string, string | undefined>
  ) {
    for (const [field, value] of Object.entries(fields)) {
      if (value === undefined) continue;
      const limit = limits[field];
      if (!limit) continue;
      if (limit.min !== undefined && value.length < limit.min) {
        throw new Error(`${field} must be at least ${limit.min} characters (current: ${value.length})`);
      }
      if (limit.max !== undefined && value.length > limit.max) {
        throw new Error(`${field} must be at most ${limit.max} characters (current: ${value.length})`);
      }
    }
  }

  async create(params: CreateParams): Promise<SignalWithMeta> {
    const limits = await this.getValidationLimits();
    this.enforceSoftLimits(limits, {
      keySummary: params.keySummary,
      content: params.content,
      sourceAi: params.sourceAi,
    });

    const now = new Date().toISOString();

    const normalizedTags = this.normalizeTags(params.tags);

    const data: SignalInsert = {
      id: params.id,
      keySummary: params.keySummary,
      content: params.content,
      typeId: params.typeId,
      workspaceId: params.workspaceId ?? null,
      sourceAi: params.sourceAi,
      tags: normalizedTags ? JSON.stringify(normalizedTags) : null,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.insert(signals).values(data);

    const created = await this.getWithMeta(params.id);
    if (!created) {
      throw new Error('Failed to create signal');
    }
    return created;
  }

  async update(id: string, params: UpdateParams): Promise<SignalWithMeta | null> {
    const existing = await this.db
      .select({ id: signals.id })
      .from(signals)
      .where(eq(signals.id, id))
      .limit(1);
    if (!existing[0]) return null;

    const limits = await this.getValidationLimits();
    this.enforceSoftLimits(limits, {
      keySummary: params.keySummary,
      content: params.content,
    });

    const updates: Partial<SignalInsert> = {
      updatedAt: new Date().toISOString(),
    };

    if (params.keySummary !== undefined) {
      updates.keySummary = params.keySummary;
    }
    if (params.content !== undefined) {
      updates.content = params.content;
    }
    if (params.typeId !== undefined) {
      updates.typeId = params.typeId;
    }
    if (params.workspaceId !== undefined) {
      updates.workspaceId = params.workspaceId;
    }
    if (params.tags !== undefined) {
      const normalizedTags = params.tags ? this.normalizeTags(params.tags) : null;
      (updates as Record<string, unknown>).tags = normalizedTags ? JSON.stringify(normalizedTags) : null;
    }

    await this.db.update(signals).set(updates).where(eq(signals.id, id));

    return this.getWithMeta(id);
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.db
      .select({ id: signals.id })
      .from(signals)
      .where(eq(signals.id, id))
      .limit(1);
    if (!existing[0]) return false;

    await this.db.delete(signals).where(eq(signals.id, id));
    return true;
  }

  async validate(id: string, actionId: string | null): Promise<SignalWithMeta | null> {
    const existing = await this.db
      .select({ id: signals.id, typeId: signals.typeId })
      .from(signals)
      .where(eq(signals.id, id))
      .limit(1);
    if (!existing[0]) return null;

    if (actionId !== null) {
      const action = await this.db
        .select()
        .from(typeActions)
        .where(eq(typeActions.id, actionId))
        .limit(1);

      if (!action[0]) {
        throw new Error('Action not found');
      }
      if (action[0].typeId !== existing[0].typeId) {
        throw new Error('Action does not belong to this signal type');
      }
    }

    await this.db
      .update(signals)
      .set({
        validationActionId: actionId,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(signals.id, id));

    return this.getWithMeta(id);
  }

  async archive(id: string): Promise<SignalWithMeta | null> {
    const existing = await this.db
      .select({ id: signals.id })
      .from(signals)
      .where(eq(signals.id, id))
      .limit(1);
    if (!existing[0]) return null;

    await this.db
      .update(signals)
      .set({ isArchived: 1, updatedAt: new Date().toISOString() })
      .where(eq(signals.id, id));

    return this.getWithMeta(id);
  }

  async unarchive(id: string): Promise<SignalWithMeta | null> {
    const existing = await this.db
      .select({ id: signals.id })
      .from(signals)
      .where(eq(signals.id, id))
      .limit(1);
    if (!existing[0]) return null;

    await this.db
      .update(signals)
      .set({ isArchived: 0, updatedAt: new Date().toISOString() })
      .where(eq(signals.id, id));

    return this.getWithMeta(id);
  }

  async stats(): Promise<StatsResult> {
    const notArchivedCondition = eq(signals.isArchived, 0);
    const archivedCondition = eq(signals.isArchived, 1);

    // Run all stats queries in parallel
    const [
      totalResult,
      archivedResult,
      byTypeResult,
      byWorkspaceResult,
      validatedResult,
      unvalidatedResult,
      byActionResult,
    ] = await Promise.all([
      this.db.select({ count: count() }).from(signals).where(notArchivedCondition),
      this.db.select({ count: count() }).from(signals).where(archivedCondition),
      this.db
        .select({ name: signalTypes.name, count: count() })
        .from(signals)
        .innerJoin(signalTypes, eq(signals.typeId, signalTypes.id))
        .where(notArchivedCondition)
        .groupBy(signalTypes.name),
      this.db
        .select({ name: workspaces.name, count: count() })
        .from(signals)
        .innerJoin(workspaces, eq(signals.workspaceId, workspaces.id))
        .where(and(notArchivedCondition, isNotNull(signals.workspaceId)))
        .groupBy(workspaces.name),
      this.db
        .select({ count: count() })
        .from(signals)
        .where(and(notArchivedCondition, isNotNull(signals.validationActionId))),
      this.db
        .select({ count: count() })
        .from(signals)
        .where(and(notArchivedCondition, sql`${signals.validationActionId} IS NULL`)),
      this.db
        .select({ label: typeActions.label, count: count() })
        .from(signals)
        .innerJoin(typeActions, eq(signals.validationActionId, typeActions.id))
        .where(and(notArchivedCondition, isNotNull(signals.validationActionId)))
        .groupBy(typeActions.label),
    ]);

    const byType: Record<string, number> = {};
    for (const row of byTypeResult) {
      byType[row.name] = row.count;
    }

    const byWorkspace: Record<string, number> = {};
    for (const row of byWorkspaceResult) {
      byWorkspace[row.name] = row.count;
    }

    const byAction: Record<string, number> = {};
    for (const row of byActionResult) {
      byAction[row.label] = row.count;
    }

    const validationStats: ValidationStats = {
      validated: validatedResult[0]?.count ?? 0,
      unvalidated: unvalidatedResult[0]?.count ?? 0,
      byAction,
    };

    return {
      total: totalResult[0]?.count ?? 0,
      archivedCount: archivedResult[0]?.count ?? 0,
      byType,
      byWorkspace,
      validationStats,
    };
  }

  // --- Visibility / Vouch methods ---

  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 200);
  }

  private async dedupeSlug(base: string, excludeId?: string): Promise<string> {
    let slug = base;
    let suffix = 2;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const existing = await this.db
        .select({ id: signals.id })
        .from(signals)
        .where(eq(signals.slug, slug))
        .limit(1);
      if (!existing[0] || existing[0].id === excludeId) break;
      slug = `${base}-${suffix}`;
      suffix++;
    }
    return slug;
  }

  async vouch(id: string, params: VouchParams): Promise<SignalWithMeta | null> {
    const existing = await this.db
      .select({ id: signals.id, vouchedAt: signals.vouchedAt })
      .from(signals)
      .where(eq(signals.id, id))
      .limit(1);
    if (!existing[0]) return null;

    const now = new Date().toISOString();
    const updates: Partial<SignalInsert> = {
      visibility: params.visibility,
      updatedAt: now,
    };

    if (params.visibility === 'vouched') {
      const baseSlug = params.slug || this.generateSlug(
        (await this.db.select({ keySummary: signals.keySummary }).from(signals).where(eq(signals.id, id)).limit(1))[0]?.keySummary ?? id
      );
      updates.slug = await this.dedupeSlug(baseSlug, id);
      updates.shareToken = null;
      if (!existing[0].vouchedAt) {
        updates.vouchedAt = now;
      }
    } else if (params.visibility === 'unlisted') {
      updates.slug = null;
      updates.shareToken = crypto.randomUUID();
      if (!existing[0].vouchedAt) {
        updates.vouchedAt = now;
      }
    } else {
      updates.slug = null;
      updates.shareToken = null;
      updates.vouchedAt = null;
    }

    await this.db.update(signals).set(updates).where(eq(signals.id, id));
    return this.getWithMeta(id);
  }

  async getByShareToken(token: string): Promise<SignalWithMeta | null> {
    const result = await this.db
      .select(this.signalWithMetaSelect)
      .from(signals)
      .innerJoin(signalTypes, eq(signals.typeId, signalTypes.id))
      .leftJoin(workspaces, eq(signals.workspaceId, workspaces.id))
      .leftJoin(typeActions, eq(signals.validationActionId, typeActions.id))
      .where(and(
        eq(signals.shareToken, token),
        eq(signals.visibility, 'unlisted'),
        // Workspace visibility overrides: exclude signals in private workspaces
        or(isNull(signals.workspaceId), eq(workspaces.visibility, 'public'))
      ))
      .limit(1);
    return result[0] ? this.withParsedTags(result[0]) : null;
  }

  async getBySlug(slug: string): Promise<SignalWithMeta | null> {
    const result = await this.db
      .select(this.signalWithMetaSelect)
      .from(signals)
      .innerJoin(signalTypes, eq(signals.typeId, signalTypes.id))
      .leftJoin(workspaces, eq(signals.workspaceId, workspaces.id))
      .leftJoin(typeActions, eq(signals.validationActionId, typeActions.id))
      .where(and(
        eq(signals.slug, slug),
        eq(signals.visibility, 'vouched'),
        // Workspace visibility overrides: exclude signals in private workspaces
        or(isNull(signals.workspaceId), eq(workspaces.visibility, 'public'))
      ))
      .limit(1);
    return result[0] ? this.withParsedTags(result[0]) : null;
  }

  async listPublic(params: ListParams = {}): Promise<{ items: SignalWithMeta[]; total: number }> {
    const { typeId, workspaceId, limit = 50, offset = 0, q, tag, updatedAfter, sort } = params;

    // Subquery: IDs of public workspaces. Used in both items and count queries.
    const publicWsIds = this.db.select({ id: workspaces.id }).from(workspaces).where(eq(workspaces.visibility, 'public'));

    const conditions = [
      eq(signals.visibility, 'vouched'),
      eq(signals.isArchived, 0),
      // Workspace visibility overrides signal visibility: exclude signals in private workspaces
      or(isNull(signals.workspaceId), inArray(signals.workspaceId, publicWsIds))!,
    ];

    if (typeId) {
      conditions.push(eq(signals.typeId, typeId));
    }
    if (workspaceId) {
      // Only allow filtering by public workspaces
      conditions.push(eq(signals.workspaceId, workspaceId));
    }
    if (tag) {
      const escaped = tag.toLowerCase().replace(/[%_"]/g, '\\$&');
      conditions.push(like(signals.tags, `%"${escaped}"%`));
    }
    if (q) {
      const escaped = q.replace(/[%_]/g, '\\$&');
      conditions.push(
        or(
          like(signals.keySummary, `%${escaped}%`),
          like(signals.content, `%${escaped}%`)
        )!
      );
    }
    if (updatedAfter) {
      conditions.push(gt(signals.updatedAt, updatedAfter));
    }

    const whereClause = and(...conditions);

    // When syncing incrementally, order oldest-first so consumer processes in order
    const orderClause = updatedAfter
      ? asc(signals.updatedAt)
      : sort === 'oldest'
        ? asc(signals.vouchedAt)
        : desc(signals.vouchedAt);

    const [items, totalResult] = await Promise.all([
      this.db
        .select(this.signalWithMetaSelect)
        .from(signals)
        .innerJoin(signalTypes, eq(signals.typeId, signalTypes.id))
        .leftJoin(workspaces, eq(signals.workspaceId, workspaces.id))
        .leftJoin(typeActions, eq(signals.validationActionId, typeActions.id))
        .where(whereClause)
        .orderBy(orderClause)
        .limit(limit)
        .offset(offset),
      this.db.select({ count: count() }).from(signals).where(whereClause),
    ]);

    return { items: items.map((r) => this.withParsedTags(r)), total: totalResult[0]?.count ?? 0 };
  }

  // --- Type methods ---

  private parseGuidance(raw: string | null): TypeGuidance | null {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as TypeGuidance;
    } catch {
      return null;
    }
  }

  private async buildTypeWithActions(type: SignalTypeSelect): Promise<SignalTypeWithActions> {
    const actions = await this.db
      .select()
      .from(typeActions)
      .where(eq(typeActions.typeId, type.id))
      .orderBy(typeActions.sortOrder);

    return {
      id: type.id,
      name: type.name,
      description: type.description,
      color: type.color ?? null,
      icon: type.icon ?? null,
      guidance: this.parseGuidance(type.guidance ?? null),
      isSystem: type.isSystem === 1,
      sortOrder: type.sortOrder ?? 0,
      actions,
      createdAt: type.createdAt,
      updatedAt: type.updatedAt,
    };
  }

  async listTypes(): Promise<SignalTypeWithActions[]> {
    const types = await this.db.select().from(signalTypes).orderBy(signalTypes.sortOrder);
    if (types.length === 0) return [];

    const allActions = await this.db
      .select()
      .from(typeActions)
      .where(inArray(typeActions.typeId, types.map((t) => t.id)))
      .orderBy(typeActions.sortOrder);

    const actionsByType = new Map<string, typeof allActions>();
    for (const action of allActions) {
      const arr = actionsByType.get(action.typeId) ?? [];
      arr.push(action);
      actionsByType.set(action.typeId, arr);
    }

    return types.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      color: t.color ?? null,
      icon: t.icon ?? null,
      guidance: this.parseGuidance(t.guidance ?? null),
      isSystem: t.isSystem === 1,
      sortOrder: t.sortOrder ?? 0,
      actions: actionsByType.get(t.id) ?? [],
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));
  }

  async getType(id: string): Promise<SignalTypeWithActions | null> {
    const result = await this.db
      .select()
      .from(signalTypes)
      .where(eq(signalTypes.id, id))
      .limit(1);

    if (!result[0]) return null;
    return this.buildTypeWithActions(result[0]);
  }

  async createType(params: CreateTypeParams): Promise<SignalTypeWithActions> {
    const now = new Date().toISOString();

    await this.db.insert(signalTypes).values({
      id: params.id,
      name: params.name,
      description: params.description ?? null,
      color: params.color ?? null,
      icon: params.icon ?? null,
      guidance: params.guidance ? JSON.stringify(params.guidance) : null,
      isSystem: 0,
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
    });

    if (params.actions.length > 0) {
      await this.db.insert(typeActions).values(
        params.actions.map((action, i) => ({
          id: crypto.randomUUID(),
          typeId: params.id,
          label: action.label,
          sortOrder: action.sortOrder ?? i,
          createdAt: now,
        }))
      );
    }

    const created = await this.getType(params.id);
    if (!created) {
      throw new Error('Failed to create type');
    }
    return created;
  }

  async updateType(id: string, params: UpdateTypeParams): Promise<SignalTypeWithActions | null> {
    const existing = await this.db
      .select()
      .from(signalTypes)
      .where(eq(signalTypes.id, id))
      .limit(1);

    if (!existing[0]) return null;

    const updates: Partial<{
      name: string;
      description: string | null;
      color: string | null;
      icon: string | null;
      guidance: string | null;
      updatedAt: string;
    }> = {
      updatedAt: new Date().toISOString(),
    };

    if (params.name !== undefined) {
      updates.name = params.name;
    }
    if (params.description !== undefined) {
      updates.description = params.description;
    }
    if (params.color !== undefined) {
      updates.color = params.color;
    }
    if (params.icon !== undefined) {
      updates.icon = params.icon;
    }
    if (params.guidance !== undefined) {
      updates.guidance = params.guidance ? JSON.stringify(params.guidance) : null;
    }

    await this.db.update(signalTypes).set(updates).where(eq(signalTypes.id, id));

    return this.getType(id);
  }

  async deleteType(id: string): Promise<boolean> {
    const existing = await this.db
      .select()
      .from(signalTypes)
      .where(eq(signalTypes.id, id))
      .limit(1);

    if (!existing[0]) return false;

    const refs = await this.db
      .select({ count: count() })
      .from(signals)
      .where(eq(signals.typeId, id));

    if ((refs[0]?.count ?? 0) > 0) {
      throw new Error('Cannot delete type with existing signals');
    }

    await this.db.delete(signalTypes).where(eq(signalTypes.id, id));
    return true;
  }

  async addTypeAction(typeId: string, action: TypeActionDef): Promise<TypeActionSelect> {
    const type = await this.db
      .select()
      .from(signalTypes)
      .where(eq(signalTypes.id, typeId))
      .limit(1);

    if (!type[0]) {
      throw new Error('Type not found');
    }

    const actionId = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.db.insert(typeActions).values({
      id: actionId,
      typeId,
      label: action.label,
      sortOrder: action.sortOrder ?? 0,
      createdAt: now,
    });

    const created = await this.db
      .select()
      .from(typeActions)
      .where(eq(typeActions.id, actionId))
      .limit(1);

    if (!created[0]) {
      throw new Error('Failed to create action');
    }
    return created[0];
  }

  async removeTypeAction(actionId: string): Promise<boolean> {
    const existing = await this.db
      .select()
      .from(typeActions)
      .where(eq(typeActions.id, actionId))
      .limit(1);

    if (!existing[0]) return false;

    await this.db.delete(typeActions).where(eq(typeActions.id, actionId));
    return true;
  }

  // --- Workspace methods ---

  async listWorkspaces(): Promise<WorkspaceSelect[]> {
    return this.db.select().from(workspaces).orderBy(workspaces.name);
  }

  async getWorkspace(id: string): Promise<WorkspaceSelect | null> {
    const result = await this.db.select().from(workspaces).where(eq(workspaces.id, id)).limit(1);
    return result[0] ?? null;
  }

  async createWorkspace(params: CreateWorkspaceParams): Promise<WorkspaceSelect> {
    const now = new Date().toISOString();

    await this.db.insert(workspaces).values({
      id: params.id,
      name: params.name,
      description: params.description ?? null,
      visibility: params.visibility ?? 'private',
      isDefault: 0,
      createdAt: now,
      updatedAt: now,
    });

    const created = await this.getWorkspace(params.id);
    if (!created) {
      throw new Error('Failed to create workspace');
    }
    return created;
  }

  async updateWorkspace(
    id: string,
    params: UpdateWorkspaceParams
  ): Promise<WorkspaceSelect | null> {
    const existing = await this.getWorkspace(id);
    if (!existing) return null;

    const updates: Partial<{ name: string; description: string | null; visibility: string; updatedAt: string }> = {
      updatedAt: new Date().toISOString(),
    };

    if (params.name !== undefined) {
      updates.name = params.name;
    }
    if (params.description !== undefined) {
      updates.description = params.description;
    }
    if (params.visibility !== undefined) {
      updates.visibility = params.visibility;
    }

    await this.db.update(workspaces).set(updates).where(eq(workspaces.id, id));

    // Cascade: when workspace goes public → private, revoke all signals in it.
    // Sets visibility to private, clears slug/shareToken/vouchedAt, bumps updatedAt
    // so federated instances detect the change.
    if (params.visibility === 'private' && existing.visibility === 'public') {
      const now = new Date().toISOString();
      await this.db
        .update(signals)
        .set({
          visibility: 'private',
          slug: null,
          shareToken: null,
          vouchedAt: null,
          updatedAt: now,
        })
        .where(eq(signals.workspaceId, id));
    }

    return this.getWorkspace(id);
  }

  async deleteWorkspace(id: string): Promise<boolean> {
    const existing = await this.getWorkspace(id);
    if (!existing) return false;

    await this.db.delete(workspaces).where(eq(workspaces.id, id));
    return true;
  }

  // --- Settings methods ---

  async getSettings(): Promise<SettingsMap> {
    const now = Date.now();
    if (this.settingsCache && now < this.settingsCache.expiresAt) {
      return this.settingsCache.value;
    }
    const rows = await this.db.select().from(settings);
    const result: SettingsMap = {};
    for (const row of rows) {
      result[row.key] = row.value;
    }
    this.settingsCache = { value: result, expiresAt: now + SignalStore.SETTINGS_TTL_MS };
    return result;
  }

  async getSetting(key: string): Promise<string | null> {
    if (this.settingsCache && Date.now() < this.settingsCache.expiresAt) {
      return this.settingsCache.value[key] ?? null;
    }
    const result = await this.db
      .select()
      .from(settings)
      .where(eq(settings.key, key))
      .limit(1);
    return result[0]?.value ?? null;
  }

  async updateSetting(key: string, value: string): Promise<void> {
    await this.db
      .insert(settings)
      .values({ key, value, updatedAt: new Date().toISOString() })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value, updatedAt: new Date().toISOString() },
      });
    this.settingsCache = null;
  }

  // --- Metadata ---

  async getMetadata(): Promise<MetadataResult> {
    const [types, ws, s] = await Promise.all([
      this.listTypes(),
      this.listWorkspaces(),
      this.getSettings(),
    ]);
    return { types, workspaces: ws, settings: s };
  }
}
