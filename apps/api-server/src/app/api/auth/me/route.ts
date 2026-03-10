import { db, users } from '@quiz/db';
import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';

import { notFound, unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { withCacheHeaders } from '@/lib/cache-headers';
import { withLogging } from '@/lib/withLogging';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';

export const dynamic = 'force-dynamic';

async function handler(_req: NextRequest) {
  try {
    const _token = container.get(TokenService).getAccessToken(_req);
    if (typeof _token !== 'string' || _token.trim() === '') {
      return ApiResponse.error(unauthorized('Unauthorized', 'UNAUTHORIZED'));
    }

    const _payload = await container.get(TokenService).verifyUserAccessToken(_token);
    const _user = await db.query.users.findFirst({
      where: eq(users.id, _payload.userId),
      with: {
        profile: true,
        userRoles: {
          with: {
            role: true,
          },
        },
      },
    });

    if (!_user) return ApiResponse.error(notFound('User', _payload.userId));

    const profile = Array.isArray(_user.profile) ? _user.profile[0] ?? {} : (_user.profile ?? {});
    const typedProfile = profile as { name?: string | null; professionalStatus?: string | null; educationLevel?: string | null };

    const onboarded = typeof typedProfile.professionalStatus === 'string' && 
                      typedProfile.professionalStatus !== '' && 
                      typeof typedProfile.educationLevel === 'string' && 
                      typedProfile.educationLevel !== '';

    return withCacheHeaders(ApiResponse.success({
      user: {
        id: _user.id,
        email: _user.email,
        name: typedProfile.name,
        onboarded,
        professionalStatus: typedProfile.professionalStatus ?? null,
        educationLevel: typedProfile.educationLevel ?? null,
        roles: _user.userRoles.map((ur) => ur.role.name),
      },
      expiresAt: container.get(TokenService).getExpiration(_token),
    }), 'private');
  } catch (_error: unknown) {
    return ApiResponse.error(_error, 401);
  }
}

import { withCorrelationId } from '@/lib/correlation-id.middleware';

export const GET = withCorrelationId(withLogging(handler, { component: 'auth', operation: 'me' }));
