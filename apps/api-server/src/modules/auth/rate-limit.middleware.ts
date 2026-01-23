import { NextRequest, NextResponse } from 'next/server';

const cache = new Map<string, { count: number; expires: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 100;

export async function rateLimit(request: NextRequest) {
  // Use X-Forwarded-For or a fallback for local dev
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
  const now = Date.now();
  
  const record = cache.get(ip);
  if (!record || now > record.expires) {
    cache.set(ip, { count: 1, expires: now + WINDOW_MS });
    return null;
  }
  
  if (record.count >= MAX_REQUESTS) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  
  record.count++;
  return null;
}
