/**
 * Re-export rate limit middleware from core.
 * Both server and web packages share the same in-memory window state
 * since they're bundled into the same Worker.
 */
export { rateLimit } from '@pignal/core/middleware/rate-limit';
