import { db, userProfiles } from '@quiz/db';
import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';

import { badRequest, notFound, unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { withCacheHeaders } from '@/lib/cache-headers';
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
import { withLogging } from '@/lib/withLogging';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';

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
  try {
    console.log('[Profile GET] START');
    const _token = container.get(TokenService).getAccessToken(_req, { scope: 'user' });
    if (typeof _token !== 'string' || _token.trim().length === 0) {
      console.log('[Profile GET] No token');
      return ApiResponse.error(unauthorized('Unauthorized', 'UNAUTHORIZED'));
    }

    const _payload = await container.get(TokenService).verifyUserAccessToken(_token);
    if (_payload === null || _payload === undefined || typeof _payload.userId !== 'string' || _payload.userId.length === 0) {
      console.log('[Profile GET] Invalid token payload');
      return ApiResponse.error(unauthorized('Unauthorized', 'UNAUTHORIZED'));
    }
    
    console.log('[Profile GET] Fetching profile for userId:', _payload.userId);
    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, _payload.userId),
    });

    if (profile === null || profile === undefined) {
      console.log('[Profile GET] Profile not found');
      
      // 🚨 CRITICAL: Check if user has onboardingCompleted = true
      // If yes, this is a DATA INTEGRITY VIOLATION
      const user = await db.query.users.findFirst({
        where: (usersTable, { eq }) => eq(usersTable.id, _payload.userId),
      });
      
      if (user !== null && user !== undefined && user.isOnboarded === true) {
        console.error('🚨 DATA INTEGRITY VIOLATION: onboardingCompleted = true but profile does NOT exist');
        console.error('UserId:', _payload.userId);
        console.error('User email:', user.email);
        // Return 500 to indicate server-side data inconsistency
        return ApiResponse.error({
          code: 'DATA_INTEGRITY_ERROR',
          message: 'User marked as onboarded but profile does not exist',
          userId: _payload.userId,
        }, 500);
      }
      
      return ApiResponse.error(notFound('Profile', _payload.userId));
    }

    console.log('[Profile GET] Profile found');
    return withCacheHeaders(ApiResponse.success(profile), 'SESSION');
  } catch (_error: unknown) {
    console.error('[Profile GET] Error:', _error);
    // If it's an auth error, return 401, otherwise return 500
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
    
    const rawBody = await _req.json().catch(() => ({}));
    
    if (!validateJsonDepth(rawBody) || !validateJsonSize(rawBody)) {
      return ApiResponse.error(badRequest('Payload too deep or large'));
    }

    const body = sanitizeJsonField(rawBody) as ProfileUpdateBody;
    console.log('[Profile PATCH] Update fields:', Object.keys(body));

    // Check if profile exists first
    const existing = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, _payload.userId),
    });

    if (existing) {
      console.log('[Profile PATCH] Updating existing profile');
      // Update existing profile
      const [updated] = await db.update(userProfiles)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(userProfiles.userId, _payload.userId))
        .returning();

      console.log('[Profile PATCH] Profile updated successfully');
      return ApiResponse.success(updated);
    } else {
      console.log('[Profile PATCH] Creating new profile (fallback)');
      // Insert new profile
      const [inserted] = await db.insert(userProfiles).values({
        userId: _payload.userId,
        name: (typeof body.name === 'string' && body.name.length > 0) ? body.name : 'User',
        professionalStatus: body.professionalStatus,
        educationLevel: body.educationLevel,
        ageGroup: body.ageGroup,
        experienceYears: body.experienceYears,
        domainInterest: body.domainInterest,
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
