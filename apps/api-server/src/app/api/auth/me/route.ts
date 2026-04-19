import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { toUserSummaryDTO } from '@/dtos/auth.dto';
import { unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { recordCounter } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { getAuthBrandContext, shouldUseBrandBinding } from '@/modules/auth/brand-db';
import { TokenRepository } from '@/modules/auth/repositories/token.repository';
import { UserRepository } from '@/modules/auth/repositories/user.repository';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';

export const dynamic = 'force-dynamic';

import { withCorrelationId } from '@/lib/correlation-id.middleware';

/**
 * Backend Route: Get current authenticated user
 * Pattern: BFF → API Server → DB
 * 
 * CRITICAL: This route extracts user info from JWT token (httpOnly cookie)
 * SECURITY: Brand resolution from JWT payload ONLY (not headers)
 * DO NOT expose tokens to frontend
 * DO NOT add business logic here - only user state retrieval
 */
async function handler(req: NextRequest) {
  const start = Date.now();
  const requestId = req.headers.get('x-request-id') ?? 'no-request-id';

  try {
    console.log('[AUTH_FLOW][ME][START]', JSON.stringify({
      requestId,
      path: req.nextUrl.pathname,
    }));

    // Extract token from cookies (httpOnly)
    const tokenService = container.get(TokenService);
    const accessToken = tokenService.getAccessToken(req);

    if (typeof accessToken !== 'string' || accessToken.length === 0) {
      console.log('[AUTH_FLOW][ME][NO_TOKEN]', JSON.stringify({ requestId }));
      recordCounter(METRICS.AUTH.FAILURE, 1, { reason: 'no_token' });
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Verify token and extract payload
    let payload;
    try {
      payload = await tokenService.verifyAccessToken(accessToken);
    } catch (error) {
      console.log('[AUTH_FLOW][ME][INVALID_TOKEN]', JSON.stringify({
        requestId,
        error: error instanceof Error ? error.message : 'unknown',
      }));
      recordCounter(METRICS.AUTH.FAILURE, 1, { reason: 'invalid_token' });
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // 🔥 CRITICAL SECURITY FIX: Extract brand from JWT payload (NOT headers)
    const brand = payload.brand;
    
    console.log('[ME_DEBUG] JWT-based brand resolution:', {
      tokenBrand: brand,
      userId: payload.userId,
      securityNote: 'Brand resolved from signed JWT payload'
    });

    if (typeof brand !== 'string' || (brand !== 'realtutorialhub' && brand !== 'skillup')) {
      console.log('[ME_DEBUG] FAILURE: Invalid brand in JWT payload');
      recordCounter(METRICS.AUTH.FAILURE, 1, { reason: 'invalid_token_brand' });
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // TASK 2: Use brand-specific database based on JWT payload
    const brandContext = getAuthBrandContext(brand);
    
    // MANDATORY RUNTIME DB VALIDATION
    console.log('[FINAL_DB_CHECK]', {
      hasSelect: typeof brandContext.db.select === 'function',
      hasQuery: Boolean(brandContext.db.query),
      dbType: brandContext.db?.constructor?.name
    });
    
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
      // Check if user has ANY active (non-revoked) refresh tokens
      // CRITICAL: Use the original user ID (not shadow) for session lookup
      const sessionUserId = payload.userId; // This is the original user ID used for storing tokens
      const activeTokens = await brandTokenRepo.getUserSessions(sessionUserId);
      
      console.log('[ME_DEBUG] SECURITY: Token revocation check:', {
        payloadUserId: payload.userId,
        shadowUserId: payload.shadowUserId,
        sessionUserId,
        brand,
        activeTokensCount: activeTokens.length,
        activeTokens: activeTokens.map(t => ({
          id: t.id,
          revoked: t.revoked,
          expiresAt: t.expiresAt,
          deviceId: t.deviceId,
          userId: t.userId
        }))
      });
      
      if (activeTokens.length === 0) {
        console.log('[ME_DEBUG] SECURITY: No active refresh tokens found - global logout detected');
        recordCounter(METRICS.AUTH.FAILURE, 1, { reason: 'no_active_tokens' });
        return NextResponse.json({ user: null }, { status: 401 });
      }
      
      console.log('[ME_DEBUG] SECURITY: Found', activeTokens.length, 'active refresh tokens - allowing access');
    } catch (tokenCheckError) {
      console.error('[ME_DEBUG] Token revocation check failed:', tokenCheckError);
      // Continue with normal flow if token check fails (graceful degradation)
    }
    
    console.log('[ME_DEBUG] Database context:', {
      brand,
      useBrandBinding,
      dbInstance: typeof brandContext.db === 'object' && brandContext.db !== null ? 'present' : 'missing'
    });

    const userRepo = container.get(UserRepository);
    const brandUserRepo = useBrandBinding && typeof userRepo.withDb === 'function'
      ? userRepo.withDb(brandContext.db, brandContext.tables)
      : userRepo;
    
    // TASK 3: Fetch user with brand-specific repository
    console.log('[ME_DEBUG] Fetching user:', {
      userId: payload.userId,
      brand,
      tokenBrand: payload.brand
    });

    const user = await brandUserRepo.findByIdWithDetails(payload.userId);

    console.log('[ME_DEBUG] User lookup result:', {
      found: user !== null && user !== undefined,
      userId: user?.id,
      email: user?.email,
      isBlocked: user?.isBlocked,
      hasProfile: user?.profile !== null && user?.profile !== undefined
    });

    if (user === null || user === undefined) {
      console.log('[AUTH_FLOW][ME][USER_NOT_FOUND]', JSON.stringify({
        requestId,
        userId: payload.userId,
        brand,
      }));
      recordCounter(METRICS.AUTH.FAILURE, 1, { reason: 'user_not_found' });
      throw new Error(`User not found in ${brand} database`);
    }

    // Check if user is blocked
    if (user.isBlocked) {
      console.log('[AUTH_FLOW][ME][USER_BLOCKED]', JSON.stringify({
        requestId,
        userId: user.id,
      }));
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

    const userDto = toUserSummaryDTO(authUserInput, isAdmin);

    const end = Date.now();
    const durationMs = end - start;

    console.log('[AUTH_FLOW][ME][SUCCESS]', JSON.stringify({
      requestId,
      durationMs,
      userId: user.id,
      role: isAdmin ? 'admin' : 'user',
      brand,
    }));

    recordCounter(METRICS.AUTH.LOGIN, 1, { operation: 'get_me' });

    return ApiResponse.success({
      user: userDto,
    }, 200, {
      'Cache-Control': 'no-store, no-cache, must-revalidate'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get user';
    console.log('[AUTH_FLOW][ME][ERROR]', JSON.stringify({
      requestId,
      message,
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 3) : undefined
    }));
    recordCounter(METRICS.AUTH.FAILURE, 1, { reason: 'server_error' });
    
    // TASK 5: Proper error handling - return 500 for server errors, not 401
    return NextResponse.json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? message : 'Failed to get user'
    }, { status: 500 });
  }
}

export const GET = withCorrelationId(
  withLogging(handler, { component: 'auth', operation: 'me' })
);
