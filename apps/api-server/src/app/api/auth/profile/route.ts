import { db, userProfiles, users } from '@quiz/db';
import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';

import { badRequest, notFound, unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth-context';
import { withCacheHeaders } from '@/lib/cache-headers';
import type { RequestBrand } from '@/lib/request-brand';
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
import { withLogging } from '@/lib/withLogging';
import { getAuthBrandContext, shouldUseBrandBinding } from '@/modules/auth/brand-db';

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
  
  try {
    // 🔐 UNIFIED AUTH: Single source of truth
    const auth = getAuthContext(_req);
    if (!auth) {
      return ApiResponse.error(unauthorized('Unauthorized'));
    }
    
    const { userId, brand, correlationId } = auth;
    console.log(`[Profile GET][${correlationId}] Auth SUCCESS - userId: ${userId}, brand: ${brand}`);
    
    const timings = { 
      afterAuth: Date.now(),
      afterDbQuery: 0
    };
    
    // Get brand-specific database context
    const brandContext = getAuthBrandContext(brand as RequestBrand);
    const useBrandBinding = shouldUseBrandBinding();
    const brandDb = useBrandBinding ? brandContext.db : db;
    
    const dbQueryStart = Date.now();
    const profile = await brandDb.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, userId),
    });
    const dbQueryDuration = Date.now() - dbQueryStart;
    timings.afterDbQuery = Date.now();
    
    console.log(`[PERF][DB][PROFILE_QUERY][${correlationId}]`, {
      duration: dbQueryDuration,
      userId,
      brand,
      found: profile !== undefined,
    });

    if (profile === undefined) {
      // Check if user has onboardingCompleted = true
      const user = await brandDb.query.users.findFirst({
        where: eq(users.id, userId),
      });
      
      if (user?.isOnboarded === true) {
        console.error(`[ERROR][${correlationId}] DATA INTEGRITY: onboarded but profile missing`);
        return ApiResponse.error({
          code: 'DATA_INTEGRITY_ERROR',
          message: 'User marked as onboarded but profile does not exist',
          userId,
          correlationId
        }, 500);
      }
      
      return ApiResponse.error(notFound('Profile', userId));
    }

    const totalDuration = Date.now() - perfStart;
    console.log(`[PERF][API][PROFILE][${correlationId}]`, {
      total: totalDuration,
      auth: timings.afterAuth - perfStart,
      dbQuery: timings.afterDbQuery - timings.afterAuth,
      source: auth.source,
      brand,
    });
    
    return withCacheHeaders(ApiResponse.success(profile), 'SESSION');
  } catch (_error: unknown) {
    const correlationId = _req.headers.get('x-correlation-id') ?? 'unknown';
    console.error(`[Profile GET][${correlationId}] Error:`, _error);
    return ApiResponse.error(_error, 500);
  }
}

async function patchHandler(_req: NextRequest) {
  try {
    // 🔐 UNIFIED AUTH: Single source of truth
    const auth = getAuthContext(_req);
    if (!auth) {
      return ApiResponse.error(unauthorized('Unauthorized'));
    }
    
    const { userId, brand, correlationId } = auth;
    console.log(`[Profile PATCH][${correlationId}] Auth SUCCESS - userId: ${userId}, brand: ${brand}`);
    
    const rawBody = await _req.json().catch(() => ({}));
    
    if (!validateJsonDepth(rawBody) || !validateJsonSize(rawBody)) {
      return ApiResponse.error(badRequest('Payload too deep or large'));
    }

    const body = sanitizeJsonField(rawBody) as ProfileUpdateBody;
    console.log(`[Profile PATCH][${correlationId}] Update fields:`, Object.keys(body));

    // Get brand-specific database context
    const brandContext = getAuthBrandContext(brand as RequestBrand);
    const useBrandBinding = shouldUseBrandBinding();
    const brandDb = useBrandBinding ? brandContext.db : db;

    // Check if profile exists first
    const existing = await brandDb.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, userId),
    });

    if (existing !== undefined) {
      console.log(`[Profile PATCH][${correlationId}] Updating existing profile`);
      
      const updateData: Partial<ProfileUpdateBody> & { updatedAt: Date } = {
        ...body,
        updatedAt: new Date()
      };
      
      if (body.domainInterest !== undefined) {
        updateData.domainInterest = Array.isArray(body.domainInterest) 
          ? body.domainInterest 
          : [];
      }
      
      const [updated] = await brandDb.update(userProfiles)
        .set(updateData)
        .where(eq(userProfiles.userId, userId))
        .returning();

      console.log(`[Profile PATCH][${correlationId}] Profile updated successfully`);
      return ApiResponse.success(updated);
    } else {
      console.log(`[Profile PATCH][${correlationId}] Creating new profile`);
      
      let domainInterestArray: string[] = [];
      const di = body.domainInterest as unknown;
      if (Array.isArray(di)) {
        domainInterestArray = di as string[];
      } else if (typeof di === 'string' && di.length > 0) {
        domainInterestArray = [di];
      }
      
      const [inserted] = await brandDb.insert(userProfiles).values({
        userId,
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

      console.log(`[Profile PATCH][${correlationId}] Profile created successfully`);
      return ApiResponse.success(inserted);
    }
  } catch (_error: unknown) {
    const correlationId = _req.headers.get('x-correlation-id') ?? 'unknown';
    console.error(`[Profile PATCH][${correlationId}] Error:`, _error);
    return ApiResponse.error(_error, 500);
  }
}

export const GET = withLogging(getHandler, { component: 'auth', operation: 'get_profile' });
export const PATCH = withLogging(patchHandler, { component: 'auth', operation: 'update_profile' });
export const POST = withLogging(patchHandler, { component: 'auth', operation: 'update_profile_alias' });
