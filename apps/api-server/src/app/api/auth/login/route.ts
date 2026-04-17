import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';

import { toUserSummaryDTO } from '@/dtos/auth.dto';
import { badRequest, forbidden, locked, unauthorized, validationError } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { resolveCookieDomain } from '@/lib/cookie-domain';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { resolveRequestBrand, resolveRequestBrandFromHeaders, resolveRequestHostnameFromHeaders } from '@/lib/request-brand';
import { withLogging } from '@/lib/withLogging';
import { AuthService } from '@/modules/auth/auth.service';
import { getClientIp } from '@/modules/auth/client-ip';
import { setCsrfToken } from '@/modules/auth/csrf.middleware';
import { setOnboardingStateCookie } from '@/modules/auth/onboarding-state-cookie';
import { container } from '@/modules/core/container';
import { loginSchema } from '@/schemas/auth.schemas';

export const dynamic = 'force-dynamic';

import { withCorrelationId } from '@/lib/correlation-id.middleware';

async function handler(req: NextRequest) {
  const start = Date.now();
  try {
    const requestId = req.headers.get('x-request-id') ?? 'no-request-id';
    const origin = req.headers.get('origin') ?? 'unknown';
    const host = req.headers.get('host') ?? req.nextUrl.hostname;
    console.log('[AUTH_FLOW][LOGIN][START]', JSON.stringify({
      requestId,
      host,
      origin,
      path: req.nextUrl.pathname,
    }));

    const rawBody = await req.json();
    const parsed = loginSchema.safeParse(rawBody);
    if (!parsed.success) {
      recordCounter(METRICS.AUTH.FAILURE, 1, { reason: 'invalid_payload' });
      console.log('[AUTH_FLOW][LOGIN][FAIL]', JSON.stringify({
        requestId,
        stage: 'validation',
        path: req.nextUrl.pathname,
      }));
      return ApiResponse.error(validationError(parsed.error.issues));
    }
    const { email, password, platform } = parsed.data;
    const ip = getClientIp(req);
    const brand = resolveRequestBrand(platform) ?? resolveRequestBrandFromHeaders(req.headers);

    // 🔐 ENTERPRISE AUTH: Extract device context from request headers
    const deviceContext = {
      deviceId: req.headers.get('x-device-id') ?? undefined,
      userAgent: req.headers.get('user-agent') ?? undefined,
      deviceName: req.headers.get('x-device-name') ?? undefined,
    };

    // DEBUG: Log request details
    console.log('[LOGIN_ROUTE_DEBUG] Request details:', {
      email,
      platform,
      resolvedBrand: brand,
      ip,
      host: req.headers.get('host'),
      origin: req.headers.get('origin'),
      userAgent: req.headers.get('user-agent'),
      deviceId: deviceContext.deviceId,
      deviceName: deviceContext.deviceName,
    });

    if (brand !== 'skillup' && brand !== 'realtutorialhub') {
      console.log('[LOGIN_ROUTE_DEBUG] FAILURE: Invalid brand');
      return ApiResponse.error(badRequest('Brand is required'));
    }

    const { _user, accessToken, refreshToken, isAdmin } = await container.get(AuthService).login(email, password, ip, brand, deviceContext);
    const rawProfile = Array.isArray(_user.profile) ? _user.profile[0] ?? {} : (_user.profile ?? {});
    const authUserInput = {
      id: _user.id,
      email: _user.email,
      createdAt: _user.createdAt,
      emailVerified: (_user as { emailVerified?: boolean }).emailVerified ?? false,
      isOnboarded: (_user as { isOnboarded?: boolean }).isOnboarded ?? false,
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
    });

    const requestHostname = resolveRequestHostnameFromHeaders(req.headers, req.nextUrl.hostname);
    const cookieDomain = resolveCookieDomain(undefined, requestHostname);
    console.log('[AUTH_FLOW][LOGIN][COOKIES]', JSON.stringify({
      requestId,
      host,
      cookieDomain: cookieDomain ?? 'unset',
      accessTokenCookieName: isAdmin === true ? 'admin_accessToken' : 'accessToken',
      refreshTokenCookieName: isAdmin === true ? 'admin_refreshToken' : 'refreshToken',
      sameSite: 'none',
      secure: true,
    }));

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

    setCsrfToken(response, requestHostname);
    setOnboardingStateCookie(response, req, userDto.onboarded === true);

    const end = Date.now();
    const durationMs = end - start;
    recordTimer(METRICS.AUTH.LOGIN + '.duration', durationMs);

    response.headers.set('X-Duration-Ms', durationMs.toString());
    console.log('[AUTH_FLOW][LOGIN][SUCCESS]', JSON.stringify({
      requestId,
      durationMs,
      path: req.nextUrl.pathname,
      role: isAdmin ? 'admin' : 'user',
      cookieDomain: cookieDomain ?? 'unset',
      brand,
    }));

    return response;
  } catch (_error) {
    const message = _error instanceof Error ? _error.message : 'Invalid credentials';
    const requestId = req.headers.get('x-request-id') ?? 'no-request-id';
    
    // Capture debug info for temporary debugging
    const debugInfo = {
      requestId,
      timestamp: new Date().toISOString(),
      error: {
        message,
        name: _error instanceof Error ? _error.name : 'Unknown',
        stack: _error instanceof Error ? _error.stack?.split('\n').slice(0, 3) : undefined
      },
      request: {
        host: req.headers.get('host'),
        origin: req.headers.get('origin'),
        userAgent: req.headers.get('user-agent')?.substring(0, 100)
      }
    };
    
    console.log('[AUTH_FLOW][LOGIN][ERROR]', JSON.stringify({
      requestId,
      path: req.nextUrl.pathname,
      message,
      debugInfo
    }));
    
    recordCounter(METRICS.AUTH.FAILURE, 1, {
      reason: message === 'Account temporarily locked. Try again later.'
        ? 'account_locked'
        : message === 'Account has been blocked. Contact administrator.'
          ? 'account_blocked'
          : 'credentials_invalid'
    });

    if (message === 'Account temporarily locked. Try again later.') {
      return ApiResponse.error(locked(message));
    }

    if (message === 'Account has been blocked. Contact administrator.') {
      return ApiResponse.error(forbidden(message));
    }

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
