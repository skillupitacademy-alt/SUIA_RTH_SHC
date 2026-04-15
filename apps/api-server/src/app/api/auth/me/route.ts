import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';

import { toUserSummaryDTO } from '@/dtos/auth.dto';
import { unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { recordCounter } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { UserRepository } from '@/modules/auth/repositories/user.repository';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';

export const dynamic = 'force-dynamic';

import { withCorrelationId } from '@/lib/correlation-id.middleware';

/**
 * Backend Route: Get current authenticated user
 * Pattern: BFF → API Server → DB
 * 
 * CRITICAL: This route extracts user info from JWT token (httpOnly cookie)
 * DO NOT expose tokens to frontend
 * DO NOT add business logic here - only user state retrieval
 */
async function handler(req: NextRequest) {
  const start = Date.now();
  const requestId = req.headers.get('x-request-id') ?? 'no-request-id';

  try {
    console.log('[AUTH_FLOW][ME][START]', JSON.stringify({
      requestId,
      path: req.nextUrl.pathname,
    }));

    // Extract token from cookies (httpOnly)
    const tokenService = container.get(TokenService);
    const accessToken = tokenService.getAccessToken(req);

    if (accessToken === undefined || accessToken === null || accessToken === '') {
      console.log('[AUTH_FLOW][ME][NO_TOKEN]', JSON.stringify({ requestId }));
      recordCounter(METRICS.AUTH.FAILURE, 1, { reason: 'no_token' });
      return ApiResponse.json({ user: null }, { status: 401 });
    }

    // Verify token and extract payload
    let payload;
    try {
      payload = await tokenService.verifyAccessToken(accessToken);
    } catch (error) {
      console.log('[AUTH_FLOW][ME][INVALID_TOKEN]', JSON.stringify({
        requestId,
        error: error instanceof Error ? error.message : 'unknown',
      }));
      recordCounter(METRICS.AUTH.FAILURE, 1, { reason: 'invalid_token' });
      return ApiResponse.json({ user: null }, { status: 401 });
    }

    // Get user from DB
    const userRepo = container.get(UserRepository);
    const user = await userRepo.findByIdWithDetails(payload.userId);

    if (!user) {
      console.log('[AUTH_FLOW][ME][USER_NOT_FOUND]', JSON.stringify({
        requestId,
        userId: payload.userId,
      }));
      recordCounter(METRICS.AUTH.FAILURE, 1, { reason: 'user_not_found' });
      return ApiResponse.json({ user: null }, { status: 401 });
    }

    // Check if user is blocked
    if (user.isBlocked) {
      console.log('[AUTH_FLOW][ME][USER_BLOCKED]', JSON.stringify({
        requestId,
        userId: user.id,
      }));
      recordCounter(METRICS.AUTH.FAILURE, 1, { reason: 'user_blocked' });
      return ApiResponse.error(unauthorized('Account has been blocked'));
    }

    // Build user DTO
    const rawProfile = Array.isArray(user.profile) ? user.profile[0] ?? {} : (user.profile ?? {});
    const authUserInput = {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      emailVerified: user.emailVerified ?? false,
      isOnboarded: user.isOnboarded ?? false,
      profile: {
        name: (rawProfile as { name?: string | null }).name ?? null,
        professionalStatus: (rawProfile as { professionalStatus?: string | null }).professionalStatus ?? null,
        educationLevel: (rawProfile as { educationLevel?: string | null }).educationLevel ?? null,
      },
    } satisfies Parameters<typeof toUserSummaryDTO>[0];

    const roleNames = user.userRoles
      .map((ur) => ur.role.name?.trim().toLowerCase())
      .filter((role): role is string => typeof role === 'string' && role.length > 0);
    const isAdmin = roleNames.includes('admin') || roleNames.includes('super_admin') || roleNames.includes('infrastructure');

    const userDto = toUserSummaryDTO(authUserInput, isAdmin);

    const end = Date.now();
    const durationMs = end - start;

    console.log('[AUTH_FLOW][ME][SUCCESS]', JSON.stringify({
      requestId,
      durationMs,
      userId: user.id,
      role: isAdmin ? 'admin' : 'user',
    }));

    recordCounter(METRICS.AUTH.SUCCESS, 1, { operation: 'get_me' });

    return ApiResponse.success({
      user: userDto,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get user';
    console.log('[AUTH_FLOW][ME][ERROR]', JSON.stringify({
      requestId,
      message,
    }));
    recordCounter(METRICS.AUTH.FAILURE, 1, { reason: 'server_error' });
    return ApiResponse.json({ user: null }, { status: 500 });
  }
}

export const GET = withCorrelationId(
  withLogging(handler, { component: 'auth', operation: 'me' })
);
