import { NextRequest } from 'next/server';
import { TokenService } from '@quiz/auth';
import type { Brand } from '@quiz/types';
import { isSupportedBrand } from '@quiz/types';

/**
 * 🔥 UNIFIED BFF AUTH - SINGLE SOURCE OF TRUTH
 * 
 * Standardizes how ALL BFF routes:
 * - Read cookies
 * - Validate JWT
 * - Extract identity
 * - Send internal headers
 * - RBAC permission checking (Integration pending - Step 1C)
 */

export interface BffAuthResult {
  isAuthenticated: boolean;
  userId?: string;
  email?: string;
  brand?: Brand;
  roles?: Role[]; // 🔥 TYPE SAFETY: Use typed roles
  accessToken?: string;
  shadowUserId?: string;
  originalUserId?: string;
}

/**
 * 🔥 CRITICAL: Normalize roles to prevent security bypass
 * ALL ROLES MUST BE LOWERCASE AND DEDUPLICATED
 * 
 * This fixes the USER vs user security vulnerability where:
 * - JWT contains: ["USER", "STUDENT"] 
 * - Code checks: roles.includes('student') → FAILS
 * - Result: Access denied incorrectly OR granted incorrectly
 */

// 🔥 TYPE SAFETY: Define valid roles for RBAC preparation
// NOTE: 'user' kept in type for backward compatibility during transition, but 'student' is canonical
export type Role = 'user' | 'student' | 'admin' | 'super_admin' | 'faculty';

const VALID_ROLES: Set<Role> = new Set(['user', 'student', 'admin', 'super_admin', 'faculty']);

function normalizeRoles(roles: string[] = []): Role[] {
  const normalized = roles
    .map(role => role.toLowerCase().trim())
    .filter(role => role.length > 0)
    // 🔥 UNIFY: Convert 'user' → 'student' for canonical role
    .map(role => role === 'user' ? 'student' : role);
  
  // 🚨 SECURITY AUDIT: Log non-normalized roles for monitoring (dev only)
  const hasUppercase = roles.some(role => role !== role.toLowerCase());
  const hasDuplicates = roles.length !== new Set(roles.map(r => r.toLowerCase())).size;
  
  if ((hasUppercase || hasDuplicates) && process.env.NODE_ENV !== 'production') {
    console.warn('⚠️ SECURITY: Role normalization violation detected', JSON.stringify({
      tag: 'ROLE_NORMALIZATION_VIOLATION',
      original: roles,
      normalized,
      hasUppercase,
      hasDuplicates,
      timestamp: new Date().toISOString(),
    }));
  }
  
  // 🔒 SECURITY: Filter out unknown roles (reject unknown roles for security)
  const validRoles = normalized.filter((role): role is Role => VALID_ROLES.has(role as Role));
  
  // 🚨 SECURITY: Log unknown roles (dev only)
  const unknownRoles = normalized.filter(role => !VALID_ROLES.has(role as Role));
  if (unknownRoles.length > 0 && process.env.NODE_ENV !== 'production') {
    console.warn('⚠️ SECURITY: Unknown roles detected and filtered', JSON.stringify({
      tag: 'UNKNOWN_ROLES_FILTERED',
      unknown: unknownRoles,
      valid: validRoles,
      timestamp: new Date().toISOString(),
    }));
  }
  
  // Deduplicate (USER + user = user)
  return [...new Set(validRoles)];
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
    // 📊 OBSERVABILITY: Log missing token
    console.log(JSON.stringify({
      tag: 'AUTH_FLOW',
      action: 'extract_auth',
      result: 'no_token',
      path: req.nextUrl.pathname,
    }));
    return { isAuthenticated: false };
  }

  try {
    // Use TokenService for proper JWT validation
    const payload = await TokenService.verifyUserAccessToken(accessToken, { audience: 'user' });
    
    // Extract identity claims
    const shadowUserId = payload.shadowUserId;
    const originalUserId = payload.originalUserId;
    
    // 🔥 RUNTIME VALIDATION: Validate brand from JWT claims
    // JWT is untrusted runtime data - validate instead of asserting
    const rawBrand = payload.brand;
    const brand =
      typeof rawBrand === 'string' && isSupportedBrand(rawBrand)
        ? rawBrand
        : undefined;
    
    // 🔥 CRITICAL FIX: Normalize roles immediately to prevent security bypass
    const rawRoles = Array.isArray(payload.roles) ? payload.roles : [];
    const normalizedRoles = normalizeRoles(rawRoles);

    if (!shadowUserId || !originalUserId) {
      console.warn('[BFF_AUTH] Missing identity claims in token');
      console.log(JSON.stringify({
        tag: 'AUTH_FLOW',
        action: 'extract_auth',
        result: 'missing_identity',
        path: req.nextUrl.pathname,
      }));
      return { isAuthenticated: false };
    }

    // 📊 OBSERVABILITY: Log successful auth extraction with normalized roles
    console.log(JSON.stringify({
      tag: 'AUTH_FLOW',
      action: 'extract_auth',
      result: 'success',
      brand,
      originalUserId: originalUserId.slice(0, 8),
      shadowUserId: shadowUserId.slice(0, 8),
      rawRoles,
      normalizedRoles,
      path: req.nextUrl.pathname,
    }));

    return {
      isAuthenticated: true,
      userId: shadowUserId,
      email: payload.email,
      brand: brand || 'realtutorialhub', // 🔥 COMPATIBILITY: Preserve existing RTH fallback
      roles: normalizedRoles, // ✅ Always normalized and deduplicated
      accessToken,
      shadowUserId,
      originalUserId,
    };
  } catch (error) {
    console.warn('[BFF_AUTH] Token validation failed:', error instanceof Error ? error.message : 'Unknown error');
    // 📊 OBSERVABILITY: Log validation failure
    console.log(JSON.stringify({
      tag: 'AUTH_FLOW',
      action: 'extract_auth',
      result: 'validation_failed',
      error: error instanceof Error ? error.message : 'Unknown',
      path: req.nextUrl.pathname,
    }));
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

  // 📊 OBSERVABILITY: Log header creation
  console.log(JSON.stringify({
    tag: 'AUTH_FLOW',
    action: 'create_internal_headers',
    brand: auth.brand,
    originalUserId: auth.originalUserId.slice(0, 8),
    shadowUserId: auth.shadowUserId.slice(0, 8),
    hasSecret: !!internalSecret,
  }));

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

// ========================================
// 🔐 RBAC INTEGRATION HELPERS (STEP 1C)
// ========================================
// RBAC integration will be added in Step 1C to avoid circular dependencies