import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import type { MiddlewareHandler } from 'hono';

import type { GatewayBindings } from '@/types';

type RatelimitEntry = {
  limiter: Ratelimit;
};

const limiterCache = new Map<string, RatelimitEntry>();

function getLimiter(env: GatewayBindings): Ratelimit {
  const cacheKey = `${env.UPSTASH_REDIS_REST_URL}:${env.UPSTASH_REDIS_REST_TOKEN}`;
  const existing = limiterCache.get(cacheKey);
  if (existing !== undefined) {
    return existing.limiter;
  }

  const limiter = new Ratelimit({
    redis: new Redis({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN }),
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    prefix: 'gateway:rl',
  });

  limiterCache.set(cacheKey, { limiter });
  return limiter;
}

export function createRateLimitMiddleware(): MiddlewareHandler {
  return async (c, next) => {
    try {
      if (c.req.method === 'OPTIONS') {
        await next();
        return;
      }

      if (
        typeof c.env.UPSTASH_REDIS_REST_URL !== 'string' ||
        c.env.UPSTASH_REDIS_REST_URL.length === 0 ||
        typeof c.env.UPSTASH_REDIS_REST_TOKEN !== 'string' ||
        c.env.UPSTASH_REDIS_REST_TOKEN.length === 0
      ) {
        await next();
        return;
      }

      const ip =
        c.req.header('CF-Connecting-IP') ??
        c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() ??
        'unknown';
      const { success, remaining, reset } = await getLimiter(c.env).limit(ip);

      if (!success) {
        return c.json(
          {
            error: 'Too many requests',
            requestId: c.get('requestId'),
            retryAfter: Math.max(1, Math.ceil((reset - Date.now()) / 1000)),
          },
          429,
        );
      }

      c.header('X-RateLimit-Remaining', String(remaining));
      await next();
    } catch (error) {
      console.error('Rate limit error:', error);
      await next();
    }
  };
}
