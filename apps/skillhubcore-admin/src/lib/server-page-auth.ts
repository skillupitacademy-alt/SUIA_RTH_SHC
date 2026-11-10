import { TokenService, ConfigurationError } from '@quiz/auth';
import { RBACService } from '@quiz/auth/rbac';
import { normalizeRoles } from '@quiz/auth/rbac/normalize-roles';
import type { Role } from '@quiz/auth/rbac/roles';
import { decodeProtectedHeader, jwtVerify, SignJWT } from 'jose';
import type { NextRequest } from 'next/server';
import { getRequiredPagePermission } from './admin-page-policy';
import {
  evaluateAccountAdmission,
  setAccountAuthority,
  type ShcAccountAuthority,
  type ShcAccountState,
  type AccountAdmissionResult,
} from './shc-account-authority';

export {
  evaluateAccountAdmission,
  setAccountAuthority,
  type ShcAccountAuthority,
  type ShcAccountState,
  type AccountAdmissionResult,
};

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
  brand?: string;
  adminScope?: string[];
  allowedBrands?: string[];
  allowedSubtopics?: string[];
}

export interface AdminTokenClaims {
  sub?: string;
  userId?: string;
  originalUserId?: string;
  shadowUserId?: string;
  roles?: Role[] | string[];
  brand?: string;
  email?: string;
  isActive?: boolean;
  accountStatus?: string;
  isRevoked?: boolean;
  sessionRevoked?: boolean;
  adminScope?: string[];
  allowedBrands?: string[];
  allowedSubtopics?: string[];
  iss?: string;
  exp?: number;
  nbf?: number;
}

export type PageAuthOutcome =
  | { status: 'AUTHORIZED'; user: AuthenticatedAdminPrincipal }
  | { status: 'UNAUTHENTICATED'; reason: 'MISSING_TOKEN' | 'INVALID_TOKEN' | 'EXPIRED_TOKEN'; message: string }
  | { status: 'FORBIDDEN'; reason: 'INSUFFICIENT_PERMISSIONS' | 'FORBIDDEN_ROLE'; message: string; user?: AuthenticatedAdminPrincipal }
  | { status: 'UNAVAILABLE'; reason: 'SERVICE_ERROR'; message: string };

/**
 * 🔒 G1: Authoritative current account and session state validator hook.
 * Enables live session revocation, account deactivation, and role demotion verification.
 */
export type AccountStateValidator = (
  userId: string,
  context: { originalUserId: string; brand: string }
) => Promise<{
  isActive: boolean;
  isDeleted: boolean;
  isRevoked?: boolean;
  currentRoles?: Role[];
} | null>;

export function setAccountStateValidator(validator: AccountStateValidator | null) {
  if (!validator) {
    setAccountAuthority(null);
  } else {
    setAccountAuthority({
      async getCurrentAccount({ originalUserId, brand }) {
        const res = await validator(originalUserId, { originalUserId, brand });
        if (!res) return null;
        return {
          id: originalUserId,
          email: 'admin@skillhubcore.in',
          role: (res.currentRoles?.[0] as Role) || 'admin',
          platform: 'skillhubcore',
          isActive: res.isActive,
          deletedAt: res.isDeleted ? new Date() : null,
          isRevoked: res.isRevoked,
        };
      },
    });
  }
}

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
    if (!header.alg || header.alg !== EXPECTED_JWT_ALGORITHM) {
      return null;
    }

    // 2. Cryptographic signature and audience verification
    const rawPayload = await TokenService.verifyAdminAccessToken(token, { audience: EXPECTED_JWT_AUDIENCE });
    const payload = rawPayload as unknown as AdminTokenClaims;

    // 3. MANDATORY trusted issuer
    if (!payload.iss || payload.iss !== EXPECTED_JWT_ISSUER) {
      return null;
    }

    // 4. MANDATORY finite exp claim and verify expiration
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
    if (!payload.brand || payload.brand !== 'skillhubcore') {
      return null;
    }

    // 7. G1: Token-level account status check
    if (
      payload.isActive === false ||
      payload.accountStatus === 'disabled' ||
      payload.isRevoked === true
    ) {
      return null;
    }

    // 8. Enforce non-empty identity claims
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

    // 9. Authoritative live account state check
    const accountAdmission = await evaluateAccountAdmission({
      originalUserId,
      brand: payload.brand,
      token,
      tokenRoles: normalizeRoles(payload.roles),
    });
    if (accountAdmission.status !== 'AUTHORIZED') {
      return null;
    }

    const effectiveRoles = accountAdmission.effectiveRoles;
    const effectiveIsAdmin = accountAdmission.isAdmin;

    return {
      userId: shadowUserId,
      originalUserId,
      shadowUserId,
      email: typeof payload.email === 'string' ? payload.email : undefined,
      roles: effectiveRoles,
      isAdmin: effectiveIsAdmin,
      brand: payload.brand,
      adminScope: payload.adminScope,
      allowedBrands: payload.allowedBrands ?? payload.adminScope,
      allowedSubtopics: payload.allowedSubtopics,
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
  let payload: AdminTokenClaims;
  try {
    const rawPayload = await TokenService.verifyAdminAccessToken(token, { audience: EXPECTED_JWT_AUDIENCE });
    payload = rawPayload as unknown as AdminTokenClaims;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Token verification failed';
    const errObj = err && typeof err === 'object' ? (err as { name?: string; code?: string }) : undefined;

    // G4: Distinguish UNAVAILABLE (configuration or infrastructure errors)
    const isConfigOrServiceError =
      err instanceof ConfigurationError ||
      errObj?.name === 'ConfigurationError' ||
      message.toLowerCase().includes('configuration') ||
      message.toLowerCase().includes('missing required production') ||
      message.toLowerCase().includes('temporarily unavailable') ||
      message.toLowerCase().includes('econnrefused') ||
      message.toLowerCase().includes('etimedout');

    if (isConfigOrServiceError) {
      return {
        status: 'UNAVAILABLE',
        reason: 'SERVICE_ERROR',
        message: 'Authentication service temporarily unavailable.',
      };
    }

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

  // 3. MANDATORY trusted issuer
  if (!payload.iss || payload.iss !== EXPECTED_JWT_ISSUER) {
    return {
      status: 'UNAUTHENTICATED',
      reason: 'INVALID_TOKEN',
      message: `Untrusted token issuer: ${String(payload.iss ?? 'missing')}`,
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
    brand: payload.brand,
    adminScope: payload.adminScope,
    allowedBrands: payload.allowedBrands ?? payload.adminScope,
    allowedSubtopics: payload.allowedSubtopics,
  };

  // G1: Token-level account status & session revocation checks
  if (
    payload.isActive === false ||
    payload.accountStatus === 'disabled' ||
    payload.accountStatus === 'suspended'
  ) {
    return {
      status: 'FORBIDDEN',
      reason: 'FORBIDDEN_ROLE',
      message: 'Administrator account is deactivated or suspended.',
      user: principal,
    };
  }

  if (payload.isRevoked === true || payload.sessionRevoked === true) {
    return {
      status: 'UNAUTHENTICATED',
      reason: 'EXPIRED_TOKEN',
      message: 'Session has been revoked. Please log in again.',
    };
  }

  // 9. G1: Authoritative live account state check (mandatory fail-closed)
  const accountAdmission = await evaluateAccountAdmission({
    originalUserId,
    brand: payload.brand,
    token,
    tokenRoles: roles,
  });

  if (accountAdmission.status === 'UNAVAILABLE') {
    return {
      status: 'UNAVAILABLE',
      reason: 'SERVICE_ERROR',
      message: accountAdmission.message,
    };
  }
  if (accountAdmission.status === 'UNAUTHENTICATED') {
    return {
      status: 'UNAUTHENTICATED',
      reason: accountAdmission.reason === 'REVOKED' ? 'EXPIRED_TOKEN' : 'INVALID_TOKEN',
      message: accountAdmission.message,
    };
  }
  if (accountAdmission.status === 'FORBIDDEN') {
    return {
      status: 'FORBIDDEN',
      reason: 'FORBIDDEN_ROLE',
      message: accountAdmission.message,
      user: principal,
    };
  }

  // 🔒 Reconcile effective roles & privileges (P1: R3-14, R3-15)
  const effectiveRoles = accountAdmission.effectiveRoles;
  const effectiveIsAdmin = accountAdmission.isAdmin;
  const effectivePrincipal: AuthenticatedAdminPrincipal = {
    ...principal,
    roles: effectiveRoles,
    isAdmin: effectiveIsAdmin,
  };

  if (!effectiveIsAdmin) {
    return {
      status: 'FORBIDDEN',
      reason: 'FORBIDDEN_ROLE',
      message: 'Access restricted to SkillHubCore administrators.',
      user: effectivePrincipal,
    };
  }

  // 10. Enforce granular page-level permissions with effective reconciled roles
  const requiredPermission = getRequiredPagePermission(pathname);
  const hasPermission = RBACService.hasPermission(effectiveRoles, requiredPermission);

  if (!hasPermission) {
    return {
      status: 'FORBIDDEN',
      reason: 'INSUFFICIENT_PERMISSIONS',
      message: `Insufficient permissions: ${requiredPermission} is required to access ${pathname}.`,
      user: effectivePrincipal,
    };
  }

  return {
    status: 'AUTHORIZED',
    user: effectivePrincipal,
  };
}

/**
 * Adapter evaluating access from incoming NextRequest (used by proxy middleware).
 */
export async function evaluateRequestPageAccess(request: NextRequest): Promise<PageAuthOutcome> {
  const token = extractAccessToken((name) => request.cookies.get(name)?.value);
  return evaluatePageAccess(token, request.nextUrl.pathname);
}

export const ADMISSION_ASSERTION_AUDIENCE = 'shc-admin-admission';

/**
 * 🔒 R5-22: Compute SHA-256 digest of the access token for session-assertion binding.
 */
export async function computeTokenHash(token: string): Promise<string> {
  if (!token || typeof token !== 'string') return '';
  const encoder = new TextEncoder();
  const data = encoder.encode(token.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 🔒 R5-21 to R5-23: Sign a per-request admission assertion downstream from proxy.
 * Prevents downstream layout double-checking, cryptographically bound to verified session token and pathname.
 */
export async function signPageAdmissionAssertion(
  user: AuthenticatedAdminPrincipal,
  pathname: string,
  token: string,
): Promise<string> {
  const secret = TokenService.ADMIN_SECRET;
  const tokenHash = await computeTokenHash(token);
  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({
    sub: user.originalUserId,
    userId: user.userId,
    originalUserId: user.originalUserId,
    shadowUserId: user.shadowUserId,
    roles: user.roles,
    brand: 'skillhubcore',
    pathname,
    tokenHash,
  })
    .setProtectedHeader({ alg: EXPECTED_JWT_ALGORITHM })
    .setIssuer(EXPECTED_JWT_ISSUER)
    .setAudience(ADMISSION_ASSERTION_AUDIENCE)
    .setIssuedAt(now)
    .setExpirationTime(now + 60)
    .sign(secret);
}

/**
 * 🔒 R5-21 to R5-23: Verify a per-request admission assertion passed from proxy.
 * Enforces algorithm, pinned issuer, audience, exact pathname match, session token hash binding,
 * non-empty identity claims, finite expiry, and administrative privileges.
 */
export async function verifyPageAdmissionAssertion(
  assertion: string,
  expectedPathname: string,
  cookieToken?: string,
): Promise<AuthenticatedAdminPrincipal | null> {
  if (!assertion || typeof assertion !== 'string' || assertion.trim() === '') {
    return null;
  }
  // 🔒 R5-22: Mandatory token-binding: reject assertion if no cookie token is present
  if (!cookieToken || typeof cookieToken !== 'string' || cookieToken.trim() === '') {
    return null;
  }

  try {
    const secret = TokenService.ADMIN_SECRET;
    const { payload } = await jwtVerify(assertion, secret, {
      issuer: EXPECTED_JWT_ISSUER,
      audience: ADMISSION_ASSERTION_AUDIENCE,
      algorithms: [EXPECTED_JWT_ALGORITHM],
    });

    // 1. Mandatory pathname check
    if (
      !payload.pathname ||
      typeof payload.pathname !== 'string' ||
      payload.pathname !== expectedPathname
    ) {
      return null;
    }

    // 2. Token-binding check (SHA-256 hash match against verified cookie)
    const expectedHash = await computeTokenHash(cookieToken);
    if (!payload.tokenHash || payload.tokenHash !== expectedHash) {
      return null;
    }

    // 3. Mandatory brand check
    if (payload.brand !== 'skillhubcore') {
      return null;
    }

    // 4. Mandatory non-empty identity claims
    const originalUserId = String(payload.originalUserId ?? payload.sub ?? '');
    const shadowUserId = String(payload.shadowUserId ?? payload.userId ?? originalUserId);
    if (!originalUserId || !shadowUserId) {
      return null;
    }

    // 5. Mandatory finite exp and iat checks
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== 'number' || payload.exp <= now || payload.exp > now + 120) {
      return null;
    }
    if (typeof payload.iat !== 'number' || payload.iat > now + 5) {
      return null;
    }

    // 6. Role check
    const roles = normalizeRoles((payload.roles as Role[]) ?? []);
    const isAdmin = RBACService.isAdminLevel(roles);
    if (!isAdmin) {
      return null;
    }

    return {
      userId: shadowUserId,
      originalUserId,
      shadowUserId,
      roles,
      isAdmin,
      brand: 'skillhubcore',
    };
  } catch {
    return null;
  }
}

/**
 * Adapter evaluating access from Server Component cookie store (used by layouts).
 * Accepts an optional verified admission assertion passed downstream from proxy middleware.
 */
export async function evaluateServerCookiesPageAccess(
  cookieStore: { get(name: string): { value: string } | undefined },
  pathname: string,
  admissionAssertion?: string | null,
): Promise<PageAuthOutcome> {
  const token = extractAccessToken((name) => cookieStore.get(name));

  if (admissionAssertion && typeof admissionAssertion === 'string') {
    const assertionPrincipal = await verifyPageAdmissionAssertion(
      admissionAssertion,
      pathname,
      token
    );
    if (assertionPrincipal) {
      const requiredPermission = getRequiredPagePermission(pathname);
      const hasPermission = RBACService.hasPermission(assertionPrincipal.roles, requiredPermission);
      if (!hasPermission) {
        return {
          status: 'FORBIDDEN',
          reason: 'INSUFFICIENT_PERMISSIONS',
          message: `Insufficient permissions: ${requiredPermission} is required to access ${pathname}.`,
          user: assertionPrincipal,
        };
      }
      return {
        status: 'AUTHORIZED',
        user: assertionPrincipal,
      };
    }
  }

  return evaluatePageAccess(token, pathname);
}
