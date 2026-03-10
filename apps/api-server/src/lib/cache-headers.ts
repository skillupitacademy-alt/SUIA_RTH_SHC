import { NextResponse } from 'next/server';

export type CachePolicy = 'static' | 'moderate' | 'private' | 'none';

const CACHE_POLICIES: Record<CachePolicy, string> = {
  static: 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=3600',
  moderate: 'public, max-age=60, s-maxage=300, stale-while-revalidate=60',
  private: 'private, max-age=60',
  none: 'no-cache, no-store, must-revalidate',
};

/**
 * Standardized Cache-Control header utility for Phase 3 Scale Preparation.
 */
export function withCacheHeaders(response: NextResponse, policy: CachePolicy): NextResponse {
  const headerValue = CACHE_POLICIES[policy];
  
  response.headers.set('Cache-Control', headerValue);
  
  // Ensure that personalized responses are not cached by CDNs for the wrong user
  if (policy === 'private') {
    response.headers.set('Vary', 'Authorization, Cookie');
  } else if (policy !== 'none') {
    response.headers.set('Vary', 'Accept-Encoding, Authorization');
  }

  return response;
}
