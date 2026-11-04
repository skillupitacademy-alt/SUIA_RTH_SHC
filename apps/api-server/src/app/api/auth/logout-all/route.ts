/**
 * Logout All Devices API (W1.2-SESS-04)
 * Thin legacy adapter delegating to GlobalLogoutService
 */

import { validateBrandOrThrow } from '@quiz/auth';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import type { RequestBrand } from '@/lib/request-brand';
import { getClientIp } from '@/modules/auth/client-ip';
import {
  GlobalLogoutService,
  PresenceStageError,
  RevocationStageError,
} from '@/modules/auth/global-logout.service';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/logout-all - Logout from all devices
 */
export async function POST(req: NextRequest) {
  const tokenService = container.get(TokenService);
  const globalLogoutService = container.get(GlobalLogoutService);

  // 1. Extract credential preserving Bearer / cookie precedence
  const accessToken = tokenService.getAccessToken(req);
  if (typeof accessToken !== 'string' || accessToken.trim().length === 0) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Cryptographic verification & claims inspection
  let payload: Awaited<ReturnType<typeof tokenService.verifyAccessToken>>;
  try {
    payload = await tokenService.verifyAccessToken(accessToken);
  } catch (_err) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }

  const userId = payload.userId;
  if (typeof userId !== 'string' || userId.trim().length === 0) {
    return NextResponse.json({ error: 'Invalid local subject' }, { status: 401 });
  }

  // Enforce permitted tenant credential class: user or admin only (exclude infra, shc-admin)
  const tokenType = payload.tokenType;
  if (tokenType !== 'user' && tokenType !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: Invalid credential class' }, { status: 403 });
  }

  // Enforce canonical tenant brand (strictly 'skillup' or 'realtutorialhub', exclude generic SHC)
  const brand = payload.brand;
  if (brand !== 'skillup' && brand !== 'realtutorialhub') {
    return NextResponse.json({ error: 'Forbidden: Invalid tenant brand' }, { status: 403 });
  }
  const tenantBrand = brand as RequestBrand;

  // Enforce canonical request / token brand parity
  try {
    validateBrandOrThrow({ brand: payload.brand, userId: payload.userId }, req);
  } catch (brandError) {
    return NextResponse.json(
      { error: brandError instanceof Error ? brandError.message : 'Brand mismatch' },
      { status: 403 }
    );
  }

  // 3. Pre-operation Session-Count Snapshot
  // A failure here is the ONLY confirmed pre-commit failure (revocation not attempted)
  let sessionCount = 0;
  try {
    const sessions = await globalLogoutService.getActiveSessions(userId, tenantBrand);
    sessionCount = sessions.length;
  } catch (_countErr) {
    return NextResponse.json(
      { error: 'Unable to inspect sessions; revocation not attempted' },
      { status: 500 }
    );
  }

  // 4. Delegation to GlobalLogoutService
  const ip = getClientIp(req);
  try {
    await globalLogoutService.logoutAllDevices(userId, ip, tenantBrand);

    return NextResponse.json({
      message: 'Logged out from all devices successfully',
      revokedSessions: sessionCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof PresenceStageError) {
      return NextResponse.json(
        { error: 'Sessions revoked; presence update could not be confirmed' },
        { status: 500 }
      );
    }

    if (error instanceof RevocationStageError) {
      return NextResponse.json(
        { error: 'Session revocation outcome unknown; retry with valid credentials' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Session revocation outcome unknown; retry with valid credentials' },
      { status: 500 }
    );
  }
}
