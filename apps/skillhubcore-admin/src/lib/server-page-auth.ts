import { TokenService } from '@quiz/auth';
import { RBACService } from '@quiz/auth/rbac';
import { normalizeRoles } from '@quiz/auth/rbac/normalize-roles';
import type { Role } from '@quiz/auth/rbac/roles';
import type { NextRequest } from 'next/server';
import { getRequiredPagePermission } from './admin-page-policy';

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
 * Extracts the access token string following consistent precedence:
 * checks 'accessToken' first; if present, uses it strictly.
 * Only falls back to 'admin_accessToken' if 'accessToken' is completely absent.
 * If 'accessToken' is present but invalid/expired, we DO NOT fall back to 'admin_accessToken'
 * to avoid masking identity conflicts.
 */
export function extractAccessToken(getCookie: CookieGetter): string | undefined {
  const rawPrimary = getCookie('accessToken');
  const primaryVal = typeof rawPrimary === 'string'
    ? rawPrimary
    : rawPrimary && typeof rawPrimary === 'object' && 'value' in rawPrimary
      ? rawPrimary.value
      : undefined;

  if (primaryVal !== undefined) {
    return primaryVal;
  }

  const rawFallback = getCookie('admin_accessToken');
  const fallbackVal = typeof rawFallback === 'string'
    ? rawFallback
    : rawFallback && typeof rawFallback === 'object' && 'value' in rawFallback
      ? rawFallback.value
      : undefined;

  return fallbackVal;
}

/**
 * Verifies the admin access token using TokenService with explicit shc-admin audience.
 * Enforces brand=skillhubcore, required non-empty identity claims, and admin-level role.
 */
export async function verifyAdminToken(token: string): Promise<AuthenticatedAdminPrincipal | null> {
  if (!token || typeof token !== 'string' || token.trim() === '') {
    return null;
  }

  try {
    const payload = await TokenService.verifyAdminAccessToken(token, { audience: 'shc-admin' });
    if (payload.brand !== 'skillhubcore') {
      return null;
    }

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
 * and AUTHORIZED.
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

  let payload;
  try {
    payload = await TokenService.verifyAdminAccessToken(token, { audience: 'shc-admin' });
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

  if (payload.brand !== 'skillhubcore') {
    return {
      status: 'UNAUTHENTICATED',
      reason: 'INVALID_TOKEN',
      message: 'Invalid brand authorization for SkillHubCore Admin.',
    };
  }

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
      message: 'Token missing required user identity claims.',
    };
  }

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

  // Must have admin-level role (admin or super_admin)
  if (!isAdmin) {
    return {
      status: 'FORBIDDEN',
      reason: 'FORBIDDEN_ROLE',
      message: 'Access denied: Admin role required for SkillHubCore Admin.',
      user: principal,
    };
  }

  // Check required page permission
  const requiredPermission = getRequiredPagePermission(pathname);
  if (!RBACService.hasPermission(roles, requiredPermission)) {
    return {
      status: 'FORBIDDEN',
      reason: 'INSUFFICIENT_PERMISSIONS',
      message: `Access denied: Missing required permission [${requiredPermission}].`,
      user: principal,
    };
  }

  return {
    status: 'AUTHORIZED',
    user: principal,
  };
}

/**
 * Adapter evaluating page access from a NextRequest instance (used in Proxy/middleware).
 */
export async function evaluateRequestPageAccess(request: NextRequest): Promise<PageAuthOutcome> {
  const token = extractAccessToken((name) => request.cookies.get(name)?.value);
  return evaluatePageAccess(token, request.nextUrl.pathname);
}

/**
 * Adapter evaluating page access from a Server Component cookie store.
 */
export async function evaluateServerCookiesPageAccess(
  cookies: { get: (name: string) => { value: string } | undefined },
  pathname: string,
): Promise<PageAuthOutcome> {
  const token = extractAccessToken((name) => cookies.get(name)?.value);
  return evaluatePageAccess(token, pathname);
}

