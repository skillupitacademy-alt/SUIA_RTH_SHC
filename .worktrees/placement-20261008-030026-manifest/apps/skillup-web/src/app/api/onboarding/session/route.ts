import { NextRequest, NextResponse } from 'next/server';

import {
  ONBOARDING_SESSION_COOKIE,
  onboardingSessionInputSchema,
  serializeOnboardingSessionCookie,
} from '../../../../../../../src/share-branding/onboardingSessionCookie';

export async function POST(request: NextRequest) {
  const payload = onboardingSessionInputSchema.parse(await request.json());
  const response = NextResponse.json({ ok: true });

  response.cookies.set(ONBOARDING_SESSION_COOKIE, serializeOnboardingSessionCookie(payload), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
