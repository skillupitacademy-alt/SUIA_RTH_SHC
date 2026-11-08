import { TokenService } from '@quiz/auth';
import { RBACService } from '@quiz/auth/rbac';
import { normalizeRoles } from '@quiz/auth/rbac/normalize-roles';
import type { Role } from '@quiz/auth/rbac/roles';
import { decodeProtectedHeader } from 'jose';
import type { NextRequest } from 'next/server';
import { getRequiredPagePermission } from './admin-page-policy';

export const EXPECTED_JWT_ISSUER = 'skillhubcore.in';
export const EXPECTED_JWT_ALGORITHM = 'HS256';
export const EXPECTED_JWT_AUDIENCE = 'shc-admin';

export interface AuthenticatedAdminPrincipal {
  userId: string;
  originalUserId: string;
  shadowUserId: string;
  email?: string;
  roles: Role[];
  isAdmin: boolean;
}

export type PageAuthOutcome =
  | { status: 'AUTHORIZED'; user: AuthenticatedAdminPrincipal }
  | { status: 'UNAUTHENTICATED'; reason: 'MISSING_TOKEN' | 'INVALID_TOKEN' | 'EXPIRED_TOKEN'; message: string }
  | { status: 'FORBIDDEN'; reason: 'INSUFFICIENT_PERMISSIONS' | 'FORBIDDEN_ROLE'; message: string; user?: AuthenticatedAdminPrincipal }
  | { status: 'UNAVAILABLE'; reason: 'SERVICE_ERROR'; message: string };

type CookieGetter = (name: string) => { value: string } | string | undefined | null;

/**
 * Normalizes a raw cookie value from either Next.js RequestCookies or string dictionary.
 */
function normalizeCookieValue(raw: { value: string } | string | undefined | null): string | undefined {
  if (typeof raw === 'string') {
    return raw;
  }
  if (raw && typeof raw === 'object' && 'value' in raw && typeof raw.value === 'string') {
    return raw.value;
  }
  return undefined;
}

/**
 * Extracts the access token string following reconciled cookie precedence:
 * - Checks 'accessToken' first; if present and non-empty, selects it.
 * - If 'accessToken' is absent or empty ("" or whitespace), falls back to 'admin_accessToken'.
 * - If selected token is non-empty but fails verification, does NOT fall back to the secondary
 *   cookie to prevent dual-identity masking.
 */
export function extractAccessToken(getCookie: CookieGetter): string | undefined {
  const primaryVal = normalizeCookieValue(getCookie('accessToken'));
  if (primaryVal !== undefined && primaryVal.trim().length > 0) {
    return primaryVal.trim();
  }

  const fallbackVal = normalizeCookieValue(getCookie('admin_accessToken'));
  if (fallbackVal !== undefined && fallbackVal.trim().length > 0) {
    return fallbackVal.trim();
  }

  return undefined;
}

/**
 * Detailed token extraction result preserving source and fallback transparency.
 */
export function extractPageTokenFromCookies(
  getCookie: (name: string) => string | undefined | null
): { token: string | undefined; source: 'accessToken' | 'admin_accessToken' | 'none' } {
  const primary = getCookie('accessToken');
  if (primary !== undefined && primary !== null && primary.trim().length > 0) {
    return { token: primary.trim(), source: 'accessToken' };
  }

  const fallback = getCookie('admin_accessToken');
  if (fallback !== undefined && fallback !== null && fallback.trim().length > 0) {
    return { token: fallback.trim(), source: 'admin_accessToken' };
  }

  return { token: undefined, source: 'none' };
}

/**
 * Verifies an admin JWT and returns the extracted principal.
 * Enforces HS256 algorithm, trusted issuer (skillhubcore.in), finite expiration,
 * not-before constraints, and skillhubcore brand identity.
 */
export async function verifyAdminToken(token: string): Promise<AuthenticatedAdminPrincipal | null> {
  if (!token || token.trim() === '') {
    return null;
  }

  try {
    // 1. Verify protected header algorithm
    const header = decodeProtectedHeader(token);
    if (header.alg !== EXPECTED_JWT_ALGORITHM) {
      return null;
    }

    // 2. Cryptographic signature and audience verification
    const payload = await TokenService.verifyAdminAccessToken(token, { audience: EXPECTED_JWT_AUDIENCE });

    // 3. Pin trusted issuer
    if (payload.iss !== EXPECTED_JWT_ISSUER) {
      return null;
    }

    // 4. Require finite exp claim and verify expiration
    if (typeof payload.exp !== 'number' || !Number.isFinite(payload.exp)) {
      return null;
    }
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (payload.exp <= nowSeconds) {
      return null;
    }

    // 5. Not-before verification if present
    if (payload.nbf !== undefined) {
      if (typeof payload.nbf !== 'number' || !Number.isFinite(payload.nbf) || payload.nbf > nowSeconds) {
        return null;
      }
    }

    // 6. Enforce brand isolation
    if (payload.brand !== 'skillhubcore') {
      return null;
    }

    // 7. Enforce non-empty identity claims
    const originalUserId = payload.originalUserId ?? payload.sub ?? payload.userId;
    const shadowUserId = payload.shadowUserId ?? originalUserId;

    if (
      typeof originalUserId !== 'string' ||
      !originalUserId.trim() ||
      typeof shadowUserId !== 'string' ||
      !shadowUserId.trim()
    ) {
      return null;
    }

    const roles = normalizeRoles(payload.roles);
    const isAdmin = RBACService.isAdminLevel(roles);

    return {
      userId: shadowUserId,
      originalUserId,
      shadowUserId,
      email: typeof payload.email === 'string' ? payload.email : undefined,
      roles,
      isAdmin,
    };
  } catch {
    return null;
  }
}

/**
 * Evaluates server-side page admission for a given token and target pathname.
 * Distinguishes UNAUTHENTICATED (missing/expired/invalid token),
 * FORBIDDEN (non-admin role or insufficient granular page permission),
 * UNAVAILABLE (system failure), and AUTHORIZED.
 */
export async function evaluatePageAccess(
  token: string | undefined,
  pathname: string,
): Promise<PageAuthOutcome> {
  if (!token || token.trim() === '') {
    return {
      status: 'UNAUTHENTICATED',
      reason: 'MISSING_TOKEN',
      message: 'Authentication required. Please log in.',
    };
  }

  // 1. Verify protected header algorithm
  try {
    const header = decodeProtectedHeader(token);
    if (header.alg !== EXPECTED_JWT_ALGORITHM) {
      return {
        status: 'UNAUTHENTICATED',
        reason: 'INVALID_TOKEN',
        message: `Unsupported token algorithm: ${header.alg ?? 'unknown'}`,
      };
    }
  } catch {
    return {
      status: 'UNAUTHENTICATED',
      reason: 'INVALID_TOKEN',
      message: 'Malformed token header.',
    };
  }

  // 2. Cryptographic signature and audience verification
  let payload;
  try {
    payload = await TokenService.verifyAdminAccessToken(token, { audience: EXPECTED_JWT_AUDIENCE });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Token verification failed';
    const errObj = err && typeof err === 'object' ? (err as { name?: string; code?: string }) : undefined;
    const isExpired =
      message.toLowerCase().includes('expired') ||
      errObj?.name === 'TokenExpiredError' ||
      errObj?.name === 'JWTExpired' ||
      errObj?.code === 'ERR_JWT_EXPIRED';

    return {
      status: 'UNAUTHENTICATED',
      reason: isExpired ? 'EXPIRED_TOKEN' : 'INVALID_TOKEN',
      message: isExpired ? 'Session expired. Please log in again.' : 'Invalid authentication token.',
    };
  }

  // 3. Pin trusted issuer
  if (payload.iss !== EXPECTED_JWT_ISSUER) {
    return {
      status: 'UNAUTHENTICATED',
      reason: 'INVALID_TOKEN',
      message: `Untrusted token issuer: ${String(payload.iss)}`,
    };
  }

  // 4. Require finite exp claim and verify expiration
  if (typeof payload.exp !== 'number' || !Number.isFinite(payload.exp)) {
    return {
      status: 'UNAUTHENTICATED',
      reason: 'INVALID_TOKEN',
      message: 'Missing or invalid token expiration claim.',
    };
  }
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (payload.exp <= nowSeconds) {
    return {
      status: 'UNAUTHENTICATED',
      reason: 'EXPIRED_TOKEN',
      message: 'Session expired. Please log in again.',
    };
  }

  // 5. Not-before verification if present
  if (payload.nbf !== undefined) {
    if (typeof payload.nbf !== 'number' || !Number.isFinite(payload.nbf) || payload.nbf > nowSeconds) {
      return {
        status: 'UNAUTHENTICATED',
        reason: 'INVALID_TOKEN',
        message: 'Token is not active yet.',
      };
    }
  }

  // 6. Enforce brand isolation
  if (payload.brand !== 'skillhubcore') {
    return {
      status: 'UNAUTHENTICATED',
      reason: 'INVALID_TOKEN',
      message: 'Invalid brand authorization for SkillHubCore Admin.',
    };
  }

  // 7. Enforce non-empty identity claims
  const originalUserId = payload.originalUserId ?? payload.sub ?? payload.userId;
  const shadowUserId = payload.shadowUserId ?? originalUserId;

  if (
    typeof originalUserId !== 'string' ||
    !originalUserId.trim() ||
    typeof shadowUserId !== 'string' ||
    !shadowUserId.trim()
  ) {
    return {
      status: 'UNAUTHENTICATED',
      reason: 'INVALID_TOKEN',
      message: 'Missing required user identity claims.',
    };
  }

  // 8. Enforce administrator-level role
  const roles = normalizeRoles(payload.roles);
  const isAdmin = RBACService.isAdminLevel(roles);
  const principal: AuthenticatedAdminPrincipal = {
    userId: shadowUserId,
    originalUserId,
    shadowUserId,
    email: typeof payload.email === 'string' ? payload.email : undefined,
    roles,
    isAdmin,
  };

  if (!isAdmin) {
    return {
      status: 'FORBIDDEN',
      reason: 'FORBIDDEN_ROLE',
      message: 'Access restricted to SkillHubCore administrators.',
      user: principal,
    };
  }

  // 9. Enforce granular page-level permissions (e.g. ANALYTICS_VIEW for /marketing, USER_MANAGE for /users)
  const requiredPermission = getRequiredPagePermission(pathname);
  const hasPermission = RBACService.hasPermission(roles, requiredPermission);

  if (!hasPermission) {
    return {
      status: 'FORBIDDEN',
      reason: 'INSUFFICIENT_PERMISSIONS',
      message: `Insufficient permissions: ${requiredPermission} is required to access ${pathname}.`,
      user: principal,
    };
  }

  return {
    status: 'AUTHORIZED',
    user: principal,
  };
}

/**
 * Adapter evaluating access from incoming NextRequest (used by proxy middleware).
 */
export async function evaluateRequestPageAccess(request: NextRequest): Promise<PageAuthOutcome> {
  const token = extractAccessToken((name) => request.cookies.get(name)?.value);
  return evaluatePageAccess(token, request.nextUrl.pathname);
}

/**
 * Adapter evaluating access from Server Component cookie store (used by layouts).
 */
export async function evaluateServerCookiesPageAccess(
  cookieStore: { get(name: string): { value: string } | undefined },
  pathname: string,
): Promise<PageAuthOutcome> {
  const token = extractAccessToken((name) => cookieStore.get(name));
  return evaluatePageAccess(token, pathname);
}
