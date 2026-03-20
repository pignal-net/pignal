import { and, asc, count, desc, eq, gt, inArray, isNotNull, isNull, like, or, sql } from 'drizzle-orm';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';

import {
  items,
  itemTypes,
  typeActions,
  workspaces,
  settings,
  type ItemInsert,
  type ItemTypeSelect,
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
  ItemStoreRpc,
  ItemWithMeta,
  ItemTypeWithActions,
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
 * Pure business logic for item storage.
 * Accepts any Drizzle SQLite database instance (DO SQLite or D1).
 * Zero Cloudflare-specific code — can run in any environment with a compatible DB.
 */
export class ItemStore implements ItemStoreRpc {
  private settingsCache: { value: SettingsMap; expiresAt: number } | null = null;
  private static readonly SETTINGS_TTL_MS = 60_000; // 1 minute

  // Both DO SQLite ('sync') and D1 ('async') extend BaseSQLiteDatabase.
  // All queries use await, which works with both modes at runtime.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private db: BaseSQLiteDatabase<any, any>) {}

  // --- Item methods ---

  private readonly itemWithMetaSelect = {
    id: items.id,
    keySummary: items.keySummary,
    content: items.content,
    typeId: items.typeId,
    typeName: itemTypes.name,
    workspaceId: items.workspaceId,
    workspaceName: workspaces.name,
    sourceAi: items.sourceAi,
    validationActionId: items.validationActionId,
    validationActionLabel: typeActions.label,
    tags: items.tags,
    pinnedAt: items.pinnedAt,
    isArchived: items.isArchived,
    visibility: items.visibility,
    slug: items.slug,
    shareToken: items.shareToken,
    vouchedAt: items.vouchedAt,
    createdAt: items.createdAt,
    updatedAt: items.updatedAt,
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

  /** Convert raw DB row to ItemWithMeta with parsed tags. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private withParsedTags(row: any): ItemWithMeta {
    return { ...row, tags: this.parseTags(row.tags) };
  }

  private async getWithMeta(id: string): Promise<ItemWithMeta | null> {
    const result = await this.db
      .select(this.itemWithMetaSelect)
      .from(items)
      .innerJoin(itemTypes, eq(items.typeId, itemTypes.id))
      .leftJoin(workspaces, eq(items.workspaceId, workspaces.id))
      .leftJoin(typeActions, eq(items.validationActionId, typeActions.id))
      .where(eq(items.id, id))
      .limit(1);

    return result[0] ? this.withParsedTags(result[0]) : null;
  }

  async list(params: ListParams = {}): Promise<{ items: ItemWithMeta[]; total: number }> {
    const { typeId, workspaceId, isArchived = false, visibility, limit = 50, offset = 0, q, tag, sort = 'newest' } = params;

    const conditions = [eq(items.isArchived, isArchived ? 1 : 0)];

    if (typeId) {
      conditions.push(eq(items.typeId, typeId));
    }
    if (workspaceId) {
      conditions.push(eq(items.workspaceId, workspaceId));
    }
    if (visibility) {
      conditions.push(eq(items.visibility, visibility));
    }
    if (q) {
      const escaped = q.replace(/[%_]/g, '\\$&');
      conditions.push(
        or(
          like(items.keySummary, `%${escaped}%`),
          like(items.content, `%${escaped}%`)
        )!
      );
    }
    if (tag) {
      // Match tag within JSON array: '["tag1","tag2"]' contains '"tagname"'
      const escaped = tag.toLowerCase().replace(/[%_"]/g, '\\$&');
      conditions.push(like(items.tags, `%"${escaped}"%`));
    }

    const whereClause = and(...conditions);

    // Pinned first, then by date
    const orderClauses = sort === 'oldest'
      ? [sql`${items.pinnedAt} IS NULL ASC`, desc(items.pinnedAt), asc(items.createdAt)]
      : [sql`${items.pinnedAt} IS NULL ASC`, desc(items.pinnedAt), desc(items.createdAt)];

    const [listItems, totalResult] = await Promise.all([
      this.db
        .select(this.itemWithMetaSelect)
        .from(items)
        .innerJoin(itemTypes, eq(items.typeId, itemTypes.id))
        .leftJoin(workspaces, eq(items.workspaceId, workspaces.id))
        .leftJoin(typeActions, eq(items.validationActionId, typeActions.id))
        .where(whereClause)
        .orderBy(...orderClauses)
        .limit(limit)
        .offset(offset),
      this.db.select({ count: count() }).from(items).where(whereClause),
    ]);

    return { items: listItems.map((r) => this.withParsedTags(r)), total: totalResult[0]?.count ?? 0 };
  }

  async get(id: string): Promise<ItemWithMeta | null> {
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

  async create(params: CreateParams): Promise<ItemWithMeta> {
    const limits = await this.getValidationLimits();
    this.enforceSoftLimits(limits, {
      keySummary: params.keySummary,
      content: params.content,
      sourceAi: params.sourceAi,
    });

    const now = new Date().toISOString();

    const normalizedTags = this.normalizeTags(params.tags);

    const data: ItemInsert = {
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

    await this.db.insert(items).values(data);

    const created = await this.getWithMeta(params.id);
    if (!created) {
      throw new Error('Failed to create item');
    }
    return created;
  }

  async update(id: string, params: UpdateParams): Promise<ItemWithMeta | null> {
    const existing = await this.db
      .select({ id: items.id })
      .from(items)
      .where(eq(items.id, id))
      .limit(1);
    if (!existing[0]) return null;

    const limits = await this.getValidationLimits();
    this.enforceSoftLimits(limits, {
      keySummary: params.keySummary,
      content: params.content,
    });

    const updates: Partial<ItemInsert> = {
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

    await this.db.update(items).set(updates).where(eq(items.id, id));

    return this.getWithMeta(id);
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.db
      .select({ id: items.id })
      .from(items)
      .where(eq(items.id, id))
      .limit(1);
    if (!existing[0]) return false;

    await this.db.delete(items).where(eq(items.id, id));
    return true;
  }

  async validate(id: string, actionId: string | null): Promise<ItemWithMeta | null> {
    const existing = await this.db
      .select({ id: items.id, typeId: items.typeId })
      .from(items)
      .where(eq(items.id, id))
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
        throw new Error('Action does not belong to this item type');
      }
    }

    await this.db
      .update(items)
      .set({
        validationActionId: actionId,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(items.id, id));

    return this.getWithMeta(id);
  }

  async archive(id: string): Promise<ItemWithMeta | null> {
    const existing = await this.db
      .select({ id: items.id })
      .from(items)
      .where(eq(items.id, id))
      .limit(1);
    if (!existing[0]) return null;

    await this.db
      .update(items)
      .set({ isArchived: 1, updatedAt: new Date().toISOString() })
      .where(eq(items.id, id));

    return this.getWithMeta(id);
  }

  async unarchive(id: string): Promise<ItemWithMeta | null> {
    const existing = await this.db
      .select({ id: items.id })
      .from(items)
      .where(eq(items.id, id))
      .limit(1);
    if (!existing[0]) return null;

    await this.db
      .update(items)
      .set({ isArchived: 0, updatedAt: new Date().toISOString() })
      .where(eq(items.id, id));

    return this.getWithMeta(id);
  }

  async pin(id: string): Promise<ItemWithMeta | null> {
    const existing = await this.db
      .select({ id: items.id })
      .from(items)
      .where(eq(items.id, id))
      .limit(1);
    if (!existing[0]) return null;

    await this.db
      .update(items)
      .set({ pinnedAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
      .where(eq(items.id, id));

    return this.getWithMeta(id);
  }

  async unpin(id: string): Promise<ItemWithMeta | null> {
    const existing = await this.db
      .select({ id: items.id })
      .from(items)
      .where(eq(items.id, id))
      .limit(1);
    if (!existing[0]) return null;

    await this.db
      .update(items)
      .set({ pinnedAt: null, updatedAt: new Date().toISOString() })
      .where(eq(items.id, id));

    return this.getWithMeta(id);
  }

  async stats(): Promise<StatsResult> {
    const notArchivedCondition = eq(items.isArchived, 0);
    const archivedCondition = eq(items.isArchived, 1);

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
      this.db.select({ count: count() }).from(items).where(notArchivedCondition),
      this.db.select({ count: count() }).from(items).where(archivedCondition),
      this.db
        .select({ name: itemTypes.name, count: count() })
        .from(items)
        .innerJoin(itemTypes, eq(items.typeId, itemTypes.id))
        .where(notArchivedCondition)
        .groupBy(itemTypes.name),
      this.db
        .select({ name: workspaces.name, count: count() })
        .from(items)
        .innerJoin(workspaces, eq(items.workspaceId, workspaces.id))
        .where(and(notArchivedCondition, isNotNull(items.workspaceId)))
        .groupBy(workspaces.name),
      this.db
        .select({ count: count() })
        .from(items)
        .where(and(notArchivedCondition, isNotNull(items.validationActionId))),
      this.db
        .select({ count: count() })
        .from(items)
        .where(and(notArchivedCondition, sql`${items.validationActionId} IS NULL`)),
      this.db
        .select({ label: typeActions.label, count: count() })
        .from(items)
        .innerJoin(typeActions, eq(items.validationActionId, typeActions.id))
        .where(and(notArchivedCondition, isNotNull(items.validationActionId)))
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
        .select({ id: items.id })
        .from(items)
        .where(eq(items.slug, slug))
        .limit(1);
      if (!existing[0] || existing[0].id === excludeId) break;
      slug = `${base}-${suffix}`;
      suffix++;
    }
    return slug;
  }

  async vouch(id: string, params: VouchParams): Promise<ItemWithMeta | null> {
    const existing = await this.db
      .select({ id: items.id, vouchedAt: items.vouchedAt })
      .from(items)
      .where(eq(items.id, id))
      .limit(1);
    if (!existing[0]) return null;

    const now = new Date().toISOString();
    const updates: Partial<ItemInsert> = {
      visibility: params.visibility,
      updatedAt: now,
    };

    if (params.visibility === 'vouched') {
      const baseSlug = params.slug || this.generateSlug(
        (await this.db.select({ keySummary: items.keySummary }).from(items).where(eq(items.id, id)).limit(1))[0]?.keySummary ?? id
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

    await this.db.update(items).set(updates).where(eq(items.id, id));
    return this.getWithMeta(id);
  }

  async getByShareToken(token: string): Promise<ItemWithMeta | null> {
    const result = await this.db
      .select(this.itemWithMetaSelect)
      .from(items)
      .innerJoin(itemTypes, eq(items.typeId, itemTypes.id))
      .leftJoin(workspaces, eq(items.workspaceId, workspaces.id))
      .leftJoin(typeActions, eq(items.validationActionId, typeActions.id))
      .where(and(
        eq(items.shareToken, token),
        eq(items.visibility, 'unlisted'),
        // Workspace visibility overrides: exclude items in private workspaces
        or(isNull(items.workspaceId), eq(workspaces.visibility, 'public'))
      ))
      .limit(1);
    return result[0] ? this.withParsedTags(result[0]) : null;
  }

  async getBySlug(slug: string): Promise<ItemWithMeta | null> {
    const result = await this.db
      .select(this.itemWithMetaSelect)
      .from(items)
      .innerJoin(itemTypes, eq(items.typeId, itemTypes.id))
      .leftJoin(workspaces, eq(items.workspaceId, workspaces.id))
      .leftJoin(typeActions, eq(items.validationActionId, typeActions.id))
      .where(and(
        eq(items.slug, slug),
        eq(items.visibility, 'vouched'),
        // Workspace visibility overrides: exclude items in private workspaces
        or(isNull(items.workspaceId), eq(workspaces.visibility, 'public'))
      ))
      .limit(1);
    return result[0] ? this.withParsedTags(result[0]) : null;
  }

  async listPublic(params: ListParams = {}): Promise<{ items: ItemWithMeta[]; total: number }> {
    const { typeId, workspaceId, limit = 50, offset = 0, q, tag, updatedAfter, sort } = params;

    // Subquery: IDs of public workspaces. Used in both items and count queries.
    const publicWsIds = this.db.select({ id: workspaces.id }).from(workspaces).where(eq(workspaces.visibility, 'public'));

    const conditions = [
      eq(items.visibility, 'vouched'),
      eq(items.isArchived, 0),
      // Workspace visibility overrides item visibility: exclude items in private workspaces
      or(isNull(items.workspaceId), inArray(items.workspaceId, publicWsIds))!,
    ];

    if (typeId) {
      conditions.push(eq(items.typeId, typeId));
    }
    if (workspaceId) {
      // Only allow filtering by public workspaces
      conditions.push(eq(items.workspaceId, workspaceId));
    }
    if (tag) {
      const escaped = tag.toLowerCase().replace(/[%_"]/g, '\\$&');
      conditions.push(like(items.tags, `%"${escaped}"%`));
    }
    if (q) {
      const escaped = q.replace(/[%_]/g, '\\$&');
      conditions.push(
        or(
          like(items.keySummary, `%${escaped}%`),
          like(items.content, `%${escaped}%`)
        )!
      );
    }
    if (updatedAfter) {
      conditions.push(gt(items.updatedAt, updatedAfter));
    }

    const whereClause = and(...conditions);

    // When syncing incrementally, order oldest-first so consumer processes in order
    // Otherwise: pinned first (by pinnedAt DESC), then chronological
    const orderClauses = updatedAfter
      ? [asc(items.updatedAt)]
      : sort === 'oldest'
        ? [sql`${items.pinnedAt} IS NULL ASC`, desc(items.pinnedAt), asc(items.vouchedAt)]
        : [sql`${items.pinnedAt} IS NULL ASC`, desc(items.pinnedAt), desc(items.vouchedAt)];

    const [listItems, totalResult] = await Promise.all([
      this.db
        .select(this.itemWithMetaSelect)
        .from(items)
        .innerJoin(itemTypes, eq(items.typeId, itemTypes.id))
        .leftJoin(workspaces, eq(items.workspaceId, workspaces.id))
        .leftJoin(typeActions, eq(items.validationActionId, typeActions.id))
        .where(whereClause)
        .orderBy(...orderClauses)
        .limit(limit)
        .offset(offset),
      this.db.select({ count: count() }).from(items).where(whereClause),
    ]);

    return { items: listItems.map((r) => this.withParsedTags(r)), total: totalResult[0]?.count ?? 0 };
  }

  async listPublicCounts(params: { tag?: string; q?: string } = {}): Promise<{ total: number; byType: Record<string, number>; byWorkspace: Record<string, number>; byWorkspaceType: Record<string, Record<string, number>> }> {
    const { tag, q } = params;

    const publicWsIds = this.db.select({ id: workspaces.id }).from(workspaces).where(eq(workspaces.visibility, 'public'));

    const conditions = [
      eq(items.visibility, 'vouched'),
      eq(items.isArchived, 0),
      or(isNull(items.workspaceId), inArray(items.workspaceId, publicWsIds))!,
    ];

    if (tag) {
      const escaped = tag.toLowerCase().replace(/[%_"]/g, '\\$&');
      conditions.push(like(items.tags, `%"${escaped}"%`));
    }
    if (q) {
      const escaped = q.replace(/[%_]/g, '\\$&');
      conditions.push(
        or(
          like(items.keySummary, `%${escaped}%`),
          like(items.content, `%${escaped}%`)
        )!
      );
    }

    const whereClause = and(...conditions);

    const [totalResult, byTypeResult, byWorkspaceResult, byWsTypeResult] = await Promise.all([
      this.db.select({ count: count() }).from(items).where(whereClause),
      this.db
        .select({ typeId: items.typeId, count: count() })
        .from(items)
        .where(whereClause)
        .groupBy(items.typeId),
      this.db
        .select({ workspaceId: items.workspaceId, count: count() })
        .from(items)
        .where(and(whereClause, isNotNull(items.workspaceId)))
        .groupBy(items.workspaceId),
      this.db
        .select({ workspaceId: items.workspaceId, typeId: items.typeId, count: count() })
        .from(items)
        .where(and(whereClause, isNotNull(items.workspaceId)))
        .groupBy(items.workspaceId, items.typeId),
    ]);

    const byType: Record<string, number> = {};
    for (const row of byTypeResult) {
      byType[row.typeId] = row.count;
    }

    const byWorkspace: Record<string, number> = {};
    for (const row of byWorkspaceResult) {
      if (row.workspaceId) {
        byWorkspace[row.workspaceId] = row.count;
      }
    }

    const byWorkspaceType: Record<string, Record<string, number>> = {};
    for (const row of byWsTypeResult) {
      if (row.workspaceId) {
        if (!byWorkspaceType[row.workspaceId]) {
          byWorkspaceType[row.workspaceId] = {};
        }
        byWorkspaceType[row.workspaceId][row.typeId] = row.count;
      }
    }

    return {
      total: totalResult[0]?.count ?? 0,
      byType,
      byWorkspace,
      byWorkspaceType,
    };
  }

  async listCounts(params: { tag?: string; q?: string; isArchived?: boolean } = {}): Promise<{ total: number; byType: Record<string, number>; byWorkspace: Record<string, number>; byWorkspaceType: Record<string, Record<string, number>> }> {
    const { tag, q, isArchived = false } = params;

    const conditions = [eq(items.isArchived, isArchived ? 1 : 0)];

    if (tag) {
      const escaped = tag.toLowerCase().replace(/[%_"]/g, '\\$&');
      conditions.push(like(items.tags, `%"${escaped}"%`));
    }
    if (q) {
      const escaped = q.replace(/[%_]/g, '\\$&');
      conditions.push(
        or(
          like(items.keySummary, `%${escaped}%`),
          like(items.content, `%${escaped}%`)
        )!
      );
    }

    const whereClause = and(...conditions);

    const [totalResult, byTypeResult, byWorkspaceResult, byWsTypeResult] = await Promise.all([
      this.db.select({ count: count() }).from(items).where(whereClause),
      this.db
        .select({ typeId: items.typeId, count: count() })
        .from(items)
        .where(whereClause)
        .groupBy(items.typeId),
      this.db
        .select({ workspaceId: items.workspaceId, count: count() })
        .from(items)
        .where(and(whereClause, isNotNull(items.workspaceId)))
        .groupBy(items.workspaceId),
      this.db
        .select({ workspaceId: items.workspaceId, typeId: items.typeId, count: count() })
        .from(items)
        .where(and(whereClause, isNotNull(items.workspaceId)))
        .groupBy(items.workspaceId, items.typeId),
    ]);

    const byType: Record<string, number> = {};
    for (const row of byTypeResult) {
      byType[row.typeId] = row.count;
    }

    const byWorkspace: Record<string, number> = {};
    for (const row of byWorkspaceResult) {
      if (row.workspaceId) {
        byWorkspace[row.workspaceId] = row.count;
      }
    }

    const byWorkspaceType: Record<string, Record<string, number>> = {};
    for (const row of byWsTypeResult) {
      if (row.workspaceId) {
        if (!byWorkspaceType[row.workspaceId]) {
          byWorkspaceType[row.workspaceId] = {};
        }
        byWorkspaceType[row.workspaceId][row.typeId] = row.count;
      }
    }

    return { total: totalResult[0]?.count ?? 0, byType, byWorkspace, byWorkspaceType };
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

  private async buildTypeWithActions(type: ItemTypeSelect): Promise<ItemTypeWithActions> {
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

  async listTypes(): Promise<ItemTypeWithActions[]> {
    const types = await this.db.select().from(itemTypes).orderBy(itemTypes.sortOrder);
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

  async getType(id: string): Promise<ItemTypeWithActions | null> {
    const result = await this.db
      .select()
      .from(itemTypes)
      .where(eq(itemTypes.id, id))
      .limit(1);

    if (!result[0]) return null;
    return this.buildTypeWithActions(result[0]);
  }

  async createType(params: CreateTypeParams): Promise<ItemTypeWithActions> {
    const now = new Date().toISOString();

    await this.db.insert(itemTypes).values({
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

  async updateType(id: string, params: UpdateTypeParams): Promise<ItemTypeWithActions | null> {
    const existing = await this.db
      .select()
      .from(itemTypes)
      .where(eq(itemTypes.id, id))
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

    await this.db.update(itemTypes).set(updates).where(eq(itemTypes.id, id));

    return this.getType(id);
  }

  async deleteType(id: string): Promise<boolean> {
    const existing = await this.db
      .select()
      .from(itemTypes)
      .where(eq(itemTypes.id, id))
      .limit(1);

    if (!existing[0]) return false;

    const refs = await this.db
      .select({ count: count() })
      .from(items)
      .where(eq(items.typeId, id));

    if ((refs[0]?.count ?? 0) > 0) {
      throw new Error('Cannot delete type with existing items');
    }

    await this.db.delete(itemTypes).where(eq(itemTypes.id, id));
    return true;
  }

  async addTypeAction(typeId: string, action: TypeActionDef): Promise<TypeActionSelect> {
    const type = await this.db
      .select()
      .from(itemTypes)
      .where(eq(itemTypes.id, typeId))
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

    // Cascade: when workspace goes public → private, revoke all items in it.
    // Sets visibility to private, clears slug/shareToken/vouchedAt, bumps updatedAt
    // so federated instances detect the change.
    if (params.visibility === 'private' && existing.visibility === 'public') {
      const now = new Date().toISOString();
      await this.db
        .update(items)
        .set({
          visibility: 'private',
          slug: null,
          shareToken: null,
          vouchedAt: null,
          updatedAt: now,
        })
        .where(eq(items.workspaceId, id));
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
    this.settingsCache = { value: result, expiresAt: now + ItemStore.SETTINGS_TTL_MS };
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
