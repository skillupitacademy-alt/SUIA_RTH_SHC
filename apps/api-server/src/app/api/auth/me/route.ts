import type { NextRequest } from 'next/server';

import { notFound, unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { withCacheHeaders } from '@/lib/cache-headers';
import { type RequestBrand,resolveRequestBrandFromHeaders } from '@/lib/request-brand';
import { withLogging } from '@/lib/withLogging';
import { getAuthBrandContext, shouldUseBrandBinding } from '@/modules/auth/brand-db';
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
      ?? resolveRequestBrandFromHeaders(_req.headers, new URL(_req.url).hostname)
      ?? 'realtutorialhub') satisfies RequestBrand;
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
    const typedProfile = profile as { name?: string | null; professionalStatus?: string | null; educationLevel?: string | null };

    const onboarded = typeof typedProfile.professionalStatus === 'string' && 
                      typedProfile.professionalStatus !== '' && 
                      typeof typedProfile.educationLevel === 'string' && 
                      typedProfile.educationLevel !== '';

    return withCacheHeaders(ApiResponse.success({
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
        onboarded,
        professionalStatus: typedProfile.professionalStatus ?? null,
        educationLevel: typedProfile.educationLevel ?? null,
        roles: _user.userRoles.map((ur) => ur.role.name),
      },
      expiresAt: container.get(TokenService).getExpiration(_token),
    }), 'SESSION');
  } catch (_error: unknown) {
    return ApiResponse.error(_error, 401);
  }
}

import { withCorrelationId } from '@/lib/correlation-id.middleware';

export const GET = withCorrelationId(withLogging(handler, { component: 'auth', operation: 'me' }));
