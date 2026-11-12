import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { TokenService } from '@quiz/auth';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * Dedicated, test-only SkillUp auth endpoint for Project LLM learner runtime verification.
 * 
 * INVARIANTS:
 * 1. Forbidden in production environments (strictly NODE_ENV !== 'production').
 * 2. Issues only short-lived (15 min) test sessions for non-production seeded fixtures.
 * 3. Does not expose raw database passwords or user credentials.
 */
export async function POST(request: NextRequest) {
  const deployedProduction = process.env.VERCEL_ENV === 'production' ||
    process.env.APP_ENV === 'production' || process.env.ENVIRONMENT === 'production';
  if (deployedProduction || process.env.NODE_ENV === 'production' ||
      process.env.PROJECT_LLM_LEARNER_RUNTIME_ENABLED !== 'true') {
    return NextResponse.json(
      { error: 'Test fixture auth endpoint is disabled in production' },
      { status: 403 }
    );
  }

  // This route mints a bearer session and must never be an unauthenticated
  // convenience endpoint, even in development. Project LLM supplies this
  // server-owned shared secret; it is not part of a candidate package.
  const expectedSecret = process.env.PROJECT_LLM_FIXTURE_SESSION_SECRET;
  const suppliedSecret = request.headers.get('x-project-llm-fixture-secret');
  if (!expectedSecret || expectedSecret.length < 32 || !suppliedSecret) {
    return NextResponse.json({ error: 'Fixture session authorization is unavailable' }, { status: 503 });
  }
  const expected = Buffer.from(expectedSecret);
  const supplied = Buffer.from(suppliedSecret);
  if (expected.length !== supplied.length || !crypto.timingSafeEqual(expected, supplied)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    let body: { fixtureId?: string; tenant?: string } = {};
    try {
      body = await request.json();
    } catch {
      // Body is optional
    }

    const configuredTenant = process.env.PROJECT_LLM_TEST_TENANT;
    const configuredFixtureIds = (process.env.PROJECT_LLM_TEST_FIXTURE_IDS || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    const testTenant = (body.tenant || configuredTenant || '').toLowerCase();
    const fixtureId = body.fixtureId || '';
    const testLearnerId = process.env.PROJECT_LLM_TEST_LEARNER_ID || '';
    if (!configuredTenant || testTenant !== 'skillup' || testTenant !== configuredTenant.toLowerCase()) {
      return NextResponse.json({ error: 'Unknown test tenant' }, { status: 400 });
    }
    if (!fixtureId || !configuredFixtureIds.includes(fixtureId)) {
      return NextResponse.json({ error: 'Unknown test fixture' }, { status: 400 });
    }
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(testLearnerId)) {
      return NextResponse.json({ error: 'Fixture learner UUID is not configured' }, { status: 503 });
    }
    const expiresAtMs = Date.now() + 15 * 60 * 1000; // 15 minutes
    const expiresAt = new Date(expiresAtMs).toISOString();

    const token = await TokenService.generateAccessToken(
      {
        userId: testLearnerId,
        email: `${testLearnerId}@${testTenant}.internal`,
        roles: ['student'],
        aud: 'user',
        brand: 'skillup',
        platforms: ['skillup'],
        originalUserId: testLearnerId,
        shadowUserId: testLearnerId,
        portalIdentity: 'user',
      },
      '15m'
    );

    const learnerIdHash = crypto
      .createHash('sha256')
      .update(testLearnerId)
      .digest('hex');

    return NextResponse.json({
      cookieName: 'accessToken',
      cookieValue: token,
      domain: `${testTenant}.localhost`,
      expiresAt,
      learnerIdHash,
      testTenant,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json(
      { error: 'Failed to generate test fixture session' },
      { status: 500 }
    );
  }
}

