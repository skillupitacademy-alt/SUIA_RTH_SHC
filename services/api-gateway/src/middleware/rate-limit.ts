import type { MiddlewareHandler } from 'hono';

export function createRateLimitMiddleware(): MiddlewareHandler {
  return async (_c, next) => {
      // Gateway-level Upstash rate limiting was removed because it added
      // multi-second latency to normal user traffic across all brands.
      // Abuse controls now belong in:
      // 1. Cloudflare-native edge protections
      // 2. Service-level route-aware rate limiting
      await next();
  };
}
