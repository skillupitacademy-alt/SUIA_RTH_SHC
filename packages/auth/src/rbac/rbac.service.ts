/**
 * 🔐 RBAC SERVICE - CORE AUTHORIZATION ENGINE
 * 
 * This is the brain of the RBAC system.
 * All permission checks go through this service.
 */

import { ROLE_PERMISSIONS } from './role-permissions';
import type { Role } from './roles';
import type { Permission } from './permissions';
import { logRBACDecision } from '../audit/rbac.audit';
import { ForbiddenError } from '../errors/auth-errors';

/**
 * 🔐 DEFENSIVE ROLE CANONICALIZATION (STRICT)
 * 
 * Ensures consistent role behavior even if roles leak through without canonicalization.
 * STRICT UNIFICATION: ["user"] → ['user'] (NO OTHER ROLES)
 */
function canonicalizeRoles(roles: Role[]): Role[] {
  if (!roles || roles.length === 0) {
    return [];
  }
  
  // 🔥 STRICT UNIFICATION: Legacy student role → user
  if (roles.includes('user' as Role) || roles.includes('student' as any)) {
    return ['user' as Role];
  }
  
  return roles;
}

export class RBACService {
  /**
   * 🔥 CORE: Check if user has specific permission
   * 
   * @param userRoles - Array of user's roles
   * @param permission - Permission to check
   * @param userId - User ID for audit logging
   * @param requestId - Request ID for correlation (optional)
   * @returns true if user has permission
   */
  static hasPermission(
    userRoles: Role[], 
    permission: Permission, 
    userId?: string,
    requestId?: string
  ): boolean {
    // 🔐 DEFENSIVE: Canonicalize roles even if they leaked through
    const roles = canonicalizeRoles(userRoles);
    
    // No roles = no access
    if (!roles || roles.length === 0) {
      if (userId) {
        logRBACDecision({
          requestId,
          userId,
          permission,
          result: 'DENIED',
          reason: 'no_roles_assigned',
        });
      }
      return false;
    }

    for (const role of roles) {
      const permissions = ROLE_PERMISSIONS[role];
      
      if (!permissions) continue;
      
      // Super admin wildcard access
      if ((permissions as readonly string[]).includes('*')) {
        if (userId) {
          logRBACDecision({
            requestId,
            userId,
            permission,
            result: 'GRANTED',
            reason: 'wildcard_access',
          });
        }
        return true;
      }
      
      // Specific permission check
      if ((permissions as readonly string[]).includes(permission)) {
        if (userId) {
          logRBACDecision({
            requestId,
            userId,
            permission,
            result: 'GRANTED',
            reason: `role_${role}`,
          });
        }
        return true;
      }
    }
    
    if (userId) {
      logRBACDecision({
        requestId,
        userId,
        permission,
        result: 'DENIED',
        reason: 'insufficient_permissions',
      });
    }
    
    return false;
  }

  /**
   * 🔥 ENFORCE: Require permission or throw error
   * 
   * @param userRoles - Array of user's roles
   * @param permission - Required permission
   * @param userId - User ID for audit logging
   * @param requestId - Request ID for correlation
   * @throws ForbiddenError (403) if permission denied
   */
  static requirePermission(
    userRoles: Role[], 
    permission: Permission, 
    userId?: string,
    requestId?: string
  ): void {
    if (!this.hasPermission(userRoles, permission, userId, requestId)) {
      throw new ForbiddenError(`Missing permission '${permission}'`);
    }
  }

  /**
   * 🔍 Check if user has ANY of the specified permissions
   */
  static hasAnyPermission(userRoles: Role[], permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(userRoles, permission));
  }

  /**
   * 🔍 Check if user has ALL of the specified permissions
   */
  static hasAllPermissions(userRoles: Role[], permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(userRoles, permission));
  }

  /**
   * 🔍 Get all permissions for user's roles
   */
  static getUserPermissions(userRoles: Role[]): Permission[] {
    const allPermissions = new Set<Permission>();
    
    for (const role of userRoles) {
      const permissions = ROLE_PERMISSIONS[role];
      
      if (!permissions) continue;
      
      // Super admin gets all permissions (represented as wildcard)
      if ((permissions as readonly string[]).includes('*')) {
        // Return all defined permissions for wildcard roles
        return Object.values(require('./permissions').PERMISSIONS);
      }
      
      // Add specific permissions
      permissions.forEach(permission => {
        if (permission !== '*') {
          allPermissions.add(permission as Permission);
        }
      });
    }
    
    return Array.from(allPermissions);
  }

  /**
   * 🔍 Check if user is admin level (admin or super_admin)
   */
  static isAdminLevel(userRoles: Role[]): boolean {
    return userRoles.some(role => role === 'admin' || role === 'super_admin');
  }

  /**
   * 🔍 Check if user is faculty level or higher
   */
  static isFacultyLevel(userRoles: Role[]): boolean {
    return userRoles.some(role => 
      role === 'faculty' || role === 'admin' || role === 'super_admin'
    );
  }
}

/**
 * 🔐 RBAC ERROR CLASSES
 */
export class RBACError extends Error {
  constructor(message: string, public readonly permission?: Permission) {
    super(message);
    this.name = 'RBACError';
  }
}

export class PermissionDeniedError extends RBACError {
  constructor(permission: Permission) {
    super(`Permission denied: ${permission}`, permission);
    this.name = 'PermissionDeniedError';
  }
}

/**
 * 🔐 CONVENIENCE FUNCTIONS
 */

/**
 * Create permission checker function
 */
export function createPermissionChecker(userRoles: Role[]) {
  return {
    has: (permission: Permission) => RBACService.hasPermission(userRoles, permission),
    require: (permission: Permission) => RBACService.requirePermission(userRoles, permission),
    hasAny: (permissions: Permission[]) => RBACService.hasAnyPermission(userRoles, permissions),
    hasAll: (permissions: Permission[]) => RBACService.hasAllPermissions(userRoles, permissions),
  };
}