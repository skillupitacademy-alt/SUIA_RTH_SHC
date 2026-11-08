import { eq } from 'drizzle-orm';

import { logger } from '@/lib/logger';
import { type RequestBrand } from '@/lib/request-brand';
import { getAuthBrandContext, shouldUseBrandBinding } from '@/modules/auth/brand-db';

import type { TokenPayload } from './token.service';

const log = logger.child({ module: 'auth:rbac' });

/**
 * Shared non-privileged tenant account eligibility check (ADMIN-01).
 *
 * Verifies that a user account exists and is not blocked within the specified
 * canonical tenant database ('skillup' or 'realtutorialhub').
 *
 * Non-privileged: Does not require administrative token claims or audiences.
 * Reused by both _verifyAdmin and proxy routing for infrastructure tenant operations.
 */
export async function _verifyActiveAccount(userId: string, brand: string): Promise<boolean> {
  // 1. Validate canonical tenant brand strictly (Zero silent fallback to RTH)
  if (brand !== 'skillup' && brand !== 'realtutorialhub') {
    log.warn({ brand, userId }, 'Account eligibility check: invalid tenant brand — denying');
    return false;
  }

  // 2. Validate non-empty tenant subject
  if (typeof userId !== 'string' || userId.trim().length === 0) {
    log.warn({ brand }, 'Account eligibility check: empty or invalid subject — denying');
    return false;
  }

  const tenantBrand = brand as RequestBrand;
  const authContext = shouldUseBrandBinding()
    ? getAuthBrandContext(tenantBrand)
    : getAuthBrandContext('realtutorialhub');

  try {
    const users = await authContext.db
      .select({ isBlocked: authContext.tables.users.isBlocked })
      .from(authContext.tables.users)
      .where(eq(authContext.tables.users.id, userId.trim()))
      .limit(1);

    if (users.length === 0) {
      log.warn({ userId, brand: tenantBrand }, 'Account eligibility check: user not found in tenant DB — denying');
      return false;
    }

    if (users[0].isBlocked === true) {
      log.warn({ userId, brand: tenantBrand }, 'Account eligibility check: user is blocked — denying');
      return false;
    }

    return true;
  } catch (err) {
    log.error(
      {
        userId,
        brand: tenantBrand,
        message: err instanceof Error ? err.message : String(err),
      },
      'Account eligibility check: DB error — denying (fail closed)'
    );
    return false;
  }
}

/**
 * Strict tenant-admin authorization helper (ADMIN-01).
 *
 * Enforces strict principal preconditions before any database access:
 * - Canonical tenant brand ('skillup' | 'realtutorialhub')
 * - Non-empty tenant-local subject
 * - Runtime admin class consistency (tokenType === 'admin' AND isAdmin === true)
 * - Required audience: scalar 'admin' or array including 'admin' (e.g. ['admin', 'internal'])
 *
 * Checks active account status via _verifyActiveAccount (fail-closed on DB errors).
 * Obsolete role-fallback is removed: principals failing class preconditions are denied.
 */
export async function _verifyAdmin(_payload: TokenPayload): Promise<boolean> {
  // 1. Canonical Tenant Brand: strictly 'skillup' or 'realtutorialhub'
  if (_payload.brand !== 'skillup' && _payload.brand !== 'realtutorialhub') {
    log.warn({ brand: _payload.brand, userId: _payload.userId }, 'RBAC admin check: non-tenant brand — denying');
    return false;
  }

  // 2. Non-Empty Tenant Subject
  if (typeof _payload.userId !== 'string' || _payload.userId.trim().length === 0) {
    log.warn({ brand: _payload.brand }, 'RBAC admin check: empty or invalid subject — denying');
    return false;
  }

  // 3. Runtime Admin Class Preconditions: tokenType === 'admin' AND isAdmin === true
  if (_payload.tokenType !== 'admin' || _payload.isAdmin !== true) {
    log.warn(
      { userId: _payload.userId, tokenType: _payload.tokenType, isAdmin: _payload.isAdmin },
      'RBAC admin check: inconsistent or non-admin token class — denying'
    );
    return false;
  }

  // 4. Audience Precondition: scalar 'admin' or array including 'admin'
  const aud: unknown = _payload.aud;
  let isAudienceValid = false;

  if (typeof aud === 'string') {
    isAudienceValid = aud === 'admin';
  } else if (Array.isArray(aud)) {
    // Array must contain 'admin'. 'internal' alone is insufficient!
    // Permitted elements: 'admin' or ['admin', 'internal'].
    // Must NOT contain 'user', 'infra', 'shc-admin', or empty/unknown strings.
    const hasAdmin = aud.includes('admin');
    const validAudienceValues = new Set(['admin', 'internal']);
    const hasOnlyValidValues =
      aud.length > 0 &&
      aud.every(
        (a: unknown) => typeof a === 'string' && a.trim().length > 0 && validAudienceValues.has(a)
      );
    isAudienceValid = hasAdmin && hasOnlyValidValues;
  }

  if (!isAudienceValid) {
    log.warn({ userId: _payload.userId, aud }, 'RBAC admin check: invalid admin audience — denying');
    return false;
  }

  // 5. Account Eligibility Check (Active & Not Blocked in Tenant DB)
  const isAccountActive = await _verifyActiveAccount(_payload.userId, _payload.brand);
  if (!isAccountActive) {
    return false;
  }

  // 6. Fast Path: Token has verified admin class and user account is active in DB
  return true;
}
