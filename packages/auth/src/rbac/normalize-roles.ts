/**
 * 🔥 UNIFIED ROLE NORMALIZATION
 * 
 * ONE function to rule them all.
 * Handles string, array, or any input safely.
 */

import type { Role } from './roles';

const VALID_ROLES: Set<Role> = new Set(['user', 'admin', 'super_admin', 'faculty']);

/**
 * Normalize roles from ANY input format to clean array
 * 
 * Handles:
 * - String: "user,student" → ["user"]
 * - Array: ["USER", "Student"] → ["user"]
 * - Invalid: null, undefined, {} → []
 */
export function normalizeRoles(input: unknown): Role[] {
  // Handle string (from headers like "user,student")
  if (typeof input === 'string') {
    return input
      .split(',')
      .map(r => r.trim().toLowerCase())
      .filter((r): r is Role => VALID_ROLES.has(r as Role));
  }
  
  // Handle array (from JWT payload)
  if (Array.isArray(input)) {
    return input
      .map(r => String(r).trim().toLowerCase())
      .filter((r): r is Role => VALID_ROLES.has(r as Role));
  }
  
  // Invalid input → empty array (will cause RBAC denial)
  return [];
}

/**
 * Validate roles are non-empty (for critical paths)
 */
export function requireValidRoles(roles: Role[]): void {
  if (!Array.isArray(roles) || roles.length === 0) {
    throw new Error('RBAC_ERROR: No valid roles provided');
  }
}
