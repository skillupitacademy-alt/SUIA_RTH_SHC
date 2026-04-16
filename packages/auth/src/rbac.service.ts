/**
 * RBAC Service
 * Role-Based Access Control implementation
 */

import { ROLE_PERMISSIONS, type Role, type Permission, type RBACUser, ForbiddenError } from './rbac.types';

export class RBACService {
  /**
   * Check if user has specific permission
   */
  static hasPermission(user: RBACUser, permission: Permission): boolean {
    const userPermissions = ROLE_PERMISSIONS[user.role];
    
    // Super admin has all permissions
    if (userPermissions.includes('*')) {
      return true;
    }
    
    // Check specific permission
    return userPermissions.includes(permission);
  }

  /**
   * Check if user has any of the specified permissions
   */
  static hasAnyPermission(user: RBACUser, permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(user, permission));
  }

  /**
   * Check if user has all of the specified permissions
   */
  static hasAllPermissions(user: RBACUser, permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(user, permission));
  }

  /**
   * Require specific permission or throw error
   */
  static requirePermission(user: RBACUser, permission: Permission): void {
    if (!this.hasPermission(user, permission)) {
      throw new ForbiddenError(`Permission required: ${permission}`);
    }
  }

  /**
   * Require any of the specified permissions or throw error
   */
  static requireAnyPermission(user: RBACUser, permissions: Permission[]): void {
    if (!this.hasAnyPermission(user, permissions)) {
      throw new ForbiddenError(`One of these permissions required: ${permissions.join(', ')}`);
    }
  }

  /**
   * Require all of the specified permissions or throw error
   */
  static requireAllPermissions(user: RBACUser, permissions: Permission[]): void {
    if (!this.hasAllPermissions(user, permissions)) {
      throw new ForbiddenError(`All of these permissions required: ${permissions.join(', ')}`);
    }
  }

  /**
   * Get all permissions for a role
   */
  static getRolePermissions(role: Role): Permission[] {
    return ROLE_PERMISSIONS[role] || [];
  }

  /**
   * Check if role is admin level or higher
   */
  static isAdminRole(role: Role): boolean {
    return role === 'admin' || role === 'super_admin';
  }

  /**
   * Check if role is instructor level or higher
   */
  static isInstructorRole(role: Role): boolean {
    return role === 'instructor' || this.isAdminRole(role);
  }
}

/**
 * Middleware factory for permission checking
 */
export function requirePermission(permission: Permission) {
  return (user: RBACUser) => {
    RBACService.requirePermission(user, permission);
  };
}

/**
 * Middleware factory for role checking
 */
export function requireRole(role: Role) {
  return (user: RBACUser) => {
    if (user.role !== role && user.role !== 'super_admin') {
      throw new ForbiddenError(`Role required: ${role}`);
    }
  };
}

/**
 * Middleware factory for admin access
 */
export function requireAdmin() {
  return (user: RBACUser) => {
    if (!RBACService.isAdminRole(user.role)) {
      throw new ForbiddenError('Admin access required');
    }
  };
}