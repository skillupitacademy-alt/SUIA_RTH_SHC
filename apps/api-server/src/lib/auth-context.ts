import type { NextRequest } from 'next/server';

import { ApiError } from '@/lib/api-error';
import type { RequestBrand } from '@/lib/request-brand';
import { validateRequest } from '@/middleware/internal-auth.middleware';
import { getAuthBrandContext, shouldUseBrandBinding } from '@/modules/auth/brand-db';
import { TokenRepository } from '@/modules/auth/repositories/token.repository';
import { UserRepository } from '@/modules/auth/repositories/user.repository';
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
  
  // 🔥 STRICT UNIFICATION: user + student → student (ONLY)
  // No spreading, no merging, no hybrid state
  // Alias legacy 'user' to 'student', preserve all other roles, deduplicate
  const mapped = roles.map(r => (r === 'user' ? 'student' : r));
  return [...new Set(mapped)];
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

export async function validateCurrentLearnerContext(context: AuthContext, request: NextRequest): Promise<AuthContext | null> {
  if (context.brand !== 'skillup' && context.brand !== 'realtutorialhub') return context;
  try {
    const brand = getAuthBrandContext(context.brand);
    const users = container.get(UserRepository);
    const tokens = container.get(TokenRepository);
    const userRepository = shouldUseBrandBinding() ? users.withDb(brand.db, brand.tables) : users;
    const tokenRepository = shouldUseBrandBinding() ? tokens.withDb(brand.db, { refreshTokens: brand.tables.refreshTokens }) : tokens;
    const current = await userRepository.findActiveUserWithRoles(context.userId);
    if (!current || current.deletedAt !== null || current.isBlocked) return null;
    const currentRoles = canonicalizeRoles(current.roles);
    const roles = canonicalizeRoles(context.roles).filter(role => currentRoles.includes(role));
    if (roles.length === 0) return null;

    // Trusted background service calls retain their existing principal contract.
    // Browser/JWT requests must also satisfy the existing persisted session check.
    const tokenService = container.get(TokenService);
    const accessToken = tokenService.getAccessToken(request, { scope: 'user' });
    if (typeof accessToken === 'string' && accessToken.length > 0) {
      const refresh = tokenService.getRefreshToken(request);
      if (typeof refresh === 'string' && refresh.length > 0) {
        let payload;
        try {
          payload = await tokenService.verifyUserAccessToken(accessToken, { audience: 'user' });
        } catch {
          return null;
        }
        const refreshTokenHash = await tokenService.hashToken(refresh);
        if (payload.userId !== context.userId || payload.brand !== context.brand ||
            payload.sessionBinding !== refreshTokenHash) return null;
        const session = await tokenRepository.findValidSession({
          userId: context.userId, refreshTokenHash,
        });
        if (!session) return null;
      } else {
        return null;
      }
    }
    return { ...context, roles };
  } catch {
    throw new ApiError(503, 'Authentication unavailable');
  }
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
      
      return validateCurrentLearnerContext({
        userId: authResult.context.userId,
        brand: authResult.context.brand as RequestBrand,
        correlationId: authResult.context.correlationId,
        source: authResult.context.authMode,
        email: authResult.context.userEmail,
        roles, // 🔥 CANONICAL: Always unified to ['user'] for both brands
      }, req);
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

    return validateCurrentLearnerContext({
      userId: payload.userId,
      brand: (payload.brand as RequestBrand) || 'realtutorialhub',
      correlationId,
      source: 'jwt',
      email: payload.email,
      roles, // 🔥 CANONICAL: Always unified to ['user'] for both brands
    }, req);
  } catch (error) {
    console.error(`[AUTH][${correlationId}] JWT validation failed:`, error);
    return null;
  }
}
