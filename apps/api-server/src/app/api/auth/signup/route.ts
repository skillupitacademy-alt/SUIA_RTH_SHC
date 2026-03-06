import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';

import { toUserSummaryDTO } from '@/dtos/auth.dto';
import { badRequest } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { AuthService } from '@/modules/auth/auth.service';
import { setCsrfToken } from '@/modules/auth/csrf.middleware';
import { container } from '@/modules/core/container';
import { signupSchema } from '@/schemas/auth.schemas';

export const dynamic = 'force-dynamic';

async function handler(_req: NextRequest) {
  const start = Date.now();
  try {
    const rawBody = await _req.json();
    const parsed = signupSchema.safeParse(rawBody);
    if (!parsed.success) {
      recordCounter(METRICS.AUTH.FAILURE, 1, { reason: 'invalid_payload', operation: 'signup' });
      return ApiResponse.error(badRequest('Invalid payload', 'BAD_REQUEST', parsed.error.issues));
    }
    const { email, password, name } = parsed.data;

    const authService = container.get(AuthService);
    const _user = await authService.signup(email, password, name);

    // Auto-login after signup
    const { accessToken, refreshToken } = await authService.login(email, password);

    recordCounter(METRICS.AUTH.SIGNUP, 1, { outcome: 'success' });
    recordTimer(METRICS.AUTH.SIGNUP + '.duration', Date.now() - start, { outcome: 'success' });

    // Ensure _user has profile shape for the DTO if needed
    const userForDto = { ..._user, profile: { name } };
    const userDto = toUserSummaryDTO(userForDto, false);

    const response = ApiResponse.success({
      message: 'User created',
      user: userDto,
      accessToken
    });

    const rawDomain = process.env.COOKIE_DOMAIN;
    const cookieDomain = rawDomain === undefined || rawDomain === null || rawDomain === '' ? undefined : rawDomain;

    // Set HttpOnly cookies for Access Token
    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 15 * 60,
      path: '/',
      domain: cookieDomain,
    });

    // Set HttpOnly cookies for Refresh Token
    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
      domain: cookieDomain,
    });

    setCsrfToken(response);

    return response;
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Unknown error';
    recordCounter(METRICS.AUTH.FAILURE, 1, { reason: 'signup_failed', operation: 'signup' });
    recordTimer(METRICS.AUTH.SIGNUP + '.duration', Date.now() - start, { outcome: 'failure' });
    return ApiResponse.error(badRequest(message));
  }
}

export const POST = withLogging(handler, { component: 'auth', operation: 'signup' });
