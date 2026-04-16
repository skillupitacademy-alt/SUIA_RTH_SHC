import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';

import { badRequest, unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { recordCounter } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { UserRepository } from '@/modules/auth/repositories/user.repository';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';

export const dynamic = 'force-dynamic';

import { withCorrelationId } from '@/lib/correlation-id.middleware';

/**
 * Backend Route: Save user onboarding preferences
 * Pattern: BFF → API Server → DB
 * 
 * CRITICAL: This route saves onboarding data to DB (single source of truth)
 * DO NOT use cookies for onboarding state
 * DO NOT add business logic beyond saving preferences
 */
async function handler(req: NextRequest) {
  const start = Date.now();
  const requestId = req.headers.get('x-request-id') ?? 'no-request-id';

  try {
    console.log('[ONBOARDING][START]', JSON.stringify({
      requestId,
      path: req.nextUrl.pathname,
    }));

    // Extract token from cookies (httpOnly)
    const tokenService = container.get(TokenService);
    const accessToken = tokenService.getAccessToken(req);

    if (accessToken === undefined || accessToken === null || accessToken === '') {
      console.log('[ONBOARDING][NO_TOKEN]', JSON.stringify({ requestId }));
      recordCounter(METRICS.AUTH.FAILURE, 1, { reason: 'no_token' });
      return ApiResponse.error(unauthorized('Authentication required'));
    }

    // Verify token and extract payload
    let payload;
    try {
      payload = await tokenService.verifyAccessToken(accessToken);
    } catch (error) {
      console.log('[ONBOARDING][INVALID_TOKEN]', JSON.stringify({
        requestId,
        error: error instanceof Error ? error.message : 'unknown',
      }));
      recordCounter(METRICS.AUTH.FAILURE, 1, { reason: 'invalid_token' });
      return ApiResponse.error(unauthorized('Invalid authentication'));
    }

    // Parse request body
    const body = await req.json();
    
    // Validate required fields (basic validation)
    if (body === null || body === undefined || typeof body !== 'object') {
      console.log('[ONBOARDING][INVALID_BODY]', JSON.stringify({ requestId }));
      return ApiResponse.error(badRequest('Invalid request body'));
    }

    // Extract onboarding preferences
    const preferences = {
      primaryGoal: typeof body.primaryGoal === 'string' ? body.primaryGoal : undefined,
      domain: typeof body.domain === 'string' ? body.domain : undefined,
      subDomain: typeof body.subDomain === 'string' ? body.subDomain : undefined,
      timeCommitment: typeof body.timeCommitment === 'string' ? body.timeCommitment : undefined,
      journeyStatus: typeof body.journeyStatus === 'string' ? body.journeyStatus : undefined,
    };

    console.log('[ONBOARDING][PREFERENCES]', JSON.stringify({
      requestId,
      userId: payload.userId,
      hasGoal: preferences.primaryGoal !== undefined,
      hasDomain: preferences.domain !== undefined,
    }));

    // Save to DB
    const userRepo = container.get(UserRepository);
    await userRepo.saveUserPreferences(payload.userId, preferences);
    await userRepo.markUserOnboarded(payload.userId);

    const end = Date.now();
    const durationMs = end - start;

    console.log('[ONBOARDING][SUCCESS]', JSON.stringify({
      requestId,
      durationMs,
      userId: payload.userId,
    }));

    recordCounter(METRICS.AUTH.LOGIN, 1, { operation: 'onboarding' });

    return ApiResponse.success({
      success: true,
      message: 'Onboarding completed successfully',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save onboarding';
    console.log('[ONBOARDING][ERROR]', JSON.stringify({
      requestId,
      message,
    }));
    recordCounter(METRICS.AUTH.FAILURE, 1, { reason: 'server_error' });
    return ApiResponse.error(badRequest(message));
  }
}

export const POST = withCorrelationId(
  withLogging(handler, { component: 'auth', operation: 'onboarding' })
);
