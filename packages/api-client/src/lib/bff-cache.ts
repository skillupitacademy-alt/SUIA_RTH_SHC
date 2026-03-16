import { NextResponse } from 'next/server';

export type BffCachePolicy = 'BFF_AGGREGATE' | 'BFF_PRIVATE' | 'BFF_NOCACHE';

const BFF_CACHE_POLICIES: Record<BffCachePolicy, string> = {
  BFF_AGGREGATE: 'public, max-age=60, s-maxage=300, stale-while-revalidate=60',
  BFF_PRIVATE: 'private, no-store',
  BFF_NOCACHE: 'no-store, no-cache, must-revalidate',
};

/**
 * Apply cache headers to a BFF response without depending on api-server utilities.
 */
export function applyBffCacheHeaders(
  response: NextResponse,
  policy: BffCachePolicy
): NextResponse {
  response.headers.set('Cache-Control', BFF_CACHE_POLICIES[policy]);

  if (policy === 'BFF_NOCACHE') {
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }

  if (policy === 'BFF_AGGREGATE') {
    response.headers.set('Vary', 'Accept-Encoding');
  } else if (policy === 'BFF_PRIVATE') {
    response.headers.set('Vary', 'Authorization, Cookie');
  }

  return response;
}
