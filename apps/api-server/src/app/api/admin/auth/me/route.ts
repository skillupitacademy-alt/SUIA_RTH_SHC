import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';

import { forbidden, notFound, unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { withCorrelationId } from '@/lib/correlation-id.middleware';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { type RequestBrand } from '@/lib/request-brand';
import { withLogging } from '@/lib/withLogging';
import { getAuthBrandContext, shouldUseBrandBinding } from '@/modules/auth/brand-db';
import { UserRepository } from '@/modules/auth/repositories/user.repository';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';

export const dynamic = 'force-dynamic';

async function handler(_req: NextRequest) {
  const start = Date.now();
  try {
    const portalIdentity = _req.headers.get('x-portal-identity') ?? 'admin';
    const scope = portalIdentity === 'infrastructure' ? 'infrastructure' : 'admin';


    const _token = container.get(TokenService).getAccessToken(_req, { scope });
    if (typeof _token !== 'string' || _token.trim().length === 0) {
        return ApiResponse.error(unauthorized('Unauthorized'), 401);
    }

    const _payload = await container.get(TokenService).verifyAdminAccessToken(_token);
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

    if (_user === null || _user === undefined) return ApiResponse.error(notFound('User', originalUserId));

    const profile = Array.isArray(_user.profile) ? _user.profile[0] ?? {} : (_user.profile ?? {});
    const typedProfile = profile as { name?: string | null };

    const role = _user.userRoles[0]?.role?.name?.toLowerCase() ?? 'user';
    const isAdmin = role === 'admin' || role === 'super_admin' || role === 'infrastructure';

    if (!isAdmin) {
        return ApiResponse.error(forbidden('Admin access only'));
    }

    const durationMs = Date.now() - start;
    recordCounter(METRICS.AUTH.LOGIN + '.me', 1, { outcome: 'success', scope });
    recordTimer(METRICS.AUTH.LOGIN + '.me.duration', durationMs);

    return ApiResponse.success({
      user: {
        id: _user.id,
        originalUserId: _user.id,
        shadowUserId:
          typeof _payload.shadowUserId === 'string' && _payload.shadowUserId.trim().length > 0
            ? _payload.shadowUserId
            : _user.id,
        brand,
        email: _user.email,
        name: typedProfile.name ?? 'Administrator',
        role,
        isAdmin
      },
      expiresAt: container.get(TokenService).getExpiration(_token)
    });
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Unauthorized';
    recordCounter(METRICS.AUTH.LOGIN + '.me', 1, { outcome: 'failure' });
    return ApiResponse.error(unauthorized(message), 401);
  }
}

export const GET = withCorrelationId(withLogging(handler, { component: 'admin-auth', operation: 'get_me' }));
