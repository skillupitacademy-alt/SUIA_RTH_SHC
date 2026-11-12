import { createRBACUser, validateBrandOrThrow } from '@quiz/auth';
import { PERMISSIONS } from '@quiz/auth/rbac/permissions';
import { RBACService } from '@quiz/auth/rbac/rbac.service';
import type { Role } from '@quiz/auth/rbac/roles';
import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { toUserSummaryDTO } from '@/dtos/auth.dto';
import { unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { recordCounter } from '@/lib/metrics';
import { withObservability } from '@/middleware/observability.middleware';
import { getAuthBrandContext, shouldUseBrandBinding } from '@/modules/auth/brand-db';
import { TokenRepository } from '@/modules/auth/repositories/token.repository';
import { UserRepository } from '@/modules/auth/repositories/user.repository';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';

export const dynamic = 'force-dynamic';

/**
 * Backend Route: Get current authenticated user
 * Pattern: BFF → Gateway → API Server → DB
 * 
 * 🔥 GATEWAY-FIRST: This route expects requests from API Gateway only
 * Gateway validates JWT and injects headers (x-user-id, x-brand, x-gateway-secret)
 * 
 * CRITICAL: This route extracts user info from JWT token (httpOnly cookie)
 * SECURITY: Brand resolution from JWT payload ONLY (not headers)
 * DO NOT expose tokens to frontend
 * DO NOT add business logic here - only user state retrieval
 */
async function handler(req: NextRequest, obsCtx: { requestId: string }) {
  const start = Date.now();
  const { requestId } = obsCtx; // 🔥 Observability context from withObservability

  try {

    // Extract token from cookies (httpOnly)
    const tokenService = container.get(TokenService);
    const accessToken = tokenService.getAccessToken(req);

    if (typeof accessToken !== 'string' || accessToken.length === 0) {
      recordCounter(METRICS.AUTH.FAILURE, 1, { reason: 'no_token' });
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Verify token and extract payload
    let payload;
    try {
      payload = await tokenService.verifyAccessToken(accessToken);
    } catch (error) {
      recordCounter(METRICS.AUTH.FAILURE, 1, { reason: 'invalid_token' });
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // 🔥 CRITICAL SECURITY FIX: Extract brand from JWT payload (NOT headers)
    const brand = payload.brand;
    

    if (typeof brand !== 'string' || (brand !== 'realtutorialhub' && brand !== 'skillup')) {
      recordCounter(METRICS.AUTH.FAILURE, 1, { reason: 'invalid_token_brand' });
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // 🔐 BRAND VALIDATION (defense in depth)
    try {
      validateBrandOrThrow({ brand: payload.brand, userId: payload.userId }, req);
    } catch (brandError) {
      console.error('[GET /api/auth/me] Brand validation failed:', brandError);
      return ApiResponse.error({
        code: 'BRAND_MISMATCH',
        message: brandError instanceof Error ? brandError.message : 'Brand validation failed',
      }, 403);
    }

    // 🔐 RBAC CHECK
    const normalizedRoles = (Array.isArray(payload.roles) ? payload.roles : []).map(r => r.toLowerCase().trim()).filter((r): r is Role => r.length > 0);
    const rbacUser = createRBACUser({
      isAuthenticated: true,
      userId: payload.userId,
      originalUserId: payload.userId,
      shadowUserId: payload.userId,
      roles: normalizedRoles,
      brand: brand as 'realtutorialhub' | 'skillup',
      email: payload.email,
    });

    try {
      RBACService.requirePermission(rbacUser.roles, PERMISSIONS.PROFILE_READ, payload.userId, requestId);
      console.log('🔐 RBAC_AUDIT', JSON.stringify({
        requestId, // 🔥 Correlation
        route: '/api/auth/me',
        method: 'GET',
        userId: payload.userId.slice(0, 8),
        roles: rbacUser.roles,
        permission: PERMISSIONS.PROFILE_READ,
        result: 'GRANTED',
      }));
    } catch (rbacError) {
      console.warn('🔐 RBAC_AUDIT', JSON.stringify({
        requestId, // 🔥 Correlation
        route: '/api/auth/me',
        method: 'GET',
        userId: payload.userId.slice(0, 8),
        permission: PERMISSIONS.PROFILE_READ,
        result: 'DENIED',
        error: rbacError instanceof Error ? rbacError.message : 'Unknown',
      }));
      return ApiResponse.error({
        code: 'PERMISSION_DENIED',
        message: `Permission required: ${PERMISSIONS.PROFILE_READ}`,
      }, 403);
    }

    // TASK 2: Use brand-specific database based on JWT payload
    const brandContext = getAuthBrandContext(brand);
    
    // MANDATORY RUNTIME DB VALIDATION
    
    // STRICT DB VALIDATION - NO fallback allowed
    if (typeof brandContext.db?.select !== 'function') {
      throw new Error('❌ INVALID DB INSTANCE');
    }
    
    const useBrandBinding = shouldUseBrandBinding();
    
    // 🔐 ENTERPRISE SECURITY: Check if user's refresh tokens have been globally revoked
    // This fixes the global logout issue found in FAANG audit
    const tokenRepo = container.get(TokenRepository);
    const brandTokenRepo = useBrandBinding && typeof tokenRepo.withDb === 'function'
      ? tokenRepo.withDb(brandContext.db, { refreshTokens: brandContext.tables.refreshTokens })
      : tokenRepo;
    
    try {
      // 🔥 FAANG-LEVEL FIX: Extract refresh token from cookie and validate session
      const refreshToken = tokenService.getRefreshToken(req);
      
      if (typeof refreshToken === 'string' && refreshToken.length > 0) {
        // Hash the refresh token to match DB storage
        const refreshTokenHash = await tokenService.hashToken(refreshToken);
        
        // CRITICAL: Use the original user ID (not shadow) for session lookup
        const sessionUserId = payload.userId; // This is the original user ID used for storing tokens
        
        // Check if this specific session is still valid (not revoked)
        const validSession = await brandTokenRepo.findValidSession({
          userId: sessionUserId,
          refreshTokenHash,
        });
        
        
        if (!validSession) {
          recordCounter(METRICS.AUTH.FAILURE, 1, { reason: 'session_revoked' });
          return NextResponse.json({ user: null }, { status: 401 });
        }
        
      } else {
        // Fallback: Check if user has ANY active refresh tokens
        // This handles cases where refresh token cookie might be missing
        const sessionUserId = payload.userId;
        const activeTokens = await brandTokenRepo.getUserSessions(sessionUserId);
        
        
        if (activeTokens.length === 0) {
          recordCounter(METRICS.AUTH.FAILURE, 1, { reason: 'no_active_tokens' });
          return NextResponse.json({ user: null }, { status: 401 });
        }
        
      }
    } catch (tokenCheckError) {
      recordCounter(METRICS.AUTH.FAILURE, 1, { reason: 'session_check_error' });
      return NextResponse.json({ user: null }, { status: 401 });
    }
    

    const userRepo = container.get(UserRepository);
    const brandUserRepo = useBrandBinding && typeof userRepo.withDb === 'function'
      ? userRepo.withDb(brandContext.db, brandContext.tables)
      : userRepo;

    const currentAccount = await brandUserRepo.findActiveUserWithRoles(payload.userId);
    if (!currentAccount || currentAccount.deletedAt !== null) {
      return NextResponse.json({ user: null }, { status: 401, headers: { 'Cache-Control': 'private, no-store' } });
    }
    if (currentAccount.isBlocked || currentAccount.roles.length === 0) {
      return NextResponse.json({ user: null }, { status: 403, headers: { 'Cache-Control': 'private, no-store' } });
    }
    
    // TASK 3: Fetch user with brand-specific repository

    const user = await brandUserRepo.findByIdWithDetails(payload.userId);


    if (user === null || user === undefined) {
      recordCounter(METRICS.AUTH.FAILURE, 1, { reason: 'user_not_found' });
      throw new Error(`User not found in ${brand} database`);
    }

    // Check if user is blocked
    if (user.isBlocked) {
      recordCounter(METRICS.AUTH.FAILURE, 1, { reason: 'user_blocked' });
      return ApiResponse.error(unauthorized('Account has been blocked'));
    }

    // Build user DTO
    const rawProfile = Array.isArray(user.profile) ? user.profile[0] ?? {} : (user.profile ?? {});
    const authUserInput = {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      emailVerified: user.emailVerified ?? false,
      isOnboarded: user.isOnboarded ?? false,
      profile: {
        name: (rawProfile as { name?: string | null }).name ?? null,
        professionalStatus: (rawProfile as { professionalStatus?: string | null }).professionalStatus ?? null,
        educationLevel: (rawProfile as { educationLevel?: string | null }).educationLevel ?? null,
      },
    } satisfies Parameters<typeof toUserSummaryDTO>[0];

    const roleNames = user.userRoles
      .map((ur) => ur.role.name?.trim().toLowerCase())
      .filter((role): role is string => typeof role === 'string' && role.length > 0);
    const isAdmin = roleNames.includes('admin') || roleNames.includes('super_admin') || roleNames.includes('infrastructure');

    const userDto = {
      ...toUserSummaryDTO(authUserInput, isAdmin),
      roles: currentAccount.roles,
      role: currentAccount.roles[0],
    };

    const end = Date.now();
    const durationMs = end - start;


    recordCounter(METRICS.AUTH.LOGIN, 1, { operation: 'get_me' });

    return ApiResponse.success({
      user: userDto,
    }, 200, {
      'Cache-Control': 'no-store, no-cache, must-revalidate'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get user';
    recordCounter(METRICS.AUTH.FAILURE, 1, { reason: 'server_error' });
    
    // TASK 5: Proper error handling - return 500 for server errors, not 401
    return NextResponse.json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? message : 'Failed to get user'
    }, { status: 500 });
  }
}

// 🔥 OBSERVABILITY: Wrap with withObservability for full request tracing
export const GET = withObservability(handler);
