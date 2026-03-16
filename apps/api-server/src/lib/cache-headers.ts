import { NextResponse } from 'next/server';

export type CachePolicy = 'IMMUTABLE' | 'SESSION' | 'DYNAMIC' | 'BFF_AGGREGATE';

const CACHE_POLICIES: Record<CachePolicy, string> = {
  IMMUTABLE: 'public, max-age=31536000, immutable',
  SESSION: 'private, no-cache, max-age=0, must-revalidate',
  DYNAMIC: 'no-store, no-cache, must-revalidate, proxy-revalidate',
  BFF_AGGREGATE: 'public, max-age=60, s-maxage=300, stale-while-revalidate=60',
};

/** Apply cache headers to a generic Headers object (tests use this). */
export function applyCacheHeaders(headers: Headers, policy: CachePolicy): void {
  headers.set('Cache-Control', CACHE_POLICIES[policy]);
  if (policy === 'DYNAMIC') {
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
  }
  if (policy === 'SESSION') {
    headers.set('Vary', 'Authorization, Cookie');
  } else if (policy === 'IMMUTABLE' || policy === 'BFF_AGGREGATE') {
    headers.set('Vary', 'Accept-Encoding');
  }
}

/**
 * Standardized Cache-Control header utility for API responses.
 */
export function withCacheHeaders(response: NextResponse, policy: CachePolicy): NextResponse {
  applyCacheHeaders(response.headers, policy);
  return response;
}
