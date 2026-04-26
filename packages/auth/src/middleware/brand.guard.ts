/**
 * 🔐 BRAND VALIDATION GUARD - DEFENSE IN DEPTH
 * 
 * Re-validates brand at API server level (don't trust gateway alone)
 * Used by ALL shared API routes serving both RTH + Skillup
 */

import type { NextRequest } from 'next/server';

/**
 * 🔥 CRITICAL: Validate brand consistency
 * 
 * Uses X-Brand header from gateway (source of truth)
 * 
 * Throws if:
 * - Missing X-Brand header from gateway
 * - Token missing brand claim
 * - Token brand doesn't match gateway brand
 * 
 * @throws Error with specific failure reason
 */
export function validateBrandOrThrow(auth: any, req: NextRequest): void {
  const headerBrand = req.headers.get('x-brand');
  
  // 🔥 HARD FAIL if gateway didn't send brand
  if (!headerBrand) {
    console.error('[BRAND_GUARD] Missing X-Brand header', {
      path: req.nextUrl.pathname,
      userId: auth?.userId?.slice(0, 8),
    });
    throw new Error('Missing brand header from gateway');
  }
  
  // 🔥 Token must have brand claim
  if (!auth?.brand) {
    console.error('[BRAND_GUARD] Missing brand in token', {
      userId: auth?.userId?.slice(0, 8),
      headerBrand,
      path: req.nextUrl.pathname,
    });
    throw new Error('Missing brand in token');
  }
  
  // 🔥 STRICT MATCH (source of truth = gateway X-Brand header)
  if (auth.brand !== headerBrand) {
    console.error('[BRAND_MISMATCH]', {
      tokenBrand: auth.brand,
      headerBrand,
      userId: auth.userId?.slice(0, 8),
      path: req.nextUrl.pathname,
    });
    throw new Error('Forbidden: Brand mismatch');
  }
  
  // ✅ Validation passed - log success
  console.log('[BRAND_GUARD] Validated', {
    brand: auth.brand,
    userId: auth.userId?.slice(0, 8),
    path: req.nextUrl.pathname,
  });
}
