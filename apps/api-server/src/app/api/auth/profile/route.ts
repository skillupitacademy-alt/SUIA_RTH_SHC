import { db, userProfiles, users } from '@quiz/db';
import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';

import { badRequest, notFound, unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { withCacheHeaders } from '@/lib/cache-headers';
import type { RequestBrand } from '@/lib/request-brand';
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
import { withLogging } from '@/lib/withLogging';
import { getAuthBrandContext, shouldUseBrandBinding } from '@/modules/auth/brand-db';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';
import { validateRequest, blockDirectAccess } from '@/middleware/internal-auth.middleware';

export const dynamic = 'force-dynamic';

interface ProfileUpdateBody {
  name?: string;
  professionalStatus?: string;
  educationLevel?: string;
  ageGroup?: string;
  experienceYears?: number;
  domainInterest?: string[];
  adaptiveLevel?: 'beginner' | 'intermediate' | 'advanced';
  primaryGoal?: string;
  domain?: string;
  subDomain?: string;
  timeCommitment?: string;
  journeyStatus?: string;
  onboardingCompleted?: boolean;
}

async function getHandler(_req: NextRequest) {
  const perfStart = Date.now();
  const correlationId = _req.headers.get('x-correlation-id') || crypto.randomUUID();
  
  try {
    console.log(`[Profile GET][${correlationId}] START`);
    
    // 🚀 INTERNAL SERVICE-TO-SERVICE AUTHENTICATION
    const authResult = validateRequest(_req);
    if (authResult.error) {
      console.log(`[Profile GET][${correlationId}] Auth failed`);
      return authResult.error;
    }
    
    let userId: string;
    let brand: RequestBrand;
    
    if (authResult.context) {
      userId = authResult.context.userId;
      brand = authResult.context.brand as RequestBrand;
      
      console.log(`[Profile GET][${correlationId}] Auth mode: ${authResult.context.authMode}, Brand: ${brand}`);
    } else {
      // JWT Fallback for direct API access
      console.log(`[Profile GET][${correlationId}] Using JWT fallback`);
      
      const _token = container.get(TokenService).getAccessToken(_req, { scope: 'user' });
      if (typeof _token !== 'string' || _token.trim().length === 0) {
        console.log(`[Profile GET][${correlationId}] No token`);
        return ApiResponse.error(unauthorized('Unauthorized', 'UNAUTHORIZED'));
      }

      const _payload = await container.get(TokenService).verifyUserAccessToken(_token);
      if (_payload === null || _payload === undefined || typeof _payload.userId !== 'string' || _payload.userId.length === 0) {
        console.log(`[Profile GET][${correlationId}] Invalid token payload`);
        return ApiResponse.error(unauthorized('Unauthorized', 'UNAUTHORIZED'));
      }
      
      userId = _payload.userId;
      brand = (_payload.brand as RequestBrand) || 'realtutorialhub';
    }
    
    const timings = { 
      afterAuth: Date.now(),
      afterDbQuery: 0
    };
    
    console.log(`[TRACE][${correlationId}] Profile GET for userId: ${userId}, brand: ${brand}`);
    
    // Get brand-specific database context
    const brandContext = getAuthBrandContext(brand);
    const useBrandBinding = shouldUseBrandBinding();
    const brandDb = useBrandBinding ? brandContext.db : db;
    
    console.log(`[TRACE][${correlationId}] Using brand-specific DB: ${useBrandBinding}`);
    
    const dbQueryStart = Date.now();
    const profile = await brandDb.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, userId),
    });
    const dbQueryDuration = Date.now() - dbQueryStart;
    timings.afterDbQuery = Date.now();
    
    // 🔥 CRITICAL PERFORMANCE LOG
    console.log(`[PERF][DB][PROFILE_QUERY][${correlationId}]`, {
      duration: dbQueryDuration,
      userId: userId,
      brand,
      found: profile !== null && profile !== undefined,
    });

    if (profile === null || profile === undefined) {
      console.log(`[TRACE][${correlationId}] Profile not found`);
      
      // 🚨 CRITICAL: Check if user has onboardingCompleted = true
      const user = await brandDb.query.users.findFirst({
        where: eq(users.id, userId),
      });
      
      if (user !== null && user !== undefined && user.isOnboarded === true) {
        console.error(`[ERROR][${correlationId}] DATA INTEGRITY VIOLATION: onboardingCompleted = true but profile does NOT exist`);
        console.error('UserId:', userId);
        console.error('User email:', user.email);
        return ApiResponse.error({
          code: 'DATA_INTEGRITY_ERROR',
          message: 'User marked as onboarded but profile does not exist',
          userId: userId,
          correlationId
        }, 500);
      }
      
      return ApiResponse.error(notFound('Profile', userId));
    }

    console.log(`[TRACE][${correlationId}] Profile found`);
    
    // 🚀 PERFORMANCE INSTRUMENTATION - INTERNAL SERVICE AUTH
    const totalDuration = Date.now() - perfStart;
    console.log(`[PERF][API][PROFILE_INTERNAL_AUTH][${correlationId}]`, JSON.stringify({
      total: totalDuration,
      breakdown: {
        auth: timings.afterAuth - perfStart,
        dbQuery: timings.afterDbQuery - timings.afterAuth,
      },
      authMode: authResult.context?.authMode || 'jwt-fallback',
      brand,
      userId: userId,
      optimization: authResult.context?.authMode === 'internal' ? 'FASTEST (internal service)' : 
                   authResult.context?.authMode === 'gateway' ? 'FAST (gateway)' : 'SLOW (jwt)'
    }));
    
    return withCacheHeaders(ApiResponse.success(profile), 'SESSION');
  } catch (_error: unknown) {
    console.error(`[Profile GET][${correlationId}] Error:`, _error);
    if (_error !== null && _error !== undefined && typeof _error === 'object' && 'code' in _error && _error.code === 'UNAUTHORIZED') {
      return ApiResponse.error(_error, 401);
    }
    return ApiResponse.error(_error, 500);
  }
}

async function patchHandler(_req: NextRequest) {
  try {
    console.log('[Profile PATCH] START');
    const _token = container.get(TokenService).getAccessToken(_req, { scope: 'user' });
    if (typeof _token !== 'string' || _token.length === 0) {
      console.log('[Profile PATCH] No token');
      return ApiResponse.error(unauthorized('Unauthorized', 'UNAUTHORIZED'));
    }

    const _payload = await container.get(TokenService).verifyUserAccessToken(_token);
    if (_payload === null || _payload === undefined || typeof _payload.userId !== 'string' || _payload.userId.length === 0) {
      console.log('[Profile PATCH] Invalid token payload');
      return ApiResponse.error(unauthorized('Unauthorized', 'UNAUTHORIZED'));
    }
    
    // 🔥 CRITICAL FIX: Extract brand from JWT and use brand-specific database
    const brand: RequestBrand = (_payload.brand as RequestBrand) || 'realtutorialhub';
    console.log('[Profile PATCH] Brand from token:', brand);
    
    // Get brand-specific database context
    const brandContext = getAuthBrandContext(brand);
    const useBrandBinding = shouldUseBrandBinding();
    const brandDb = useBrandBinding ? brandContext.db : db;
    
    console.log('[Profile PATCH] Using brand-specific DB:', useBrandBinding);
    
    const rawBody = await _req.json().catch(() => ({}));
    
    if (!validateJsonDepth(rawBody) || !validateJsonSize(rawBody)) {
      return ApiResponse.error(badRequest('Payload too deep or large'));
    }

    const body = sanitizeJsonField(rawBody) as ProfileUpdateBody;
    console.log('[Profile PATCH] Update fields:', Object.keys(body));

    // Check if profile exists first
    const existing = await brandDb.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, _payload.userId),
    });

    if (existing !== null && existing !== undefined) {
      console.log('[Profile PATCH] Updating existing profile');
      
      // Prepare update data with proper handling for array fields
      const updateData: Partial<ProfileUpdateBody> & { updatedAt: Date } = {
        ...body,
        updatedAt: new Date()
      };
      
      // Ensure domainInterest is properly handled as an array
      if (body.domainInterest !== undefined) {
        updateData.domainInterest = Array.isArray(body.domainInterest) 
          ? body.domainInterest 
          : [];
      }
      
      // Update existing profile
      const [updated] = await brandDb.update(userProfiles)
        .set(updateData)
        .where(eq(userProfiles.userId, _payload.userId))
        .returning();

      console.log('[Profile PATCH] Profile updated successfully');
      return ApiResponse.success(updated);
    } else {
      console.log('[Profile PATCH] Creating new profile (fallback)');
      
      // Ensure domainInterest is an array
      let domainInterestArray: string[] = [];
      const di = body.domainInterest as unknown;
      if (Array.isArray(di)) {
        domainInterestArray = di as string[];
      } else if (typeof di === 'string' && di.length > 0) {
        domainInterestArray = [di];
      }
      
      // Insert new profile
      const [inserted] = await brandDb.insert(userProfiles).values({
        userId: _payload.userId,
        name: (typeof body.name === 'string' && body.name.length > 0) ? body.name : 'User',
        professionalStatus: body.professionalStatus,
        educationLevel: body.educationLevel,
        ageGroup: body.ageGroup,
        experienceYears: body.experienceYears,
        domainInterest: domainInterestArray,
        adaptiveLevel: body.adaptiveLevel || 'beginner',
        primaryGoal: body.primaryGoal,
        domain: body.domain,
        subDomain: body.subDomain,
        timeCommitment: body.timeCommitment,
        journeyStatus: body.journeyStatus,
        onboardingCompleted: body.onboardingCompleted === true,
      }).returning();

      console.log('[Profile PATCH] Profile created successfully');
      return ApiResponse.success(inserted);
    }
  } catch (_error: unknown) {
    console.error('[Profile PATCH] Error:', _error);
    // Return 500 for database errors, not 400
    return ApiResponse.error(_error, 500);
  }
}

export const GET = withLogging(getHandler, { component: 'auth', operation: 'get_profile' });
export const PATCH = withLogging(patchHandler, { component: 'auth', operation: 'update_profile' });
export const POST = withLogging(patchHandler, { component: 'auth', operation: 'update_profile_alias' });
