/**
 * Centralized rate limit configuration.
 *
 * All rate limit defaults are defined here — no magic numbers in route files.
 * Per-deployment overrides via env vars: RATE_LIMIT_{TIER}_MAX and RATE_LIMIT_{TIER}_WINDOW_MS.
 */

export interface RateLimitTierConfig {
  /** Time window in milliseconds */
  windowMs: number;
  /** Maximum requests allowed per window per IP */
  max: number;
}

export const RATE_LIMIT_DEFAULTS = {
  /** Login attempts: strict to prevent brute force */
  login: { windowMs: 15 * 60 * 1000, max: 5 },
  /** API write operations (POST/PATCH/DELETE) */
  apiWrite: { windowMs: 60 * 1000, max: 60 },
  /** API read operations (GET) */
  apiRead: { windowMs: 60 * 1000, max: 300 },
  /** MCP tool calls */
  mcp: { windowMs: 60 * 1000, max: 120 },
} as const satisfies Record<string, RateLimitTierConfig>;

export type RateLimitTier = keyof typeof RATE_LIMIT_DEFAULTS;

/**
 * Resolve rate limit config for a tier, with optional env var overrides.
 *
 * Env var naming: RATE_LIMIT_{TIER}_MAX, RATE_LIMIT_{TIER}_WINDOW_MS
 * e.g., RATE_LIMIT_LOGIN_MAX=10, RATE_LIMIT_API_WRITE_WINDOW_MS=120000
 */
export function resolveRateLimitConfig(
  tier: RateLimitTier,
  env: Record<string, string | undefined> = {}
): RateLimitTierConfig {
  const defaults = RATE_LIMIT_DEFAULTS[tier];
  const envKey = tier.replace(/[A-Z]/g, (c) => `_${c}`).toUpperCase();

  const maxOverride = env[`RATE_LIMIT_${envKey}_MAX`];
  const windowOverride = env[`RATE_LIMIT_${envKey}_WINDOW_MS`];

  const parsedMax = maxOverride !== undefined ? parseInt(maxOverride, 10) : NaN;
  const parsedWindow = windowOverride !== undefined ? parseInt(windowOverride, 10) : NaN;

  return {
    max: !isNaN(parsedMax) ? parsedMax : defaults.max,
    windowMs: !isNaN(parsedWindow) ? parsedWindow : defaults.windowMs,
  };
}
