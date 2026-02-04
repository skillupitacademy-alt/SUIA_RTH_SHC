import { NextRequest, NextResponse } from 'next/server';
import { TokenService } from './token.service';
import { cacheService } from '../core/cache.service';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_IP_REQUESTS = 1000;
const MAX_USER_REQUESTS = 2000;

export async function rateLimit(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  
  // 1. Resolve Auth (Standard + Admin)
  const token = TokenService.getAccessToken(request);
  let userId: string | null = null;
  
  if (token) {
    try {
      const payload = await TokenService.verifyAccessToken(token);
      userId = payload.userId;
    } catch {
      // Invalid token, ignore user-based limit
    }
  }

  // 2. Apply Limits
  try {
    // Tracking both IP and User (if present)
    const ipKey = `ratelimit:ip:${ip}`;
    const { count: ipCount, ttlRem: ipTtl } = await cacheService.increment(ipKey, WINDOW_MS);

    if (ipCount > MAX_IP_REQUESTS) {
      return NextResponse.json(
        { error: 'Too many requests' }, 
        { 
          status: 429,
          headers: { 'Retry-After': ipTtl.toString() }
        }
      );
    }

    if (userId) {
      const userKey = `ratelimit:user:${userId}`;
      const { count: userCount, ttlRem: userTtl } = await cacheService.increment(userKey, WINDOW_MS);

      if (userCount > MAX_USER_REQUESTS) {
        return NextResponse.json(
          { error: 'User rate limit exceeded' }, 
          { 
            status: 429,
            headers: { 'Retry-After': userTtl.toString() }
          }
        );
      }
    }
  } catch (error) {
    console.error('[RateLimit] Error processing limits:', error);
    // Graceful fallback: Allow request if limiter fails
  }

  return null;
}
