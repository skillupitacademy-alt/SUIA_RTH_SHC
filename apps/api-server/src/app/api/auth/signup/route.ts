import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';

import { toUserSummaryDTO } from '@/dtos/auth.dto';
import { badRequest } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { resolveCookieDomain } from '@/lib/cookie-domain';
import { withCorrelationId } from '@/lib/correlation-id.middleware';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { resolveRequestBrand, resolveRequestBrandFromHeaders, resolveRequestHostnameFromHeaders } from '@/lib/request-brand';
import { withLogging } from '@/lib/withLogging';
import { withRateLimit } from '@/middleware/rate-limit.middleware';
import { AuthService } from '@/modules/auth/auth.service';
import { getClientIp } from '@/modules/auth/client-ip';
import { setCsrfToken } from '@/modules/auth/csrf.middleware';
import { setOnboardingStateCookie } from '@/modules/auth/onboarding-state-cookie';
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
    const { email, password, name, platform } = parsed.data;
    const ip = getClientIp(_req);
    const brand = resolveRequestBrand(platform) ?? resolveRequestBrandFromHeaders(_req.headers);

    if (brand !== 'skillup' && brand !== 'realtutorialhub') {
      return ApiResponse.error(badRequest('Brand is required'));
    }

    const authService = container.get(AuthService);
    const _user = await authService.signup(email, password, name, ip, brand);

    // Auto-login after signup
    const { accessToken, refreshToken } = await authService.login(email, password, ip, brand);

    recordCounter(METRICS.AUTH.SIGNUP, 1, { outcome: 'success' });
    recordTimer(METRICS.AUTH.SIGNUP + '.duration', Date.now() - start, { outcome: 'success' });

    // Ensure _user has profile shape for the DTO if needed
    const userForDto = { ..._user, profile: { name, onboardingCompleted: false } };
    const userDto = toUserSummaryDTO(userForDto, false);

    const response = ApiResponse.success({
      message: 'User created',
      user: userDto,
    });

    const requestHostname = resolveRequestHostnameFromHeaders(_req.headers, _req.nextUrl.hostname);
    const cookieDomain = resolveCookieDomain(undefined, requestHostname);

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

    setCsrfToken(response, requestHostname);
    setOnboardingStateCookie(response, _req, false);

    return response;
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Unknown error';
    recordCounter(METRICS.AUTH.FAILURE, 1, { reason: 'signup_failed', operation: 'signup' });
    recordTimer(METRICS.AUTH.SIGNUP + '.duration', Date.now() - start, { outcome: 'failure' });
    return ApiResponse.error(badRequest(message));
  }
}

export const POST = withRateLimit(
  withCorrelationId(withLogging(handler, { component: 'auth', operation: 'signup' })),
  { limit: 10, windowMs: 60 * 60 * 1000, keyPrefix: 'ratelimit:auth:signup' }
);
