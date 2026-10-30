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
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Test fixture auth endpoint is disabled in production' },
      { status: 403 }
    );
  }

  try {
    let body: { fixtureId?: string; tenant?: string } = {};
    try {
      body = await request.json();
    } catch {
      // Body is optional
    }

    const testTenant = (body.tenant || 'skillup').toLowerCase();
    const testLearnerId = body.fixtureId || 'test-fixture-learner-01';
    const expiresAtMs = Date.now() + 15 * 60 * 1000; // 15 minutes
    const expiresAt = new Date(expiresAtMs).toISOString();

    const token = await TokenService.generateAccessToken(
      {
        userId: testLearnerId,
        email: `${testLearnerId}@${testTenant}.internal`,
        roles: ['student'],
        aud: testTenant,
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
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to generate test fixture session';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
