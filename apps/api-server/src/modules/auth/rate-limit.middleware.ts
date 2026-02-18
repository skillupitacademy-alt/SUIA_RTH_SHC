import { type NextRequest, NextResponse } from 'next/server';

import { logger } from '@/lib/logger';
import { TokenService } from '@/modules/auth/token.service';
import { cacheService } from '@/modules/core/cache.service';

const WINDOW_MS = 15 * 60 * 1000;

// Tuned limits (admin flows generate more parallel calls)
const ADMIN_MAX_IP_REQUESTS = 5000;
const ADMIN_MAX_USER_REQUESTS = 8000;
const USER_MAX_IP_REQUESTS = 2000;
const USER_MAX_USER_REQUESTS = 4000;

export async function rateLimit(_request: NextRequest) {
  const rateLimitLogger = logger.child({ module: 'auth:rate-limit' });
  // Prefer real client IP headers (Cloudflare → Vercel)
  const ip =
    _request.headers.get('cf-connecting-ip') ??
    _request.headers.get('x-real-ip') ??
    _request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown';
  
  // 1. Resolve Scope & Auth (Absolute Isolation)
  const path = _request.nextUrl.pathname;
  let scope: 'admin' | '_user' | undefined;

  if (path.startsWith('/api/admin') || path.startsWith('/api/factory') || path === '/api/migrate') {
    scope = 'admin';
  } else if (path.startsWith('/api/quiz') || path.startsWith('/api/auth') || path.startsWith('/api/reports') || path.startsWith('/api/dashboard')) {
    scope = '_user';
  }

  const _token = scope ? TokenService.getAccessToken(_request, { scope }) : undefined;
  let userId: string | null = null;
  
  if (_token !== undefined && _token !== null && scope !== undefined) {
    try {
      const _payload = await TokenService.verifyAccessToken(_token, scope === 'admin');
      userId = _payload.userId;
    } catch {
      // Invalid _token, ignore _user-based limit
    }
  }

  // 2. Apply Limits
  try {
    const isAdminScope = scope === 'admin';
    const maxIp = isAdminScope ? ADMIN_MAX_IP_REQUESTS : USER_MAX_IP_REQUESTS;
    const maxUser = isAdminScope ? ADMIN_MAX_USER_REQUESTS : USER_MAX_USER_REQUESTS;

    // Tracking both IP and User (if present)
    const ipKey = `ratelimit:ip:${ip}`;
    const start = Date.now();
    const { count: ipCount, ttlRem: ipTtl } = await cacheService.increment(ipKey, WINDOW_MS);
    const duration = Date.now() - start;

    if (duration > 500) {
        rateLimitLogger.warn({ ip, duration, path }, 'Slow rate limit increment detected');
    }

    if (ipCount > maxIp) {
      rateLimitLogger.warn({ ip, path, count: ipCount }, 'IP Rate limit hit');
      return NextResponse.json(
        { _error: 'Too many requests' }, 
        { 
          status: 429,
          headers: { 'Retry-After': ipTtl.toString() }
        }
      );
    }

    if (userId !== null) {
      const userKey = `ratelimit:_user:${userId}`;
      const { count: userCount, ttlRem: userTtl } = await cacheService.increment(userKey, WINDOW_MS);

      if (userCount > maxUser) {
        return NextResponse.json(
          { _error: 'User rate limit exceeded' }, 
          { 
            status: 429,
            headers: { 'Retry-After': userTtl.toString() }
          }
        );
      }
    }
  } catch (_error: unknown) {
    rateLimitLogger.error(
      { error: _error instanceof Error ? _error.message : 'unknown error' },
      'Rate limit processing failed',
    );
    // Graceful fallback: Allow _request if limiter fails
  }

  return null;
}
