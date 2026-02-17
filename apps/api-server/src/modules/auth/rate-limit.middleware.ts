import { type NextRequest, NextResponse } from 'next/server';

import { logger } from '../../lib/logger';
import { cacheService } from '../core/cache.service';
import { TokenService } from './token.service';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_IP_REQUESTS = 1000;
const MAX_USER_REQUESTS = 2000;

export async function rateLimit(_request: NextRequest) {
  const rateLimitLogger = logger.child({ module: 'auth:rate-limit' });
  const ip = _request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  
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
    // Tracking both IP and User (if present)
    const ipKey = `ratelimit:ip:${ip}`;
    const { count: ipCount, ttlRem: ipTtl } = await cacheService.increment(ipKey, WINDOW_MS);

    if (ipCount > MAX_IP_REQUESTS) {
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

      if (userCount > MAX_USER_REQUESTS) {
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
