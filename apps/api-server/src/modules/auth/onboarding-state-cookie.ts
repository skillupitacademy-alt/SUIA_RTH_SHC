import type { NextRequest, NextResponse } from 'next/server';

import { resolveCookieDomain } from '@/lib/cookie-domain';
import { resolveRequestHostnameFromHeaders } from '@/lib/request-brand';

export const ONBOARDING_STATE_COOKIE = 'onboarding_state';

export function setOnboardingStateCookie(
  response: NextResponse,
  request: NextRequest,
  onboardingCompleted: boolean,
) {
  const requestHostname = resolveRequestHostnameFromHeaders(request.headers, request.nextUrl.hostname);
  const cookieDomain = resolveCookieDomain(undefined, requestHostname);

  response.cookies.set(ONBOARDING_STATE_COOKIE, onboardingCompleted ? 'completed' : 'pending', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
    domain: cookieDomain,
  });
}

export function clearOnboardingStateCookie(response: NextResponse, request: NextRequest) {
  const requestHostname = resolveRequestHostnameFromHeaders(request.headers, request.nextUrl.hostname);
  const cookieDomain = resolveCookieDomain(undefined, requestHostname);

  response.cookies.set(ONBOARDING_STATE_COOKIE, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 0,
    path: '/',
    domain: cookieDomain,
  });
}
