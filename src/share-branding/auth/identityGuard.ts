/**
 * 🔐 IDENTITY GUARD - ENFORCE CORRECT USER ID USAGE
 * 
 * This module enforces the separation between:
 * - originalUserId: Brand-specific user ID (MUST be used for database operations)
 * - shadowUserId: Cross-brand identity ID (ONLY for observability/tracking)
 * 
 * CRITICAL RULES:
 * ✅ Database queries MUST use originalUserId
 * ✅ Logging/monitoring CAN use shadowUserId
 * ❌ NEVER use shadowUserId for database operations
 * 
 * WHY THIS MATTERS:
 * - originalUserId points to the correct brand-specific user record
 * - shadowUserId is for cross-brand identity tracking only
 * - Using shadowUserId for DB queries will return wrong/missing data
 */

import type { BffAuthResult } from './unifiedBffAuth';

/**
 * Identity context extracted from auth
 */
export interface IdentityContext {
  originalUserId: string;
  shadowUserId: string;
  brand: 'realtutorialhub' | 'skillup';
  email?: string;
  roles?: string[];
}

/**
 * 🔥 CRITICAL: Get user ID for DATABASE operations
 * 
 * This function ENFORCES that database queries use the correct user ID.
 * 
 * @param auth - Authentication result from extractAuthFromRequest()
 * @returns originalUserId - The brand-specific user ID for database queries
 * @throws Error if originalUserId is missing
 * 
 * @example
 * ```typescript
 * const auth = await extractAuthFromRequest(req);
 * const userId = getDatabaseUserId(auth);
 * 
 * // ✅ CORRECT: Use for database queries
 * const profile = await db.profiles.findById(userId);
 * const exams = await db.exams.findByUserId(userId);
 * ```
 */
export function getDatabaseUserId(auth: BffAuthResult): string {
  // 🔥 STRICT: No fallback, no silent behavior
  if (!auth?.originalUserId) {
    throw new Error('IDENTITY_GUARD: originalUserId missing - cannot perform database operation');
  }

  // 📊 OBSERVABILITY: Log usage for audit trail
  console.log(JSON.stringify({
    tag: 'IDENTITY_GUARD',
    action: 'get_database_user_id',
    type: 'database',
    userId: auth.originalUserId.slice(0, 8),
    brand: auth.brand,
  }));

  return auth.originalUserId;
}

/**
 * 🔍 Get user ID for OBSERVABILITY (logging, monitoring, tracing)
 * 
 * This function returns the shadowUserId for cross-brand tracking.
 * Use this ONLY for logging, monitoring, and observability purposes.
 * 
 * @param auth - Authentication result from extractAuthFromRequest()
 * @returns shadowUserId - The cross-brand identity ID for tracking
 * 
 * @example
 * ```typescript
 * const auth = await extractAuthFromRequest(req);
 * const trackingId = getObservabilityUserId(auth);
 * 
 * // ✅ CORRECT: Use for logging/monitoring
 * logger.info('User action', { userId: trackingId, action: 'login' });
 * metrics.increment('user.login', { userId: trackingId });
 * ```
 */
export function getObservabilityUserId(auth: BffAuthResult): string {
  // 🔥 STRICT: No silent fallback
  if (!auth?.shadowUserId && !auth?.originalUserId) {
    throw new Error('IDENTITY_GUARD: No user ID available for observability');
  }

  // 📊 OBSERVABILITY: Log usage for audit trail
  const userId = auth.shadowUserId || auth.originalUserId;
  console.log(JSON.stringify({
    tag: 'IDENTITY_GUARD',
    action: 'get_observability_user_id',
    type: 'observability',
    userId: userId?.slice(0, 8),
    brand: auth.brand,
  }));

  // Prefer shadowUserId for cross-brand tracking, fallback to originalUserId
  return userId!;
}

/**
 * 🔐 Create complete identity context
 * 
 * Extracts all identity information from auth result.
 * Use this when you need both IDs and want to be explicit about usage.
 * 
 * @param auth - Authentication result from extractAuthFromRequest()
 * @returns IdentityContext with both user IDs and metadata
 * @throws Error if required identity fields are missing
 * 
 * @example
 * ```typescript
 * const auth = await extractAuthFromRequest(req);
 * const identity = getIdentityContext(auth);
 * 
 * // ✅ CORRECT: Explicit usage
 * const profile = await db.profiles.findById(identity.originalUserId);
 * logger.info('Profile loaded', { userId: identity.shadowUserId });
 * ```
 */
export function getIdentityContext(auth: BffAuthResult): IdentityContext {
  if (!auth.isAuthenticated) {
    throw new Error('Cannot create identity context: User not authenticated');
  }

  if (!auth.originalUserId || !auth.shadowUserId) {
    throw new Error('Cannot create identity context: Missing required identity fields');
  }

  if (!auth.brand) {
    throw new Error('Cannot create identity context: Brand is missing');
  }

  return {
    originalUserId: auth.originalUserId,
    shadowUserId: auth.shadowUserId,
    brand: auth.brand,
    email: auth.email,
    roles: auth.roles,
  };
}

/**
 * 🚨 DEPRECATED: Direct access to userId field
 * 
 * The generic `userId` field in BffAuthResult is ambiguous.
 * Use getDatabaseUserId() or getObservabilityUserId() instead.
 * 
 * @deprecated Use getDatabaseUserId() for DB queries or getObservabilityUserId() for logging
 */
export function getUserId(auth: BffAuthResult): never {
  throw new Error(
    'DEPRECATED: auth.userId is ambiguous. Use getDatabaseUserId() for database queries or getObservabilityUserId() for logging/monitoring.'
  );
}

/**
 * 🔍 Validate identity context
 * 
 * Checks if auth result has all required identity fields.
 * Use this for defensive programming in critical paths.
 * 
 * @param auth - Authentication result to validate
 * @returns true if all identity fields are present and valid
 * 
 * @example
 * ```typescript
 * const auth = await extractAuthFromRequest(req);
 * 
 * if (!isValidIdentity(auth)) {
 *   return BffAuthErrors.unauthorized();
 * }
 * 
 * const userId = getDatabaseUserId(auth); // Safe to call
 * ```
 */
export function isValidIdentity(auth: BffAuthResult): boolean {
  return !!(
    auth.isAuthenticated &&
    auth.originalUserId &&
    auth.shadowUserId &&
    auth.brand
  );
}

/**
 * 📊 USAGE GUIDELINES
 * 
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ USE CASE                    │ FUNCTION TO USE                   │
 * ├─────────────────────────────────────────────────────────────────┤
 * │ Database queries            │ getDatabaseUserId()               │
 * │ Profile lookups             │ getDatabaseUserId()               │
 * │ Exam records                │ getDatabaseUserId()               │
 * │ User data updates           │ getDatabaseUserId()               │
 * ├─────────────────────────────────────────────────────────────────┤
 * │ Logging                     │ getObservabilityUserId()          │
 * │ Monitoring                  │ getObservabilityUserId()          │
 * │ Analytics                   │ getObservabilityUserId()          │
 * │ Distributed tracing         │ getObservabilityUserId()          │
 * ├─────────────────────────────────────────────────────────────────┤
 * │ Need both IDs explicitly    │ getIdentityContext()              │
 * │ Validation before use       │ isValidIdentity()                 │
 * └─────────────────────────────────────────────────────────────────┘
 * 
 * ⚠️ COMMON MISTAKES TO AVOID:
 * 
 * ❌ WRONG:
 * ```typescript
 * const userId = auth.shadowUserId;
 * const profile = await db.profiles.findById(userId); // WRONG!
 * ```
 * 
 * ✅ CORRECT:
 * ```typescript
 * const userId = getDatabaseUserId(auth);
 * const profile = await db.profiles.findById(userId); // CORRECT!
 * ```
 * 
 * ❌ WRONG:
 * ```typescript
 * const userId = auth.userId; // Ambiguous!
 * ```
 * 
 * ✅ CORRECT:
 * ```typescript
 * const dbUserId = getDatabaseUserId(auth);
 * const trackingId = getObservabilityUserId(auth);
 * ```
 */
