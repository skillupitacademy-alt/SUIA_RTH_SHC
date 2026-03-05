import { db, userProfiles } from '@quiz/db';
import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';

import { badRequest, notFound, unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
import { withLogging } from '@/lib/withLogging';
import { TokenService } from '@/modules/auth/token.service';

export const dynamic = 'force-dynamic';

interface ProfileUpdateBody {
  name?: string;
  professionalStatus?: string;
  educationLevel?: string;
  bio?: string;
}

async function getHandler(_req: NextRequest) {
  try {
    const _token = TokenService.getAccessToken(_req, { scope: 'user' });
    if (typeof _token !== 'string' || _token.trim() === '') {
      return ApiResponse.error(unauthorized('Unauthorized', 'UNAUTHORIZED'));
    }

    const _payload = await TokenService.verifyAccessToken(_token, false);
    if (_payload === null || _payload === undefined || _payload.userId === null || _payload.userId === undefined) {
      return ApiResponse.error(unauthorized('Unauthorized', 'UNAUTHORIZED'));
    }
    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, _payload.userId),
    });

    if (profile === null || profile === undefined) {
      return ApiResponse.error(notFound('Profile', _payload.userId));
    }

    return ApiResponse.success(profile);
  } catch (_error: unknown) {
    return ApiResponse.error(_error, 401);
  }
}

async function patchHandler(_req: NextRequest) {
  try {
    const _token = TokenService.getAccessToken(_req, { scope: 'user' });
    if (_token === null || _token === undefined || _token === '') {
      return ApiResponse.error(unauthorized('Unauthorized', 'UNAUTHORIZED'));
    }

    const _payload = await TokenService.verifyAccessToken(_token, false);
    if (_payload === null || _payload === undefined || _payload.userId === null || _payload.userId === undefined) {
      return ApiResponse.error(unauthorized('Unauthorized', 'UNAUTHORIZED'));
    }
    const rawBody = await _req.json().catch(() => ({}));
    
    if (!validateJsonDepth(rawBody) || !validateJsonSize(rawBody)) {
      return ApiResponse.error(badRequest('Payload too deep or large'));
    }

    const body = sanitizeJsonField(rawBody) as ProfileUpdateBody;

    const [updated] = await db.update(userProfiles)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(userProfiles.userId, _payload.userId))
      .returning();

    if (updated !== undefined && updated !== null) {
        return ApiResponse.success(updated);
    }

    const [inserted] = await db.insert(userProfiles).values({
        userId: _payload.userId,
        name: 'User', 
        ...body
    }).returning();

    return ApiResponse.success(inserted);
  } catch (_error: unknown) {
    return ApiResponse.error(_error, 400);
  }
}

export const GET = withLogging(getHandler, { component: 'auth', operation: 'get_profile' });
export const PATCH = withLogging(patchHandler, { component: 'auth', operation: 'update_profile' });
export const POST = withLogging(patchHandler, { component: 'auth', operation: 'update_profile_alias' });
