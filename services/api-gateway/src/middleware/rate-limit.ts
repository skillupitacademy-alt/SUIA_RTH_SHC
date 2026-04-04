import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import type { MiddlewareHandler } from 'hono';

import type { GatewayBindings } from '@/types';

type RatelimitEntry = {
  limiter: Ratelimit;
};

const limiterCache = new Map<string, RatelimitEntry>();

const PUBLIC_SITE_HOSTS = new Set([
  'user.realtutorialhub.com',
  'admin.realtutorialhub.com',
  'user.skillupitacademy.com',
  'admin.skillupitacademy.com',
  'faculty.skillupitacademy.com',
  'quiz.skillhubcore.in',
  'tutorial.skillhubcore.in',
  'placement.skillhubcore.in',
]);

function shouldBypassRateLimit(url: URL): boolean {
  if (PUBLIC_SITE_HOSTS.has(url.hostname)) {
    return true;
  }

  return url.pathname === '/healthz'
    || url.pathname === '/internal/health'
    || url.pathname === '/api/health/live'
    || url.pathname === '/auth/login'
    || url.pathname === '/auth/signup'
    || url.pathname === '/auth/forgot-password'
    || url.pathname === '/auth/reset-password'
    || url.pathname === '/auth/resend-verification'
    || url.pathname === '/admin/auth/login'
    || url.pathname === '/search'
    || url.pathname === '/telemetry'
    || url.pathname === '/api/auth/login'
    || url.pathname === '/api/auth/signup'
    || url.pathname === '/api/auth/forgot-password'
    || url.pathname === '/api/auth/reset-password'
    || url.pathname === '/api/auth/resend-verification'
    || url.pathname === '/api/admin/auth/login'
    || url.pathname === '/api/search'
    || url.pathname === '/api/telemetry';
}

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

      if (shouldBypassRateLimit(new URL(c.req.url))) {
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
