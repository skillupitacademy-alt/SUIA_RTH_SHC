import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';

import { toUserSummaryDTO } from '@/dtos/auth.dto';
import { unauthorized,validationError } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { withLogging } from '@/lib/withLogging';
import { AuthService } from '@/modules/auth/auth.service';
import { setCsrfToken } from '@/modules/auth/csrf.middleware';
import { container } from '@/modules/core/container';
import { loginSchema } from '@/schemas/auth.schemas';

export const dynamic = 'force-dynamic';

import { withCorrelationId } from '@/lib/correlation-id.middleware';

async function handler(req: NextRequest) {
  const start = Date.now();
  try {
    const rawBody = await req.json();
    const parsed = loginSchema.safeParse(rawBody);
    if (!parsed.success) {
      recordCounter(METRICS.AUTH.FAILURE, 1, { reason: 'invalid_payload' });
      return ApiResponse.error(validationError(parsed.error.issues));
    }
    const { email, password } = parsed.data;

    const { _user, accessToken, refreshToken, isAdmin } = await container.get(AuthService).login(email, password);
    const rawProfile = Array.isArray(_user.profile) ? _user.profile[0] ?? {} : (_user.profile ?? {});
    const authUserInput = {
      id: _user.id,
      email: _user.email,
      createdAt: _user.createdAt,
      emailVerified: (_user as { emailVerified?: boolean }).emailVerified ?? false,
      profile: {
        name: (rawProfile as { name?: string | null }).name ?? null,
        professionalStatus: (rawProfile as { professionalStatus?: string | null }).professionalStatus ?? null,
        educationLevel: (rawProfile as { educationLevel?: string | null }).educationLevel ?? null,
      },
    } satisfies Parameters<typeof toUserSummaryDTO>[0];

    recordCounter(METRICS.AUTH.LOGIN, 1, { role: isAdmin ? 'admin' : 'user' });

    const userDto = toUserSummaryDTO(authUserInput, isAdmin);

    const response = ApiResponse.success({
      user: userDto,
      expiresAt: null,
    });

    const rawDomain = process.env.COOKIE_DOMAIN;
    const cookieDomain = rawDomain === undefined || rawDomain === null || rawDomain === '' ? undefined : rawDomain;

    const accessTokenCookieName = isAdmin === true ? 'admin_accessToken' : 'accessToken';
    response.cookies.set(accessTokenCookieName, accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 15 * 60,
      path: '/',
      domain: cookieDomain,
    });

    const refreshCookieName = isAdmin === true ? 'admin_refreshToken' : 'refreshToken';
    const refreshMaxAge = isAdmin === true ? 24 * 60 * 60 : 7 * 24 * 60 * 60;
    response.cookies.set(refreshCookieName, refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: refreshMaxAge, 
      path: '/',
      domain: cookieDomain,
    });

    setCsrfToken(response);

    const end = Date.now();
    const durationMs = end - start;
    recordTimer(METRICS.AUTH.LOGIN + '.duration', durationMs);
    
    response.headers.set('X-Duration-Ms', durationMs.toString());

    return response;
  } catch (_error) {
    recordCounter(METRICS.AUTH.FAILURE, 1, { reason: 'credentials_invalid' });
    return ApiResponse.error(unauthorized('Invalid credentials'));
  }
}

import { withRateLimit } from '@/middleware/rate-limit.middleware';

export const POST = withRateLimit(
  withCorrelationId(
    withLogging(handler, { component: 'auth', operation: 'login' })
  ),
  { limit: 5, windowMs: 60000 }
);
