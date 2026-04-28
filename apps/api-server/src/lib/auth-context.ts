import type { NextRequest } from 'next/server';

import type { RequestBrand } from '@/lib/request-brand';
import { validateRequest } from '@/middleware/internal-auth.middleware';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';

/**
 * 🔐 CANONICAL ROLE NORMALIZER (STRICT UNIFICATION)
 * 
 * Handles:
 * - String: "user,student" → ["user"]
 * - Array: ["user"] → ["user"]
 * - Invalid: null, undefined → []
 * 
 * STRICT UNIFICATION RULE:
 * - Any of ["user"] → ['user'] (NO OTHER ROLES)
 * - This enforces single-role system for both brands
 * 
 * This makes both brands behave identically without DB migration.
 */
export function canonicalizeRoles(input: unknown): string[] {
  let roles: string[] = [];
  
  // Parse input (string or array)
  if (typeof input === 'string') {
    roles = input
      .split(',')
      .map(r => r.trim().toLowerCase())
      .filter(Boolean);
  } else if (Array.isArray(input)) {
    roles = input
      .map(r => String(r).trim().toLowerCase())
      .filter(Boolean);
  }
  
  // 🔥 STRICT UNIFICATION: user + student → user (ONLY)
  // No spreading, no merging, no hybrid state
  if (roles.includes('user') || roles.includes("user")) {
    return ['user'];
  }
  
  // Keep other roles as-is (admin, faculty, super_admin)
  return roles.filter(Boolean);
}

/**
 * 🔐 UNIFIED AUTH CONTEXT
 * 
 * Single source of truth for authentication across all API routes.
 * Combines internal service auth, gateway auth, and JWT fallback.
 * 
 * Returns null if authentication fails.
 */

export interface AuthContext {
  userId: string;
  brand: RequestBrand;
  correlationId: string;
  source: 'internal' | 'gateway' | 'jwt';
  email?: string;
  roles?: string[]; // 🔥 ADD: Roles for RBAC
}

export async function getAuthContext(req: NextRequest): Promise<AuthContext | null> {
  const requestCorrelationId = req.headers.get('x-correlation-id');
  const correlationId = (typeof requestCorrelationId === 'string' && requestCorrelationId.trim() !== '') 
    ? requestCorrelationId 
    : crypto.randomUUID();

  // Try internal/gateway authentication first (fastest)
  const authResult = validateRequest(req);
  
  if (authResult.context !== undefined) {
    // 🔐 STEP 1: Extract raw roles from context
    const rawRoles = authResult.context.roles;
    
    // 🔐 STEP 2: Canonicalize roles (unifies user+student → user)
    const roles = canonicalizeRoles(rawRoles);
    
    // 🔐 HARD GUARD (NO SILENT FAIL)
    if (roles.length === 0) {
      console.error('🚨 RBAC_ERROR: No valid roles found in gateway/internal auth', {
        rawRoles,
        correlationId,
      });
      // Don't throw - let it fall through to JWT auth
    } else {
      // 🔐 DEBUG (can remove later if needed)
      console.log('🔐 RBAC_CONTEXT[GATEWAY]', {
        roles,
        rawRoles,
        canonicalized: true,
        correlationId,
      });
      
      return {
        userId: authResult.context.userId,
        brand: authResult.context.brand as RequestBrand,
        correlationId: authResult.context.correlationId,
        source: authResult.context.authMode,
        email: authResult.context.userEmail,
        roles, // 🔥 CANONICAL: Always unified to ['user'] for both brands
      };
    }
  }

  // Fallback to JWT authentication
  try {
    const token = container.get(TokenService).getAccessToken(req, { scope: 'user' });
    
    if (typeof token !== 'string' || token.trim().length === 0) {
      console.log(`[AUTH][${correlationId}] No token found`);
      return null;
    }

    const payload = await container.get(TokenService).verifyUserAccessToken(token);
    
    if (payload === null || typeof payload.userId !== 'string' || payload.userId.length === 0) {
      console.log(`[AUTH][${correlationId}] Invalid token payload`);
      return null;
    }

    // 🔐 STEP 1: Extract raw roles from JWT
    const rawJwtRoles = payload.roles;
    
    // 🔐 STEP 2: Canonicalize roles (unifies user+student → user)
    const roles = canonicalizeRoles(rawJwtRoles);
    
    // 🔐 HARD GUARD (NO SILENT FAIL)
    if (roles.length === 0) {
      console.error('🚨 RBAC_ERROR: No valid roles found in JWT', {
        rawJwtRoles,
        correlationId,
      });
      throw new Error('INVALID_ROLES: No valid roles in JWT');
    }
    
    // 🔐 DEBUG (can remove later if needed)
    console.log('🔐 RBAC_CONTEXT[JWT]', {
      roles,
      rawJwtRoles,
      canonicalized: true,
      correlationId,
    });

    return {
      userId: payload.userId,
      brand: (payload.brand as RequestBrand) || 'realtutorialhub',
      correlationId,
      source: 'jwt',
      email: payload.email,
      roles, // 🔥 CANONICAL: Always unified to ['user'] for both brands
    };
  } catch (error) {
    console.error(`[AUTH][${correlationId}] JWT validation failed:`, error);
    return null;
  }
}
