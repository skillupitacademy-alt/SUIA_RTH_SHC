/**
 * SHC Account Authority Provider
 * 
 * Provides authoritative live account verification for SHC Admin.
 * Verifies active account status, deletion status, current roles,
 * and session state against the authoritative identity store.
 * 
 * Used by both page admission (server-page-auth.ts) and API admission (auth-helpers.ts).
 * 
 * 🔒 SECURITY (R3-05 to R3-16):
 * - NO test bypass or fabricated account branch in production-callable code.
 * - Authenticates against real upstream SHC identity endpoint (/api/shc/auth/me) with access token.
 * - Enforces strict subject matching, platform validation, and boolean active checks.
 * - Derives effective principal with least privilege: stale token claims cannot survive demotion.
 * - Enforces hard deadline via withDeadline to prevent hung providers from blocking admission.
 */

import type { Role } from '@quiz/auth/rbac/roles';
import { RBACService } from '@quiz/auth/rbac';
import { normalizeRoles } from '@quiz/auth/rbac/normalize-roles';
import { ConfigurationError } from '@quiz/auth';
import { FALLBACK_API_BASE_SKILLHUBCORE } from '@/lib/upstream-proxy';

export interface ShcAccountState {
  id: string;
  email: string;
  role: Role;
  platform: string;
  isActive: boolean;
  deletedAt?: Date | string | null;
  isRevoked?: boolean;
}

/**
 * Typed domain error for ineligible account response (HTTP 403) from upstream identity service.
 * 🔒 SECURITY (R6-05): Maps upstream 403 to FORBIDDEN rather than misclassifying as UNAVAILABLE.
 */
export class AccountIneligibleError extends Error {
  constructor(message: string = 'Account is not eligible for SHC Admin access.') {
    super(message);
    this.name = 'AccountIneligibleError';
  }
}

export type AccountAdmissionResult =
  | { status: 'AUTHORIZED'; account: ShcAccountState; effectiveRoles: Role[]; isAdmin: boolean }
  | { status: 'UNAUTHENTICATED'; reason: 'UNKNOWN_ACCOUNT' | 'REVOKED'; message: string }
  | { status: 'FORBIDDEN'; reason: 'DISABLED' | 'DEMOTED'; message: string }
  | { status: 'UNAVAILABLE'; reason: 'SERVICE_ERROR'; message: string };

export interface AccountAuthorityInput {
  originalUserId: string;
  brand: string;
  token: string;
  tokenRoles?: Role[];
  signal?: AbortSignal;
}

export interface ShcAccountAuthority {
  getCurrentAccount(input: AccountAuthorityInput): Promise<ShcAccountState | null>;
}

// Global active authority holder for test harness DI
let activeAuthority: ShcAccountAuthority | null = null;

/**
 * Configure an authoritative account provider.
 * Allows test suites to explicitly inject a mock authority without any production bypass flags.
 */
export function setAccountAuthority(authority: ShcAccountAuthority | null): void {
  activeAuthority = authority;
}

/**
 * Derive effective administrative roles via least privilege intersection.
 * 
 * 🔒 SECURITY (R3-14):
 * - If live account role is not admin or super_admin, no administrative privileges survive.
 * - If live account role is demoted to 'admin', stale 'super_admin' token claims are revoked.
 * - If live account role is 'super_admin' but token only claimed 'admin', do not silently elevate.
 */
export function deriveEffectiveRoles(tokenRoles: Role[] = [], accountRole: Role): Role[] {
  const normalizedAccountRole = normalizeRoles([accountRole])[0];
  const normalizedTokenRoles = normalizeRoles(tokenRoles);

  // If token had no admin privileges, effective role cannot be elevated
  const tokenHasAdmin = normalizedTokenRoles.includes('admin') || normalizedTokenRoles.includes('super_admin');
  if (!tokenHasAdmin) {
    return normalizedTokenRoles;
  }

  // If live account role is not admin or super_admin, no admin privileges
  if (normalizedAccountRole !== 'admin' && normalizedAccountRole !== 'super_admin') {
    return normalizedAccountRole ? [normalizedAccountRole] : [];
  }

  // Live account is admin: override any stale super_admin token claim
  if (normalizedAccountRole === 'admin') {
    return ['admin'];
  }

  // Live account is super_admin: require token to also have super_admin claim
  if (normalizedAccountRole === 'super_admin') {
    if (normalizedTokenRoles.includes('super_admin')) {
      return ['super_admin'];
    }
    return ['admin'];
  }

  return [normalizedAccountRole];
}

/**
 * Wraps a promise with a hard deadline.
 * Cleans up the timeout timer to prevent orphaned timers or unhandled rejections.
 */
export async function withDeadline<T>(
  promise: Promise<T>,
  ms: number,
  timeoutMessage = 'Deadline exceeded'
): Promise<T> {
  let timer: NodeJS.Timeout | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer !== null) {
      clearTimeout(timer);
    }
  }
}

/**
 * Default runtime account provider.
 * 🔒 SECURITY (R3-05 to R3-13):
 * - Queries the real authoritative SHC identity endpoint (/api/shc/auth/me).
 * - Authenticates with the caller's verified access token (Bearer and Cookie).
 * - Strictly NO fabricated accounts based on VITEST, NODE_ENV, or dev flags.
 * - Fails closed if unconfigured or unreachable.
 */
export const defaultShcAccountAuthority: ShcAccountAuthority = {
  async getCurrentAccount(input: AccountAuthorityInput): Promise<ShcAccountState | null> {
    const rawUrl =
      process.env.SHC_IDENTITY_SERVICE_URL ||
      process.env.API_GATEWAY_URL ||
      process.env.GATEWAY_URL ||
      FALLBACK_API_BASE_SKILLHUBCORE;

    if (!rawUrl || rawUrl.trim() === '') {
      throw new ConfigurationError('Missing required configuration for SHC account authority.');
    }

    const baseUrl = rawUrl.trim().replace(/\/+$/, '');
    const normalizedBase = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
    const targetUrl = `${normalizedBase}/shc/auth/me`;

    // 🔒 R5-13: Guard against accidental recursion targeting SHC Admin itself
    try {
      const parsedUrl = new URL(targetUrl);
      if (
        parsedUrl.port === '3007' ||
        (parsedUrl.hostname === 'admin.skillhubcore.in' && !parsedUrl.port && !process.env.SHC_IDENTITY_SERVICE_URL)
      ) {
        throw new ConfigurationError(
          'Recursive destination rejected: SHC account authority cannot target SHC Admin itself.'
        );
      }
    } catch (urlErr) {
      if (urlErr instanceof ConfigurationError) throw urlErr;
      throw new ConfigurationError(`Malformed SHC identity URL: ${targetUrl}`);
    }

    const internalSecret =
      process.env.INTERNAL_GATEWAY_SECRET ||
      process.env.INTERNAL_API_SECRET ||
      process.env.GATEWAY_TRUST_SECRET;

    if (process.env.NODE_ENV === 'production' && !internalSecret) {
      throw new ConfigurationError('Missing required internal gateway secret in production.');
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${input.token}`,
      'Cookie': `accessToken=${input.token}; admin_accessToken=${input.token}`,
      'Accept': 'application/json',
      'Host': 'admin.skillhubcore.in',
      'x-forwarded-host': 'admin.skillhubcore.in',
      'x-original-host': 'admin.skillhubcore.in',
      'x-forwarded-proto': 'https',
      'x-brand': 'skillhubcore',
    };

    if (internalSecret) {
      headers['x-internal-secret'] = internalSecret;
      headers['x-gateway-secret'] = internalSecret;
    }

    const res = await fetch(targetUrl, {
      method: 'GET',
      headers,
      signal: input.signal,
      cache: 'no-store',
    });

    if (res.status === 401 || res.status === 404) {
      return null;
    }

    // 🔒 R6-05: Handle 403 Forbidden with typed error so admission classifies as FORBIDDEN, not UNAVAILABLE
    if (res.status === 403) {
      throw new AccountIneligibleError('Account is not eligible for SHC Admin access.');
    }

    if (!res.ok) {
      throw new Error(`Upstream identity service returned status ${res.status}`);
    }

    const data = await res.json();
    const user = data.user || data.data?.user;
    if (!user || typeof user !== 'object') {
      throw new Error('Malformed user payload from upstream identity service');
    }

    return {
      id: String(user.id),
      email: String(user.email ?? ''),
      role: user.role as Role,
      platform: String(user.platform ?? ''),
      isActive: user.isActive === true,
      deletedAt: user.deletedAt ?? null,
      isRevoked: user.isRevoked === true,
    };
  },
};

/**
 * Get the effective account authority.
 */
export function getAccountAuthority(): ShcAccountAuthority {
  if (activeAuthority) {
    return activeAuthority;
  }
  return defaultShcAccountAuthority;
}

/**
 * Authoritatively evaluates an administrator account for admission.
 * Fails closed on any discrepancy, missing account, or service outage.
 * 
 * 🔒 SECURITY (R3-12, R3-23):
 * - Guarantees hard deadline bounded by timeoutMs.
 * - Reconciles token claims with live account status.
 */
export async function evaluateAccountAdmission(
  input: AccountAuthorityInput,
  options?: { timeoutMs?: number; signal?: AbortSignal }
): Promise<AccountAdmissionResult> {
  const authority = getAccountAuthority();
  const timeoutMs = options?.timeoutMs ?? 3000;
  const controller = new AbortController();

  if (options?.signal) {
    options.signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  try {
    const admissionPromise = authority.getCurrentAccount({
      ...input,
      signal: controller.signal,
    });

    // Enforce hard caller deadline via withDeadline
    const account = await withDeadline(
      admissionPromise,
      timeoutMs,
      `Authoritative identity service timed out after ${timeoutMs}ms.`
    );

    // 1. Unknown or null account
    if (!account) {
      return {
        status: 'UNAUTHENTICATED',
        reason: 'UNKNOWN_ACCOUNT',
        message: 'Administrator account not found in authoritative identity store.',
      };
    }

    // 2. Strict ID matching (originalUserId)
    if (account.id !== input.originalUserId) {
      return {
        status: 'UNAUTHENTICATED',
        reason: 'UNKNOWN_ACCOUNT',
        message: 'Account identity mismatch between token and authoritative record.',
      };
    }

    // 3. Platform matching (must be 'skillhubcore')
    if (account.platform !== 'skillhubcore') {
      return {
        status: 'FORBIDDEN',
        reason: 'DEMOTED',
        message: `Account platform '${account.platform}' is not authorized for SHC Admin.`,
      };
    }

    // 4. Deleted account or explicitly revoked session
    if (account.deletedAt || account.isRevoked) {
      return {
        status: 'UNAUTHENTICATED',
        reason: 'REVOKED',
        message: 'Account or session has been deleted or revoked.',
      };
    }

    // 5. Deactivated account (strict boolean check)
    if (account.isActive !== true) {
      return {
        status: 'FORBIDDEN',
        reason: 'DISABLED',
        message: 'Administrator account is deactivated.',
      };
    }

    // 6. Effective roles derivation and privilege check
    const effectiveRoles = deriveEffectiveRoles(input.tokenRoles ?? [], account.role);
    const isAdmin = RBACService.isAdminLevel(effectiveRoles);
    if (!isAdmin) {
      return {
        status: 'FORBIDDEN',
        reason: 'DEMOTED',
        message: 'Administrator privileges have been revoked for this account.',
      };
    }

    return {
      status: 'AUTHORIZED',
      account,
      effectiveRoles,
      isAdmin,
    };
  } catch (error: unknown) {
    controller.abort();
    // 🔒 R6-05: Map upstream 403 / AccountIneligibleError to FORBIDDEN (DEMOTED)
    if (error instanceof AccountIneligibleError) {
      return {
        status: 'FORBIDDEN',
        reason: 'DEMOTED',
        message: error.message || 'Account is not eligible for SHC Admin access.',
      };
    }
    const message = error instanceof Error ? error.message : 'Identity service error';
    return {
      status: 'UNAVAILABLE',
      reason: 'SERVICE_ERROR',
      message: `Authoritative identity service unavailable: ${message}`,
    };
  }
}
