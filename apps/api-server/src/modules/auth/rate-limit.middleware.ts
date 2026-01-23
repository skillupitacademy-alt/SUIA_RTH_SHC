import { NextRequest, NextResponse } from 'next/server';
import { TokenService } from './token.service';

const cache = new Map<string, { count: number; expires: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_IP_REQUESTS = 100;
const MAX_USER_REQUESTS = 500; // Users get higher limits than raw IPs

export async function rateLimit(request: NextRequest) {
  const now = Date.now();
  
  // 1. IP Tracking
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
  const ipRecord = cache.get(`ip:${ip}`);
  
  if (ipRecord && now < ipRecord.expires && ipRecord.count >= MAX_IP_REQUESTS) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  // 2. User Tracking (Authenticated Throttling)
  const token = request.cookies.get('accessToken')?.value;
  let userId = null;
  
  if (token) {
    try {
      const payload = TokenService.verifyAccessToken(token);
      userId = payload.userId;
    } catch {
      // Invalid token, ignore user-based limit
    }
  }

  if (userId) {
    const userRecord = cache.get(`user:${userId}`);
    if (userRecord && now < userRecord.expires && userRecord.count >= MAX_USER_REQUESTS) {
      return NextResponse.json({ error: 'User rate limit exceeded' }, { status: 429 });
    }
    
    // Update user cache
    const current = userRecord && now < userRecord.expires ? userRecord.count : 0;
    cache.set(`user:${userId}`, { count: current + 1, expires: userRecord?.expires || now + WINDOW_MS });
  }

  // Update IP cache
  const ipCurrent = ipRecord && now < ipRecord.expires ? ipRecord.count : 0;
  cache.set(`ip:${ip}`, { count: ipCurrent + 1, expires: ipRecord?.expires || now + WINDOW_MS });

  return null;
}
