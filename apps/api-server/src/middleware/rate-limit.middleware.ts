import { NextRequest, NextResponse } from 'next/server';

interface RateLimitStore {
  count: number;
  resetAt: number;
}

const STORES = new Map<string, RateLimitStore>();

// 100 requests per minute by default
const DEFAULT_LIMIT = 100;
const WINDOW_MS = 60 * 1000;

/**
 * A "Vibe" Simple In-Memory Rate Limiter.
 * Strictly for protecting against basic automated abuse.
 * WARNING: This is NOT distributed/Redis-backed. Individual server instances have their own counters.
 */
export function withRateLimit<TContext = unknown>(
  handler: (req: NextRequest, context: TContext) => Promise<Response> | Response,
  options: { limit?: number; windowMs?: number } = {}
) {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const windowMs = options.windowMs ?? WINDOW_MS;

  return async (req: NextRequest, context: TContext): Promise<Response> => {
    // Determine key: prioritize x-real-ip or x-forwarded-for, fallback to 'global'
    const key = req.headers.get('x-real-ip') ?? 
                req.headers.get('x-forwarded-for')?.split(',')[0] ?? 
                'anonymous-vibe';

    const now = Date.now();
    let entry = STORES.get(key);

    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
    }

    entry.count++;
    STORES.set(key, entry);

    if (entry.count > limit) {
      return NextResponse.json(
        { error: 'Too Many Requests', message: 'Rate limit exceeded. Please try again later.' },
        { 
          status: 429, 
          headers: { 
            'retry-after': Math.ceil((entry.resetAt - now) / 1000).toString(),
            'x-ratelimit-limit': limit.toString(),
            'x-ratelimit-remaining': '0',
            'x-ratelimit-reset': entry.resetAt.toString()
          } 
        }
      );
    }

    const response = await handler(req, context);
    
    // Echo rate limit headers on success
    response.headers.set('x-ratelimit-limit', limit.toString());
    response.headers.set('x-ratelimit-remaining', (limit - entry.count).toString());
    response.headers.set('x-ratelimit-reset', entry.resetAt.toString());

    return response;
  };
}

// Cleanup interval to prevent memory leaks in long-running processes (dev/preview)
if (typeof global !== 'undefined') {
  const CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of STORES.entries()) {
      if (now > entry.resetAt) {
        STORES.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);
}
