import { eq } from 'drizzle-orm';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';

import { apiKeys } from '@pignal/db/schema';
import type { ApiKeyInfo } from '@pignal/db';

const API_KEY_PREFIX = 'pignal_';
const API_KEY_BYTES = 32;

/**
 * Generate a cryptographically random API key.
 * Format: pignal_<64 hex chars> (71 chars total).
 */
function generateRawKey(): string {
  const bytes = new Uint8Array(API_KEY_BYTES);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `${API_KEY_PREFIX}${hex}`;
}

/**
 * SHA-256 hash an API key for storage. The raw key is never stored.
 */
async function hashKey(key: string): Promise<string> {
  const data = new TextEncoder().encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * API key management for self-hosted servers.
 * Keys authenticate federation and external API access.
 *
 * Security model:
 * - Raw keys are returned exactly once at creation time
 * - Only SHA-256 hashes are stored in the database
 * - Validation is done by hashing the input and looking up the hash (no timing leak)
 */
export class ApiKeyStore {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private db: BaseSQLiteDatabase<any, any>) {}

  /**
   * Create a new API key. Returns the raw key exactly once.
   * @param workspaceIds - Optional workspace restriction. null = all workspaces.
   */
  async create(
    name: string,
    scopes = 'list_items,get_metadata',
    expiresAt?: string,
    workspaceIds?: string[] | null
  ): Promise<{ id: string; rawKey: string }> {
    const rawKey = generateRawKey();
    const keyHash = await hashKey(rawKey);
    const id = crypto.randomUUID();

    await this.db.insert(apiKeys).values({
      id,
      name,
      keyHash,
      scopes,
      workspaceIds: workspaceIds?.length ? workspaceIds.join(',') : null,
      expiresAt: expiresAt ?? null,
    });

    return { id, rawKey };
  }

  /**
   * Validate an API key. Returns key info if valid, null otherwise.
   * Updates last_used_at on successful validation.
   */
  async validate(
    rawKey: string
  ): Promise<{ id: string; scopes: string[]; workspaceIds: string[] | null } | null> {
    if (!rawKey.startsWith(API_KEY_PREFIX)) return null;

    const keyHash = await hashKey(rawKey);
    const results = await this.db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.keyHash, keyHash))
      .limit(1);

    if (results.length === 0) return null;

    const record = results[0];

    // Check expiry
    if (record.expiresAt && new Date(record.expiresAt) < new Date()) {
      await this.db.delete(apiKeys).where(eq(apiKeys.id, record.id));
      return null;
    }

    // Update last_used_at (fire-and-forget, don't block validation)
    const now = new Date().toISOString();
    await this.db
      .update(apiKeys)
      .set({ lastUsedAt: now })
      .where(eq(apiKeys.id, record.id));

    return {
      id: record.id,
      scopes: record.scopes.split(','),
      workspaceIds: record.workspaceIds ? record.workspaceIds.split(',') : null,
    };
  }

  /**
   * List all API keys (without raw keys or hashes).
   */
  async list(): Promise<ApiKeyInfo[]> {
    const rows = await this.db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        scopes: apiKeys.scopes,
        workspaceIds: apiKeys.workspaceIds,
        createdAt: apiKeys.createdAt,
        lastUsedAt: apiKeys.lastUsedAt,
        expiresAt: apiKeys.expiresAt,
      })
      .from(apiKeys)
      .orderBy(apiKeys.createdAt);

    return rows;
  }

  /**
   * Delete an API key by ID.
   */
  async delete(id: string): Promise<boolean> {
    const existing = await this.db
      .select({ id: apiKeys.id })
      .from(apiKeys)
      .where(eq(apiKeys.id, id))
      .limit(1);

    if (existing.length === 0) return false;

    await this.db.delete(apiKeys).where(eq(apiKeys.id, id));
    return true;
  }
}
