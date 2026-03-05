import { db, users } from '@quiz/db';
import { METRICS } from '@quiz/observability';
import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';

import { forbidden, notFound, unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';

export const dynamic = 'force-dynamic';

async function handler(_req: NextRequest) {
  const start = Date.now();
  try {
    const portalIdentity = _req.headers.get('x-portal-identity') ?? 'admin';
    const scope = portalIdentity === 'infrastructure' ? 'infrastructure' : 'admin';
    const audience = portalIdentity === 'infrastructure' ? 'infra' : 'admin';

    const _token = container.get(TokenService).getAccessToken(_req, { scope });
    if (_token === null || _token === undefined || _token.trim() === '') {
        return ApiResponse.error(unauthorized('Unauthorized'), 401);
    }

    const _payload = await container.get(TokenService).verifyAccessToken(_token, { isAdmin: true, audience });
    const _user = await db.query.users.findFirst({
      where: eq(users.id, _payload.userId),
      with: {
        profile: true,
        userRoles: {
          with: { role: true }
        }
      }
    });

    if (_user === null || _user === undefined) return ApiResponse.error(notFound('User', _payload.userId));

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
        email: _user.email,
        name: _user.profile?.name ?? 'Administrator',
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

export const GET = withLogging(handler, { component: 'admin-auth', operation: 'get_me' });
