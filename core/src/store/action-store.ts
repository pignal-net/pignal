import { and, count, desc, eq, sql } from 'drizzle-orm';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';

import { siteActions, submissions } from '@pignal/db/schema';
import type {
  ActionStoreRpc,
  SiteActionSelect,
  SiteActionStatus,
  SubmissionSelect,
  SubmissionStatus,
  CreateActionParams,
  UpdateActionParams,
  ListSubmissionsParams,
  SubmissionMeta,
  SubmissionWithAction,
  ActionStats,
  SiteActionField,
  SiteActionSettings,
} from '@pignal/db';
import type { FieldTypeRegistry } from '../actions/field-types';
import { createEvent } from '../events/event-bus';
import type { EventBus } from '../events/event-bus';

// ---------------------------------------------------------------------------
// ActionStore
// ---------------------------------------------------------------------------

/**
 * Pure business logic for site actions (forms) and submissions.
 * Accepts any Drizzle SQLite database instance (D1 or DO SQLite).
 * Zero Cloudflare-specific code — can run in any environment with a compatible DB.
 */
export class ActionStore implements ActionStoreRpc {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private db: BaseSQLiteDatabase<any, any>,
    private fieldRegistry?: FieldTypeRegistry,
    private eventBus?: EventBus,
  ) {}

  // -----------------------------------------------------------------------
  // Site Actions CRUD
  // -----------------------------------------------------------------------

  async listActions(params: { status?: SiteActionStatus } = {}): Promise<SiteActionSelect[]> {
    const conditions = [];
    if (params.status) {
      conditions.push(eq(siteActions.status, params.status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return this.db
      .select()
      .from(siteActions)
      .where(whereClause)
      .orderBy(desc(siteActions.createdAt));
  }

  async getAction(id: string): Promise<SiteActionSelect | null> {
    const result = await this.db
      .select()
      .from(siteActions)
      .where(eq(siteActions.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  async getActionBySlug(slug: string): Promise<SiteActionSelect | null> {
    const result = await this.db
      .select()
      .from(siteActions)
      .where(eq(siteActions.slug, slug))
      .limit(1);

    return result[0] ?? null;
  }

  async createAction(params: CreateActionParams): Promise<SiteActionSelect> {
    // Validate slug uniqueness
    const existing = await this.getActionBySlug(params.slug);
    if (existing) {
      throw new Error(`Action with slug "${params.slug}" already exists`);
    }

    const now = new Date().toISOString();

    await this.db.insert(siteActions).values({
      id: params.id,
      name: params.name,
      slug: params.slug,
      description: params.description ?? null,
      fields: JSON.stringify(params.fields),
      settings: JSON.stringify(params.settings ?? {}),
      status: 'active',
      submissionCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    const created = await this.getAction(params.id);
    if (!created) {
      throw new Error('Failed to create action');
    }
    return created;
  }

  async updateAction(id: string, params: UpdateActionParams): Promise<SiteActionSelect | null> {
    const existing = await this.getAction(id);
    if (!existing) return null;

    // Validate slug uniqueness if changing
    if (params.slug !== undefined && params.slug !== existing.slug) {
      const slugConflict = await this.getActionBySlug(params.slug);
      if (slugConflict) {
        throw new Error(`Action with slug "${params.slug}" already exists`);
      }
    }

    const updates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (params.name !== undefined) {
      updates.name = params.name;
    }
    if (params.slug !== undefined) {
      updates.slug = params.slug;
    }
    if (params.description !== undefined) {
      updates.description = params.description;
    }
    if (params.fields !== undefined) {
      updates.fields = JSON.stringify(params.fields);
    }
    if (params.settings !== undefined) {
      updates.settings = JSON.stringify(params.settings);
    }
    if (params.status !== undefined) {
      updates.status = params.status;
    }

    await this.db.update(siteActions).set(updates).where(eq(siteActions.id, id));

    return this.getAction(id);
  }

  async deleteAction(id: string): Promise<boolean> {
    const existing = await this.db
      .select({ id: siteActions.id })
      .from(siteActions)
      .where(eq(siteActions.id, id))
      .limit(1);
    if (!existing[0]) return false;

    await this.db.delete(siteActions).where(eq(siteActions.id, id));
    return true;
  }

  // -----------------------------------------------------------------------
  // Submissions
  // -----------------------------------------------------------------------

  async submitForm(
    actionSlug: string,
    data: Record<string, string>,
    meta: SubmissionMeta,
  ): Promise<SubmissionSelect> {
    // 1. Look up action by slug
    const action = await this.getActionBySlug(actionSlug);
    if (!action) {
      throw new Error(`Action "${actionSlug}" not found`);
    }

    // 2. Check action status
    if (action.status !== 'active') {
      throw new Error(`Action "${actionSlug}" is not accepting submissions`);
    }

    // 3. Parse field definitions
    const fields: SiteActionField[] = JSON.parse(action.fields);
    const actionSettings: SiteActionSettings = JSON.parse(action.settings);

    // 4. Validate submitted data against field definitions
    const validatedData: Record<string, string> = {};
    for (const field of fields) {
      const value = data[field.name] ?? '';

      if (this.fieldRegistry) {
        const error = this.fieldRegistry.validate(value, field);
        if (error) {
          throw new Error(`Validation error for "${field.label}": ${error}`);
        }
        validatedData[field.name] = this.fieldRegistry.sanitize(value, field);
      } else {
        // Basic required-field check
        if (field.required && !value.trim()) {
          throw new Error(`"${field.label}" is required`);
        }
        // Basic maxLength enforcement
        if (field.maxLength && value.length > field.maxLength) {
          throw new Error(`"${field.label}" exceeds maximum length of ${field.maxLength}`);
        }
        validatedData[field.name] = value.trim();
      }
    }

    // 5. Honeypot check — silently succeed without storing (bot trap)
    if (actionSettings.require_honeypot && data._honeypot && data._honeypot.trim() !== '') {
      // Return a fake submission so bots think they succeeded
      return {
        id: crypto.randomUUID(),
        actionId: action.id,
        data: JSON.stringify(validatedData),
        status: 'new',
        ipHash: meta.ipHash ?? null,
        referrer: meta.referrer ?? null,
        createdAt: new Date().toISOString(),
      };
    }

    // 6. Store submission
    const submissionId = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.db.insert(submissions).values({
      id: submissionId,
      actionId: action.id,
      data: JSON.stringify(validatedData),
      status: 'new',
      ipHash: meta.ipHash ?? null,
      referrer: meta.referrer ?? null,
      createdAt: now,
    });

    // 7. Increment submission_count atomically
    await this.db
      .update(siteActions)
      .set({
        submissionCount: sql`${siteActions.submissionCount} + 1`,
        updatedAt: now,
      })
      .where(eq(siteActions.id, action.id));

    // 8. Emit event
    if (this.eventBus) {
      const event = createEvent('submission.created', {
        submissionId,
        actionId: action.id,
        actionSlug: action.slug,
        actionName: action.name,
      });
      void this.eventBus.emit(event);
    }

    const created = await this.db
      .select()
      .from(submissions)
      .where(eq(submissions.id, submissionId))
      .limit(1);

    if (!created[0]) {
      throw new Error('Failed to create submission');
    }
    return created[0];
  }

  /** Select fields for submission joined with action. */
  private readonly submissionWithActionSelect = {
    id: submissions.id,
    actionId: submissions.actionId,
    actionName: siteActions.name,
    actionSlug: siteActions.slug,
    data: submissions.data,
    status: submissions.status,
    ipHash: submissions.ipHash,
    referrer: submissions.referrer,
    createdAt: submissions.createdAt,
  };

  /** Parse raw submission row data JSON into object. */
  private parseSubmissionRow(row: {
    id: string;
    actionId: string;
    actionName: string;
    actionSlug: string;
    data: string;
    status: string;
    ipHash: string | null;
    referrer: string | null;
    createdAt: string;
  }): SubmissionWithAction {
    let parsedData: Record<string, string> = {};
    try {
      parsedData = JSON.parse(row.data);
    } catch {
      // Leave as empty object if parse fails
    }
    return { ...row, data: parsedData };
  }

  async listSubmissions(
    params: ListSubmissionsParams,
  ): Promise<{ submissions: SubmissionWithAction[]; total: number }> {
    const { actionId, status, limit = 50, offset = 0 } = params;

    const conditions = [];
    if (actionId) {
      conditions.push(eq(submissions.actionId, actionId));
    }
    if (status) {
      conditions.push(eq(submissions.status, status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, totalResult] = await Promise.all([
      this.db
        .select(this.submissionWithActionSelect)
        .from(submissions)
        .innerJoin(siteActions, eq(submissions.actionId, siteActions.id))
        .where(whereClause)
        .orderBy(desc(submissions.createdAt))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: count() })
        .from(submissions)
        .where(whereClause),
    ]);

    return {
      submissions: rows.map((r) => this.parseSubmissionRow(r)),
      total: totalResult[0]?.count ?? 0,
    };
  }

  async getSubmission(id: string): Promise<SubmissionWithAction | null> {
    const result = await this.db
      .select(this.submissionWithActionSelect)
      .from(submissions)
      .innerJoin(siteActions, eq(submissions.actionId, siteActions.id))
      .where(eq(submissions.id, id))
      .limit(1);

    return result[0] ? this.parseSubmissionRow(result[0]) : null;
  }

  async updateSubmissionStatus(id: string, status: SubmissionStatus): Promise<boolean> {
    const existing = await this.db
      .select({ id: submissions.id })
      .from(submissions)
      .where(eq(submissions.id, id))
      .limit(1);
    if (!existing[0]) return false;

    await this.db
      .update(submissions)
      .set({ status })
      .where(eq(submissions.id, id));

    return true;
  }

  async deleteSubmission(id: string): Promise<boolean> {
    const existing = await this.db
      .select({ id: submissions.id, actionId: submissions.actionId })
      .from(submissions)
      .where(eq(submissions.id, id))
      .limit(1);
    if (!existing[0]) return false;

    await this.db.delete(submissions).where(eq(submissions.id, id));

    // Decrement submission_count (floor at 0)
    await this.db
      .update(siteActions)
      .set({
        submissionCount: sql`MAX(${siteActions.submissionCount} - 1, 0)`,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(siteActions.id, existing[0].actionId));

    return true;
  }

  async exportSubmissions(actionId: string, format: 'json' | 'csv'): Promise<string> {
    const rows = await this.db
      .select(this.submissionWithActionSelect)
      .from(submissions)
      .innerJoin(siteActions, eq(submissions.actionId, siteActions.id))
      .where(eq(submissions.actionId, actionId))
      .orderBy(desc(submissions.createdAt));

    const parsed = rows.map((r) => this.parseSubmissionRow(r));

    if (format === 'json') {
      return JSON.stringify(parsed, null, 2);
    }

    // CSV format
    if (parsed.length === 0) {
      return '';
    }

    // Collect all unique data keys across submissions
    const dataKeys = new Set<string>();
    for (const sub of parsed) {
      for (const key of Object.keys(sub.data)) {
        dataKeys.add(key);
      }
    }
    const sortedDataKeys = [...dataKeys].sort();

    // Build header row
    const headers = ['id', 'status', 'createdAt', ...sortedDataKeys, 'ipHash', 'referrer'];

    // Escape CSV value
    const escapeCsv = (val: string): string => {
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    const lines = [headers.map(escapeCsv).join(',')];

    for (const sub of parsed) {
      const row = [
        sub.id,
        sub.status,
        sub.createdAt,
        ...sortedDataKeys.map((k) => sub.data[k] ?? ''),
        sub.ipHash ?? '',
        sub.referrer ?? '',
      ];
      lines.push(row.map(escapeCsv).join(','));
    }

    return lines.join('\n');
  }

  async submissionStats(): Promise<ActionStats> {
    // Total actions
    const actionsResult = await this.db
      .select({ count: count() })
      .from(siteActions);
    const totalActions = actionsResult[0]?.count ?? 0;

    // Total submissions
    const submissionsResult = await this.db
      .select({ count: count() })
      .from(submissions);
    const totalSubmissions = submissionsResult[0]?.count ?? 0;

    // By action name
    const byActionRows = await this.db
      .select({
        actionName: siteActions.name,
        count: count(),
      })
      .from(submissions)
      .innerJoin(siteActions, eq(submissions.actionId, siteActions.id))
      .groupBy(siteActions.name);

    const byAction: Record<string, number> = {};
    for (const row of byActionRows) {
      byAction[row.actionName] = row.count;
    }

    // By status
    const byStatusRows = await this.db
      .select({
        status: submissions.status,
        count: count(),
      })
      .from(submissions)
      .groupBy(submissions.status);

    const byStatus: Record<string, number> = {};
    for (const row of byStatusRows) {
      byStatus[row.status] = row.count;
    }

    return { totalActions, totalSubmissions, byAction, byStatus };
  }
}
