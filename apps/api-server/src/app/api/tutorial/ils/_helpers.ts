/**
 * Phase 2.6-A4: ILS API Helpers
 * 
 * DEPRECATED: extractAuthenticatedIdentity() is no longer used.
 * 
 * ILS routes now use validateRequest() from internal-auth.middleware.ts
 * which validates X-Internal-Secret before trusting identity headers.
 * 
 * This file is retained for reference but the helper function should not
 * be used for new authentication boundaries.
 */

import type { AuthenticatedIdentity } from '@quiz/db-tutorial';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * @deprecated Use validateRequest() from internal-auth.middleware.ts instead.
 * 
 * This helper reads identity headers but does NOT validate authentication.
 * It should not be used as a security boundary.
 */
export function extractAuthenticatedIdentity(
  request: NextRequest
): { identity: AuthenticatedIdentity } | { error: NextResponse } {
  const userId = request.headers.get('x-user-id');
  const brand = request.headers.get('x-brand');

  if (!userId || userId.trim() === '') {
    return {
      error: NextResponse.json(
        { error: 'User ID required' },
        { status: 401 }
      ),
    };
  }

  if (!brand || brand.trim() === '') {
    return {
      error: NextResponse.json(
        { error: 'Brand context required' },
        { status: 400 }
      ),
    };
  }

  // Validate brand
  const normalizedBrand = brand.toLowerCase().trim();
  if (normalizedBrand !== 'realtutorialhub' && normalizedBrand !== 'skillup') {
    return {
      error: NextResponse.json(
        { error: 'Invalid brand' },
        { status: 400 }
      ),
    };
  }

  // Optional session ID from headers
  const sessionId = request.headers.get('x-session-id') || undefined;

  const identity: AuthenticatedIdentity = {
    userId: userId.trim(),
    brand: normalizedBrand,
    sessionId,
  };

  return { identity };
}
