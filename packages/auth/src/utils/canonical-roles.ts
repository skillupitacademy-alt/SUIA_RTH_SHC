/**
 * 🔐 CANONICAL ROLE NORMALIZER (STRICT UNIFICATION)
 * 
 * Single source of truth for role normalization across all brands.
 * Ensures RTH and SkillUp behave identically without DB migration.
 * 
 * CRITICAL RULES:
 * 1. "user" + "student" → ["user"] (unified)
 * 2. Lowercase normalization (ADMIN → admin)
 * 3. Deduplication (["user", "user"] → ["user"])
 * 4. Empty roles → [] (no fallback)
 * 
 * This makes both brands behave identically without DB migration.
 */

export type Role = 'student' | 'admin' | 'super_admin' | 'faculty';

const VALID_ROLES: Set<Role> = new Set(['student', 'admin', 'super_admin', 'faculty']);

/**
 * Canonicalize roles to ensure consistent behavior across brands
 * 
 * @param input - Raw roles from JWT or database (can be string, array, or unknown)
 * @returns Normalized role array
 * 
 * @example
 * canonicalizeRoles(["user", "student"]) → ["user"]
 * canonicalizeRoles(["ADMIN"]) → ["admin"]
 * canonicalizeRoles("user,student") → ["user"]
 * canonicalizeRoles([]) → []
 */
export function canonicalizeRoles(input: unknown): string[] {
  let roles: string[] = [];
  
  // Handle string input (e.g., "user,student" from headers)
  if (typeof input === 'string') {
    roles = input.split(',').map(r => r.trim().toLowerCase()).filter(Boolean);
  }
  // Handle array input (e.g., ["user", "student"] from JWT)
  else if (Array.isArray(input)) {
    roles = input
      .map(r => String(r).trim().toLowerCase())
      .filter(Boolean);
  }
  // Handle unknown input
  else {
    return [];
  }
  
  // 🔥 CRITICAL: Unify "user" + "student" → ["student"]
  // This makes RTH and SkillUp behave identically with standardized "student" role
  const hasUserOrStudent = roles.includes('user') || roles.includes('student');
  
  if (hasUserOrStudent) {
    // Remove both "user" and "student", then add back only "student"
    roles = roles.filter(r => r !== 'user' && r !== 'student');
    roles.push('student');
  }
  
  // Deduplicate and filter to valid roles only
  const uniqueRoles = Array.from(new Set(roles));
  const validRoles = uniqueRoles.filter(role => VALID_ROLES.has(role as Role));
  
  // 🚨 SECURITY: Log unknown roles in development
  if (process.env.NODE_ENV !== 'production') {
    const unknownRoles = uniqueRoles.filter(role => !VALID_ROLES.has(role as Role));
    if (unknownRoles.length > 0) {
      console.warn('⚠️ SECURITY: Unknown roles detected and filtered', {
        tag: 'UNKNOWN_ROLES_FILTERED',
        unknown: unknownRoles,
        valid: validRoles,
      });
    }
  }
  
  return validRoles;
}

/**
 * Check if roles array contains a specific role
 * 
 * @param roles - Normalized roles array
 * @param role - Role to check for
 * @returns True if role exists
 */
export function hasRole(roles: string[], role: Role): boolean {
  return roles.includes(role);
}

/**
 * Check if roles array contains ANY of the specified roles
 * 
 * @param roles - Normalized roles array
 * @param requiredRoles - Roles to check for (OR logic)
 * @returns True if ANY role matches
 */
export function hasAnyRole(roles: string[], requiredRoles: Role[]): boolean {
  return requiredRoles.some(role => roles.includes(role));
}

/**
 * Check if roles array contains ALL of the specified roles
 * 
 * @param roles - Normalized roles array
 * @param requiredRoles - Roles to check for (AND logic)
 * @returns True if ALL roles match
 */
export function hasAllRoles(roles: string[], requiredRoles: Role[]): boolean {
  return requiredRoles.every(role => roles.includes(role));
}

/**
 * Check if user is admin (admin or super_admin)
 * 
 * @param roles - Normalized roles array
 * @returns True if user has admin privileges
 */
export function isAdmin(roles: string[]): boolean {
  return hasAnyRole(roles, ['admin', 'super_admin']);
}

/**
 * Check if user is regular user (not admin)
 * 
 * @param roles - Normalized roles array
 * @returns True if user is regular user
 */
export function isRegularUser(roles: string[]): boolean {
  return hasRole(roles, 'student') && !isAdmin(roles);
}
