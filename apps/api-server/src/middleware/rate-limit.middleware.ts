import { NextRequest, NextResponse } from 'next/server';

import { cacheService } from '@/modules/core/cache.service';

// 100 requests per minute by default
const DEFAULT_LIMIT = 100;
const WINDOW_MS = 60 * 1000;

/**
 * A Distributed Rate Limiter powered by Redis (Upstash).
 * Falls back to in-memory if Redis is unavailable.
 */
export function withRateLimit<TContext = unknown>(
  handler: (req: NextRequest, context: TContext) => Promise<Response> | Response,
  options: { limit?: number; windowMs?: number; keyPrefix?: string } = {}
) {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const windowMs = options.windowMs ?? WINDOW_MS;
  const prefix = options.keyPrefix ?? 'ratelimit:vibe';

  return async (req: NextRequest, context: TContext): Promise<Response> => {
    // Determine key: prioritize x-real-ip or x-forwarded-for, fallback to 'anonymous'
    const ip = req.headers.get('x-real-ip') ?? 
               req.headers.get('x-forwarded-for')?.split(',')[0] ?? 
               'anonymous';
    
    const key = `${prefix}:${ip}`;

    try {
      const { count, ttlRem } = await cacheService.increment(key, windowMs);

      if (count > limit) {
        return NextResponse.json(
          { error: 'Too Many Requests', message: 'Rate limit exceeded. Please try again later.' },
          { 
            status: 429, 
            headers: { 
              'retry-after': ttlRem.toString(),
              'x-ratelimit-limit': limit.toString(),
              'x-ratelimit-remaining': '0',
              'x-ratelimit-reset': (Date.now() + ttlRem * 1000).toString()
            } 
          }
        );
      }

      const response = await handler(req, context);
      
      // Echo rate limit headers on success
      response.headers.set('x-ratelimit-limit', limit.toString());
      response.headers.set('x-ratelimit-remaining', Math.max(0, limit - count).toString());
      response.headers.set('x-ratelimit-reset', (Date.now() + ttlRem * 1000).toString());

      return response;
    } catch {
      // Graceful fallback if cacheService fails entirely
      return handler(req, context);
    }
  };
}
