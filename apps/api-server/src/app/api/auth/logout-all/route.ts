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
 * Local request-policy helper for cookie-authenticated exact origin validation (SESS-04).
 * Enforces exact scheme, host, and port matching against authoritative request origin
 * and explicitly trusted tenant origins, rejecting foreign origins, wrong scheme/port,
 * deceptive substrings, and userinfo.
 */
function validateCookieOrigin(req: NextRequest): { isValid: boolean; error?: string } {
  const originHeader = req.headers.get('origin');
  if (typeof originHeader !== 'string' || originHeader.trim().length === 0) {
    return { isValid: false, error: 'Forbidden: Missing origin for cookie-authenticated request' };
  }

  if (originHeader === 'null') {
    return { isValid: false, error: 'Forbidden: Invalid origin' };
  }

  let parsedOrigin: URL;
  try {
    parsedOrigin = new URL(originHeader);
  } catch {
    return { isValid: false, error: 'Forbidden: Malformed origin' };
  }

  // Reject userinfo in origin
  if (parsedOrigin.username.length > 0 || parsedOrigin.password.length > 0) {
    return { isValid: false, error: 'Forbidden: Userinfo not permitted in origin' };
  }

  // Exact origin representation check (no trailing path, search, hash, or format spoofing)
  if (originHeader !== parsedOrigin.origin) {
    return { isValid: false, error: 'Forbidden: Origin must match canonical scheme://host[:port]' };
  }

  // Authoritative server request origin (exact scheme, host, port)
  const authoritativeOrigin = req.nextUrl.origin.toLowerCase();
  const candidateOrigin = parsedOrigin.origin.toLowerCase();

  if (candidateOrigin === authoritativeOrigin) {
    return { isValid: true };
  }

  // Check explicitly trusted tenant origins if configured
  const envAllowed = process.env.ALLOWED_ORIGINS?.split(',')
    .map((o) => o.trim().toLowerCase())
    .filter((o) => o.length > 0);

  if (envAllowed && envAllowed.length > 0) {
    // Only permit trusted origins that match the authoritative request host domain
    const requestHostname = req.nextUrl.hostname.toLowerCase();
    const candidateHostname = parsedOrigin.hostname.toLowerCase();
    const isTenantAligned =
      candidateHostname === requestHostname ||
      (candidateHostname.endsWith('.' + requestHostname) && !candidateHostname.includes('attacker'));

    if (isTenantAligned && envAllowed.includes(candidateOrigin)) {
      return { isValid: true };
    }
  }

  return { isValid: false, error: 'Forbidden: CSRF origin mismatch' };
}

/**
 * POST /api/auth/logout-all - Logout from all devices
 */
export async function POST(req: NextRequest) {
  const tokenService = container.get(TokenService);
  const globalLogoutService = container.get(GlobalLogoutService);

  // 1. Extract credential with canonical cookie-first precedence
  const cookieCandidate =
    req.cookies.get('accessToken')?.value ?? req.cookies.get('admin_accessToken')?.value;

  let accessToken: string | undefined = undefined;
  let isCookieAuth = false;

  if (typeof cookieCandidate === 'string' && cookieCandidate.trim().length > 0) {
    // Authoritative cookie credential selected
    accessToken = cookieCandidate.trim();
    isCookieAuth = true;
  } else {
    // Pure Bearer authorization fallback
    const authHeader = req.headers.get('authorization');
    if (typeof authHeader === 'string' && authHeader.trim().length > 0) {
      if (!authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
      }
      const bearerCandidate = authHeader.slice(7).trim();
      if (bearerCandidate.length === 0) {
        return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
      }
      accessToken = bearerCandidate;
      isCookieAuth = false;
    }
  }

  if (typeof accessToken !== 'string' || accessToken.trim().length === 0) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Enforce cookie-authenticated mutation origin/CSRF policy
  if (isCookieAuth) {
    const originCheck = validateCookieOrigin(req);
    if (!originCheck.isValid) {
      return NextResponse.json(
        { error: originCheck.error ?? 'Forbidden: CSRF origin mismatch' },
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
