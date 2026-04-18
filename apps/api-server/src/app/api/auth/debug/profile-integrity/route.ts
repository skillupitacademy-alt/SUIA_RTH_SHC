import { userProfiles,users } from '@quiz/db';
import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';

import { unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import type { RequestBrand } from '@/lib/request-brand';
import { getAuthBrandContext, shouldUseBrandBinding } from '@/modules/auth/brand-db';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';

export const dynamic = 'force-dynamic';

/**
 * 🔍 DEBUG ENDPOINT: Profile Integrity Check
 * 
 * Validates data consistency between users.isOnboarded and userProfiles existence
 * 
 * CRITICAL INVARIANT:
 * If user.isOnboarded = true → userProfiles MUST exist
 * 
 * If this invariant is violated, it indicates DATA CORRUPTION
 */
async function handler(_req: NextRequest) {
  try {
    const _token = container.get(TokenService).getAccessToken(_req);
    
    if (typeof _token !== 'string' || _token.trim().length === 0) {
      return ApiResponse.error(unauthorized('Unauthorized', 'UNAUTHORIZED'));
    }

    const _payload = await container.get(TokenService).verifyAccessToken(_token);
    
    if (_payload === null || _payload === undefined || typeof _payload.userId !== 'string' || _payload.userId.length === 0) {
      return ApiResponse.error(unauthorized('Unauthorized', 'UNAUTHORIZED'));
    }

    // Get brand-specific database context
    const brand: RequestBrand = (_payload.brand as RequestBrand) || 'realtutorialhub';
    const brandContext = getAuthBrandContext(brand);
    const useBrandBinding = shouldUseBrandBinding();
    const brandDb = useBrandBinding ? brandContext.db : brandContext.db;

    // Fetch user data
    const user = await brandDb.query.users.findFirst({
      where: eq(users.id, _payload.userId),
    });

    // Fetch profile data
    const profile = await brandDb.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, _payload.userId),
    });

    // Check for data integrity violation
    const userExists = user !== null && user !== undefined;
    const profileExists = profile !== null && profile !== undefined;
    const isOnboarded = userExists && user.isOnboarded === true;
    const hasIntegrityViolation = isOnboarded && !profileExists;

    return ApiResponse.success({
      userId: _payload.userId,
      brand,
      user: {
        exists: userExists,
        isOnboarded: isOnboarded,
        email: userExists ? user.email : null,
        createdAt: userExists ? user.createdAt : null,
      },
      profile: {
        exists: profileExists,
        onboardingCompleted: profileExists && profile.onboardingCompleted === true,
        name: profileExists ? profile.name : null,
        createdAt: profileExists ? profile.createdAt : null,
      },
      integrity: {
        valid: !hasIntegrityViolation,
        violation: hasIntegrityViolation ? 'USER_ONBOARDED_BUT_NO_PROFILE' : null,
        message: hasIntegrityViolation
          ? '🚨 DATA CORRUPTION: User marked as onboarded but profile does not exist'
          : '✅ Data integrity valid',
      },
    });
  } catch (_error: unknown) {
    return ApiResponse.error(_error, 500);
  }
}

export const GET = handler;
