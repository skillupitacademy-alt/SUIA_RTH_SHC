import type { NextRequest } from 'next/server';

import { notFound, unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { withCacheHeaders } from '@/lib/cache-headers';
import { type RequestBrand } from '@/lib/request-brand';
import { withLogging } from '@/lib/withLogging';
import { getAuthBrandContext, shouldUseBrandBinding } from '@/modules/auth/brand-db';
import { setOnboardingStateCookie } from '@/modules/auth/onboarding-state-cookie';
import { UserRepository } from '@/modules/auth/repositories/user.repository';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';

export const dynamic = 'force-dynamic';

async function handler(_req: NextRequest) {
  try {
    const _token = container.get(TokenService).getAccessToken(_req, { scope: 'user' });
    if (typeof _token !== 'string' || _token.trim() === '') {
      return ApiResponse.error(unauthorized('Unauthorized', 'UNAUTHORIZED'));
    }

    const _payload = await container.get(TokenService).verifyUserAccessToken(_token);
    const brand = ((_payload.brand === 'skillup' ? 'skillup' : _payload.brand === 'realtutorialhub' ? 'realtutorialhub' : undefined)
      ?? null) satisfies RequestBrand | null;
    if (brand === null) {
      return ApiResponse.error(unauthorized('Brand claim missing', 'UNAUTHORIZED'));
    }
    const brandContext = getAuthBrandContext(brand);
    const userRepo = shouldUseBrandBinding() && typeof container.get(UserRepository).withDb === 'function'
      ? container.get(UserRepository).withDb(brandContext.db, brandContext.tables)
      : container.get(UserRepository);
    const originalUserId =
      typeof _payload.originalUserId === 'string' && _payload.originalUserId.trim().length > 0
        ? _payload.originalUserId
        : null;
    if (originalUserId === null) {
      return ApiResponse.error(unauthorized('Unauthorized', 'UNAUTHORIZED'));
    }
    const _user = await userRepo.findByIdWithDetails(originalUserId);

    if (!_user) return ApiResponse.error(notFound('User', originalUserId));

    const profile = Array.isArray(_user.profile) ? _user.profile[0] ?? {} : (_user.profile ?? {});
    const typedProfile = profile as {
      name?: string | null;
      professionalStatus?: string | null;
      educationLevel?: string | null;
      primaryGoal?: string | null;
      domain?: string | null;
      subDomain?: string | null;
      adaptiveLevel?: 'beginner' | 'intermediate' | 'advanced' | null;
      timeCommitment?: string | null;
      journeyStatus?: string | null;
      onboardingCompleted?: boolean | null;
    };
    const onboardingCompleted = typedProfile.onboardingCompleted === true;

    const response = withCacheHeaders(ApiResponse.success({
      user: {
        id: _user.id,
        originalUserId: _user.id,
        shadowUserId:
          typeof _payload.shadowUserId === 'string' && _payload.shadowUserId.trim().length > 0
            ? _payload.shadowUserId
            : _user.id,
        brand,
        email: _user.email,
        name: typedProfile.name,
        onboarded: onboardingCompleted,
        onboardingCompleted,
        professionalStatus: typedProfile.professionalStatus ?? null,
        educationLevel: typedProfile.educationLevel ?? null,
        fullName: typedProfile.name ?? null,
        status: typedProfile.professionalStatus ?? null,
        primaryGoal: typedProfile.primaryGoal ?? null,
        domain: typedProfile.domain ?? null,
        subDomain: typedProfile.subDomain ?? null,
        skillLevel: typedProfile.adaptiveLevel ?? 'beginner',
        timeCommitment: typedProfile.timeCommitment ?? null,
        journeyStatus: typedProfile.journeyStatus ?? null,
        roles: _user.userRoles.map((ur) => ur.role.name),
      },
      expiresAt: container.get(TokenService).getExpiration(_token),
    }), 'SESSION');
    setOnboardingStateCookie(response, _req, onboardingCompleted);
    return response;
  } catch (_error: unknown) {
    return ApiResponse.error(_error, 401);
  }
}

import { withCorrelationId } from '@/lib/correlation-id.middleware';

export const GET = withCorrelationId(withLogging(handler, { component: 'auth', operation: 'me' }));
