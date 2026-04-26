/**
 * 🔐 RBAC ROLES - SINGLE SOURCE OF TRUTH
 * 
 * This replaces ALL scattered role definitions across the codebase.
 * Use ROLES constants instead of hardcoded strings.
 */

export const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
  FACULTY: 'faculty',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export const VALID_ROLES = new Set(Object.values(ROLES));

/**
 * 🔒 SECURITY: Validate if a string is a valid role
 */
export function isValidRole(role: string): role is Role {
  return VALID_ROLES.has(role as Role);
}

/**
 * 🔒 SECURITY: Filter array to only valid roles
 */
export function filterValidRoles(roles: string[]): Role[] {
  return roles.filter(isValidRole);
}