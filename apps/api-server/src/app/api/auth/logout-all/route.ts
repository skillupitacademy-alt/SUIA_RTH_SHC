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

function isTenantAudienceValid(tokenType: string | undefined, aud: unknown): boolean {
  if (typeof aud === 'string') {
    if (tokenType === 'user') {
      return aud === 'user';
    }
    if (tokenType === 'admin') {
      return aud === 'admin';
    }
    return false;
  }

  if (Array.isArray(aud)) {
    const excludedAudiences = new Set(['infra', 'shc-admin']);
    if (aud.some((a) => typeof a === 'string' && excludedAudiences.has(a))) {
      return false;
    }

    if (tokenType === 'user') {
      return aud.length === 1 && aud[0] === 'user';
    }

    if (tokenType === 'admin') {
      const validAdminAuds = new Set(['admin', 'internal']);
      const hasAdmin = aud.includes('admin');
      const allValid = aud.every((a) => typeof a === 'string' && validAdminAuds.has(a));
      return hasAdmin && allValid;
    }
  }

  return false;
}

/**
 * POST /api/auth/logout-all - Logout from all devices
 */
export async function POST(req: NextRequest) {
  const tokenService = container.get(TokenService);
  const globalLogoutService = container.get(GlobalLogoutService);

  // 1. Extract credential preserving Bearer / cookie precedence
  const authHeader = req.headers.get('authorization');
  const hasBearerHeader =
    typeof authHeader === 'string' &&
    authHeader.startsWith('Bearer ') &&
    authHeader.slice(7).trim().length > 0;

  let accessToken: string | undefined = undefined;
  let isCookieAuth = false;

  if (hasBearerHeader) {
    const candidate = authHeader.slice(7).trim();
    try {
      await tokenService.verifyAccessToken(candidate);
      accessToken = candidate;
    } catch {
      // An invalid bearer header must NOT fall through to cookie credentials
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
  }

  if (typeof accessToken !== 'string' || accessToken.trim().length === 0) {
    const cookieToken =
      req.cookies.get('accessToken')?.value ?? req.cookies.get('admin_accessToken')?.value;
    if (typeof cookieToken === 'string' && cookieToken.trim().length > 0) {
      accessToken = cookieToken.trim();
      isCookieAuth = true;
    }
  }

  if (typeof accessToken !== 'string' || accessToken.trim().length === 0) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Enforce cookie-authenticated mutation origin/CSRF policy
  if (isCookieAuth) {
    const originHeader = req.headers.get('origin');
    if (typeof originHeader !== 'string' || originHeader.trim().length === 0) {
      return NextResponse.json(
        { error: 'Forbidden: Missing origin for cookie-authenticated request' },
        { status: 403 }
      );
    }

    let parsedOrigin: URL;
    try {
      parsedOrigin = new URL(originHeader);
    } catch {
      return NextResponse.json(
        { error: 'Forbidden: Malformed origin' },
        { status: 403 }
      );
    }

    const requestHost = (req.headers.get('host') ?? req.nextUrl.host).toLowerCase();
    const originHost = parsedOrigin.host.toLowerCase();

    // Exact parsed origin host match (no substring comparisons)
    const allowedHosts = new Set([
      requestHost,
      requestHost.split(':')[0],
      'skillup.test',
      'realtutorialhub.test',
      'localhost:3000',
      'localhost:3001',
      'localhost:3002',
      'localhost:3003',
    ]);

    if (!allowedHosts.has(originHost)) {
      return NextResponse.json(
        { error: 'Forbidden: CSRF origin mismatch' },
        { status: 403 }
      );
    }
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

  // Enforce audience/class contract before session count or mutation
  if (!isTenantAudienceValid(tokenType, payload.aud)) {
    return NextResponse.json(
      { error: 'Forbidden: Excluded or contradictory credential audience' },
      { status: 403 }
    );
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
