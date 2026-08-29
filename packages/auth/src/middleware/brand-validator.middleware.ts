/**
 * 🔐 BRAND VALIDATION MIDDLEWARE - DEFENSE IN DEPTH
 * 
 * Re-validates brand at API server level (don't trust gateway alone)
 * 
 * CRITICAL: This prevents cross-brand access if gateway is bypassed
 */

import type { NextRequest } from 'next/server';
import type { Brand } from '@quiz/types';
import { resolveBrandFromHostname, isSupportedBrand } from '@quiz/types';

/**
 * @deprecated Use `Brand` from '@quiz/types' instead
 * Retained for backward compatibility only
 */
export type BrandId = Brand;

export interface BrandValidationContext {
  tokenBrand: Brand;
  hostnameBrand: Brand;
  requestBrand?: Brand;
}

/**
 * 🔥 CRITICAL: Validate brand consistency
 * 
 * Ensures:
 * 1. Token brand matches hostname-derived brand
 * 2. Explicit brand header (if present) matches token
 * 3. No cross-brand access attempts
 */
export function validateBrandContext(
  tokenBrand: string | undefined,
  req: NextRequest
): BrandValidationContext {
  const hostname = new URL(req.url).hostname;
  const resolvedBrand = resolveBrandFromHostname(hostname);
  
  // Extract explicit brand from headers
  const brandHeader = req.headers.get('x-brand') || req.headers.get('x-platform');
  const requestBrand: Brand | undefined = brandHeader && isSupportedBrand(brandHeader)
    ? brandHeader
    : undefined;
  
  // Normalize and validate token brand
  const normalizedTokenValue = typeof tokenBrand === 'string' && tokenBrand.trim().length > 0
    ? tokenBrand.trim().toLowerCase()
    : undefined;
  
  // 🔥 VALIDATION 0: Token brand must be a valid Brand
  if (!normalizedTokenValue || !isSupportedBrand(normalizedTokenValue)) {
    throw new BrandValidationError('Token missing or invalid brand claim', {
      hostnameBrand: resolvedBrand,
      requestBrand,
    });
  }
  
  const normalizedTokenBrand: Brand = normalizedTokenValue;
  
  // 🔥 VALIDATION 1: Hostname must resolve to a known brand
  if (!resolvedBrand) {
    throw new BrandValidationError('Hostname does not resolve to a valid brand', {
      tokenBrand: normalizedTokenBrand,
      requestBrand,
    });
  }
  
  // After this point, resolvedBrand is definitely Brand (not undefined)
  const hostnameBrand: Brand = resolvedBrand;
  
  // 🔥 VALIDATION 2: Token brand must match hostname brand
  if (normalizedTokenBrand !== hostnameBrand) {
    throw new BrandValidationError(
      `Brand mismatch: token=${normalizedTokenBrand}, hostname=${hostnameBrand}`,
      {
        tokenBrand: normalizedTokenBrand,
        hostnameBrand,
        requestBrand,
      }
    );
  }
  
  // 🔥 VALIDATION 3: Explicit brand header (if present) must match token
  if (requestBrand && requestBrand !== normalizedTokenBrand) {
    throw new BrandValidationError(
      `Brand header mismatch: header=${requestBrand}, token=${normalizedTokenBrand}`,
      {
        tokenBrand: normalizedTokenBrand,
        hostnameBrand,
        requestBrand,
      }
    );
  }
  
  // ✅ All validations passed
  return {
    tokenBrand: normalizedTokenBrand,
    hostnameBrand,
    requestBrand,
  };
}

/**
 * 🔐 Brand Validation Error
 */
export class BrandValidationError extends Error {
  constructor(
    message: string,
    public context: {
      tokenBrand?: Brand;
      hostnameBrand?: Brand;
      requestBrand?: Brand;
    }
  ) {
    super(message);
    this.name = 'BrandValidationError';
  }
}

/**
 * 🔥 MIDDLEWARE: Enforce brand validation on all routes
 * 
 * Usage:
 * ```typescript
 * export async function GET(req: NextRequest) {
 *   const auth = await extractAuthFromRequest(req);
 *   enforceBrandValidation(auth, req); // ✅ Add this line
 *   // ... rest of handler
 * }
 * ```
 */
export function enforceBrandValidation(
  auth: { brand?: string; userId?: string },
  req: NextRequest
): BrandValidationContext {
  try {
    const context = validateBrandContext(auth.brand, req);
    
    // 📊 Log successful validation
    console.log(JSON.stringify({
      tag: 'BRAND_VALIDATION',
      result: 'ALLOWED',
      userId: auth.userId?.slice(0, 8),
      tokenBrand: context.tokenBrand,
      hostnameBrand: context.hostnameBrand,
      path: new URL(req.url).pathname,
    }));
    
    return context;
  } catch (error) {
    // 🚨 Log validation failure
    console.error(JSON.stringify({
      tag: 'BRAND_VALIDATION',
      result: 'DENIED',
      userId: auth.userId?.slice(0, 8),
      error: error instanceof Error ? error.message : 'Unknown error',
      path: new URL(req.url).pathname,
    }));
    
    throw error;
  }
}

/**
 * 🔥 WRAPPER: Enforce brand validation with automatic error handling
 * 
 * Usage:
 * ```typescript
 * export const GET = withBrandValidation(async (req, auth) => {
 *   // auth.brand is guaranteed valid here
 *   return NextResponse.json({ data: 'safe' });
 * });
 * ```
 */
export function withBrandValidation<T = any>(
  handler: (req: NextRequest, auth: any, brandContext: BrandValidationContext) => Promise<Response>
) {
  return async (req: NextRequest, context?: T): Promise<Response> => {
    try {
      // Extract auth (assumes extractAuthFromRequest is available)
      const auth = (req as any).auth || context;
      
      if (!auth) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized', reason: 'missing_auth' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      // Validate brand
      const brandContext = enforceBrandValidation(auth, req);
      
      // Call handler with validated context
      return handler(req, auth, brandContext);
    } catch (error) {
      if (error instanceof BrandValidationError) {
        return new Response(
          JSON.stringify({
            error: 'Forbidden',
            reason: 'brand_mismatch',
            message: error.message,
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      throw error;
    }
  };
}
