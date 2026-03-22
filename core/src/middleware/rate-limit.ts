import type { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';

import type { RateLimitTier } from '../config/rate-limits';
import { resolveRateLimitConfig } from '../config/rate-limits';

/**
 * Simple in-memory sliding-window rate limiter.
 *
 * Per-isolate (not globally shared) — provides basic protection for
 * self-hosted single-user deployments. For production-grade global
 * rate limiting, use Cloudflare's built-in Rate Limiting rules.
 */

interface WindowEntry {
  count: number;
  resetAt: number;
}

// Shared state per isolate — Map<tier:ip, WindowEntry>
const windows = new Map<string, WindowEntry>();

// Periodic cleanup to prevent memory leaks (every 5 minutes)
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 5 * 60 * 1000;

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of windows) {
    if (entry.resetAt <= now) {
      windows.delete(key);
    }
  }
}

function getClientIp(c: Context): string {
  return c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() || 'unknown';
}

/**
 * Rate limit middleware factory.
 *
 * @param tier - Rate limit tier from centralized config (login, apiWrite, apiRead, mcp)
 *
 * Config is resolved once per request from RATE_LIMIT_DEFAULTS + env var overrides.
 */
export function rateLimit(tier: RateLimitTier) {
  return async (c: Context, next: Next) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config = resolveRateLimitConfig(tier, c.env as any);
    const ip = getClientIp(c);
    const key = `${tier}:${ip}`;
    const now = Date.now();

    cleanup();

    let entry = windows.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + config.windowMs };
      windows.set(key, entry);
    }

    entry.count++;

    // Set rate limit headers
    c.header('X-RateLimit-Limit', String(config.max));
    c.header('X-RateLimit-Remaining', String(Math.max(0, config.max - entry.count)));
    c.header('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > config.max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      c.header('Retry-After', String(retryAfter));
      throw new HTTPException(429, { message: 'Too many requests' });
    }

    await next();
  };
}
