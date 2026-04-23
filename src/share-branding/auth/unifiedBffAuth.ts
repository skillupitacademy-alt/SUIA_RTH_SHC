import { NextRequest } from 'next/server';
import { TokenService } from '@quiz/auth';

/**
 * 🔥 UNIFIED BFF AUTH - SINGLE SOURCE OF TRUTH
 * 
 * Standardizes how ALL BFF routes:
 * - Read cookies
 * - Validate JWT
 * - Extract identity
 * - Send internal headers
 */

export interface BffAuthResult {
  isAuthenticated: boolean;
  userId?: string;
  email?: string;
  brand?: 'realtutorialhub' | 'skillup';
  roles?: string[];
  accessToken?: string;
  shadowUserId?: string;
  originalUserId?: string;
}

/**
 * Extract and validate authentication from request
 * Replaces all custom cookie parsing and JWT decoding
 */
export async function extractAuthFromRequest(req: NextRequest): Promise<BffAuthResult> {
  const cookieHeader = req.headers.get('cookie') || '';
  
  // Extract accessToken from cookies
  const accessToken = cookieHeader
    .split('; ')
    .find(c => c.startsWith('accessToken='))
    ?.split('=')[1];

  if (!accessToken) {
    return { isAuthenticated: false };
  }

  try {
    // Use TokenService for proper JWT validation
    const payload = await TokenService.verifyUserAccessToken(accessToken, { audience: 'user' });
    
    // Extract identity claims
    const shadowUserId = payload.shadowUserId;
    const originalUserId = payload.originalUserId;
    const brand = payload.brand as 'realtutorialhub' | 'skillup' | undefined;
    const roles = Array.isArray(payload.roles) ? payload.roles : [];

    if (!shadowUserId || !originalUserId) {
      console.warn('[BFF_AUTH] Missing identity claims in token');
      return { isAuthenticated: false };
    }

    return {
      isAuthenticated: true,
      userId: shadowUserId,
      email: payload.email,
      brand: brand || 'realtutorialhub', // fallback
      roles,
      accessToken,
      shadowUserId,
      originalUserId,
    };
  } catch (error) {
    console.warn('[BFF_AUTH] Token validation failed:', error instanceof Error ? error.message : 'Unknown error');
    return { isAuthenticated: false };
  }
}

/**
 * Create standardized internal headers for API calls
 * Replaces inconsistent header creation across BFF routes
 */
export function createInternalHeaders(auth: BffAuthResult): Record<string, string> {
  if (!auth.isAuthenticated || !auth.userId || !auth.shadowUserId || !auth.originalUserId) {
    throw new Error('Cannot create internal headers for unauthenticated request');
  }

  const internalSecret = process.env.INTERNAL_API_SECRET;
  if (!internalSecret) {
    throw new Error('INTERNAL_API_SECRET not configured');
  }

  // 🔥 FIX: Use originalUserId as the primary user ID for database queries
  // The shadowUserId is only for specific shadow user scenarios
  // The database profiles are stored under originalUserId
  return {
    'x-user-id': auth.originalUserId,  // ✅ FIXED: Use originalUserId for database queries
    'x-shadow-user-id': auth.shadowUserId,
    'x-original-user-id': auth.originalUserId,
    'x-brand': auth.brand || 'realtutorialhub',
    'x-internal-secret': internalSecret,
    'content-type': 'application/json',
  };
}

/**
 * Get brand from request hostname (fallback for brand detection)
 */
export function getBrandFromHostname(req: NextRequest): 'realtutorialhub' | 'skillup' {
  const hostname = req.headers.get('host') || req.nextUrl.hostname;
  return hostname.includes('skillup') ? 'skillup' : 'realtutorialhub';
}

/**
 * Unified error responses for consistency
 */
export const BffAuthErrors = {
  unauthorized: () => new Response(
    JSON.stringify({ error: 'Unauthorized', message: 'Please log in' }), 
    { status: 401, headers: { 'content-type': 'application/json' } }
  ),
  
  forbidden: () => new Response(
    JSON.stringify({ error: 'Forbidden', message: 'Access denied' }), 
    { status: 403, headers: { 'content-type': 'application/json' } }
  ),
  
  internalError: (message = 'Internal server error') => new Response(
    JSON.stringify({ error: 'Internal Server Error', message }), 
    { status: 500, headers: { 'content-type': 'application/json' } }
  ),
};

/**
 * Helper for common BFF auth pattern
 * Use this in BFF routes to replace custom auth logic
 */
export async function requireBffAuth(req: NextRequest): Promise<BffAuthResult | Response> {
  const auth = await extractAuthFromRequest(req);
  
  if (!auth.isAuthenticated) {
    return BffAuthErrors.unauthorized();
  }
  
  return auth;
}