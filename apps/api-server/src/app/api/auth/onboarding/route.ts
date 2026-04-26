import { createRBACUser, validateBrandOrThrow } from '@quiz/auth';
import { PERMISSIONS } from '@quiz/auth/rbac/permissions';
import { RBACService } from '@quiz/auth/rbac/rbac.service';
import type { Role } from '@quiz/auth/rbac/roles';
import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';

import { badRequest, unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { recordCounter } from '@/lib/metrics';
import type { RequestBrand } from '@/lib/request-brand';
import { withLogging } from '@/lib/withLogging';
import { withObservability } from '@/middleware/observability.middleware';
import { getAuthBrandContext } from '@/modules/auth/brand-db';
import { UserRepository } from '@/modules/auth/repositories/user.repository';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';

export const dynamic = 'force-dynamic';

import { withCorrelationId } from '@/lib/correlation-id.middleware';

/**
 * Backend Route: Save user onboarding preferences
 * Pattern: BFF → API Server → DB
 * 
 * CRITICAL: This route saves onboarding data to DB (single source of truth)
 * DO NOT use cookies for onboarding state
 * DO NOT add business logic beyond saving preferences
 */
async function handler(req: NextRequest) {
  console.log('🔥 BUILD VERSION:', process.env.GIT_SHA ?? 'NO_SHA');
  console.log('🔥 ONBOARDING ROUTE HIT - NEW VERSION');
  
  const start = Date.now();
  const requestId = req.headers.get('x-request-id') ?? 'no-request-id';

  try {
    console.log('[ONBOARDING][START]', JSON.stringify({
      requestId,
      path: req.nextUrl.pathname,
    }));

    // Extract token from cookies (httpOnly)
    const tokenService = container.get(TokenService);
    const accessToken = tokenService.getAccessToken(req);

    if (typeof accessToken !== 'string' || accessToken.length === 0) {
      console.log('[ONBOARDING][NO_TOKEN]', JSON.stringify({ requestId }));
      recordCounter(METRICS.AUTH.FAILURE, 1, { reason: 'no_token' });
      return ApiResponse.error(unauthorized('Authentication required'));
    }

    // Verify token and extract payload
    let payload;
    try {
      payload = await tokenService.verifyAccessToken(accessToken);
    } catch (error) {
      console.log('[ONBOARDING][INVALID_TOKEN]', JSON.stringify({
        requestId,
        error: error instanceof Error ? error.message : 'unknown',
      }));
      recordCounter(METRICS.AUTH.FAILURE, 1, { reason: 'invalid_token' });
      return ApiResponse.error(unauthorized('Invalid authentication'));
    }

    // 🔐 BRAND VALIDATION (defense in depth)
    try {
      validateBrandOrThrow({ brand: payload.brand, userId: payload.userId }, req);
    } catch (brandError) {
      console.error('[ONBOARDING] Brand validation failed:', brandError);
      return ApiResponse.error({
        code: 'BRAND_MISMATCH',
        message: brandError instanceof Error ? brandError.message : 'Brand validation failed',
      }, 403);
    }

    // 🔐 RBAC CHECK
    const brand: RequestBrand = (payload.brand === 'skillup' ? 'skillup' : 'realtutorialhub');
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
      RBACService.requirePermission(rbacUser.roles, PERMISSIONS.PROFILE_WRITE);
      console.log('🔐 RBAC_AUDIT', JSON.stringify({
        route: '/api/auth/onboarding',
        method: 'POST',
        userId: payload.userId.slice(0, 8),
        roles: rbacUser.roles,
        permission: PERMISSIONS.PROFILE_WRITE,
        result: 'GRANTED',
      }));
    } catch (rbacError) {
      console.warn('🔐 RBAC_AUDIT', JSON.stringify({
        route: '/api/auth/onboarding',
        method: 'POST',
        userId: payload.userId.slice(0, 8),
        permission: PERMISSIONS.PROFILE_WRITE,
        result: 'DENIED',
        error: rbacError instanceof Error ? rbacError.message : 'Unknown',
      }));
      return ApiResponse.error({
        code: 'PERMISSION_DENIED',
        message: `Permission required: ${PERMISSIONS.PROFILE_WRITE}`,
      }, 403);
    }

    // Parse request body
    const body = await req.json();
    
    // Validate required fields (basic validation)
    if (typeof body !== 'object' || body === null) {
      console.log('[ONBOARDING][INVALID_BODY]', JSON.stringify({ requestId }));
      return ApiResponse.error(badRequest('Invalid request body'));
    }

    // Extract onboarding preferences - SAVE ALL USER INPUT
    const preferences = {
      // Core preferences
      primaryGoal: typeof body.primaryGoal === 'string' ? body.primaryGoal : undefined,
      domain: typeof body.domain === 'string' ? body.domain : undefined,
      subDomain: typeof body.subDomain === 'string' ? body.subDomain : undefined,
      timeCommitment: typeof body.timeCommitment === 'string' ? body.timeCommitment : undefined,
      journeyStatus: typeof body.journeyStatus === 'string' ? body.journeyStatus : undefined,
      
      // 🔥 CRITICAL FIX: Extract ALL user input fields that were missing
      fullName: typeof body.fullName === 'string' ? body.fullName : undefined,
      educationLevel: typeof body.educationLevel === 'string' ? body.educationLevel : undefined,
      status: (body.status === 'student' || body.status === 'professional') ? body.status : undefined,
      skillLevel: (body.skillLevel === 'beginner' || body.skillLevel === 'intermediate' || body.skillLevel === 'advanced') ? body.skillLevel : undefined,
    };

    console.log('[ONBOARDING][PREFERENCES]', JSON.stringify({
      requestId,
      userId: payload.userId,
      brand,
      hasGoal: preferences.primaryGoal !== undefined,
      hasDomain: preferences.domain !== undefined,
      hasFullName: preferences.fullName !== undefined,
      hasEducationLevel: preferences.educationLevel !== undefined,
      hasStatus: preferences.status !== undefined,
      hasSkillLevel: preferences.skillLevel !== undefined,
    }));

    // STEP 2: Get brand-specific DB instance (brand already defined above in RBAC section)
    const { db, tables } = getAuthBrandContext(brand);
    
    // MANDATORY RUNTIME DB VALIDATION
    console.log('[FINAL_DB_CHECK]', {
      hasSelect: typeof db.select === 'function',
      hasQuery: Boolean(db.query),
      dbType: db?.constructor?.name
    });
    
    // STEP 3: Add hard check - NO fallback allowed
    if (typeof db?.select !== 'function') {
      throw new Error('❌ INVALID DB INSTANCE');
    }
    
    console.log('[ONBOARDING][DB_CONTEXT]', JSON.stringify({
      requestId,
      brand,
      dbType: typeof db?.constructor?.name === 'string' ? db.constructor.name : 'unknown',
      hasQuery: Boolean(db?.query),
      hasSelect: typeof db?.select === 'function'
    }));

    // STEP 3: Create UserRepository with correct DB instance
    console.log('[ONBOARDING_DEBUG] Creating UserRepository with brand DB');
    console.log('[ONBOARDING_DEBUG] DB instance type:', typeof db);
    console.log('[ONBOARDING_DEBUG] DB has select:', typeof db.select === 'function');
    console.log('[ONBOARDING_DEBUG] DB has query:', Boolean(db.query));
    
    const userRepo = new UserRepository(db, tables);
    
    console.log('[ONBOARDING_DEBUG] UserRepository created, calling saveUserPreferences');
    await userRepo.saveUserPreferences(payload.userId, preferences);
    
    console.log('[ONBOARDING_DEBUG] saveUserPreferences completed, calling markUserOnboarded');
    await userRepo.markUserOnboarded(payload.userId);

    const end = Date.now();
    const durationMs = end - start;

    console.log('[ONBOARDING][SUCCESS]', JSON.stringify({
      requestId,
      durationMs,
      userId: payload.userId,
    }));

    recordCounter(METRICS.AUTH.LOGIN, 1, { operation: 'onboarding' });

    return ApiResponse.success({
      success: true,
      message: 'Onboarding completed successfully',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save onboarding';
    console.log('[ONBOARDING][ERROR]', JSON.stringify({
      requestId,
      message,
    }));
    recordCounter(METRICS.AUTH.FAILURE, 1, { reason: 'server_error' });
    return ApiResponse.error(badRequest(message));
  }
}

export const POST = withObservability(
  withCorrelationId(
    withLogging(handler, { component: 'auth', operation: 'onboarding' })
  )
);
