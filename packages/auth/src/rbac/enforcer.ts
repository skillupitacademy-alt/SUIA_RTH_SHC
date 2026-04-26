/**
 * 🔐 RBAC ENFORCER
 * 
 * Single source of truth for permission enforcement.
 * All permission checks MUST go through these functions.
 * 
 * Usage:
 *   requirePermission(user, 'ADMIN_PANEL')
 *   requirePermissionOrOwnership(user, resourceOwnerId, 'PROFILE_WRITE')
 */

import { RBACService } from './rbac.service';
import { OwnershipRBACService } from './ownership.service';
import type { Role } from './roles';
import type { Permission } from './permissions';
import { ForbiddenError } from '../errors/auth-errors';

/**
 * Require user has permission (throws if denied)
 * 
 * @param user - User context with roles
 * @param permission - Required permission
 * @throws Error if permission denied
 */
export function requirePermission(
  user: { userId: string; roles: Role[] },
  permission: Permission
): void {
  if (!RBACService.hasPermission(user.roles, permission, user.userId)) {
    throw new Error(`Forbidden: Missing permission '${permission}'`);
  }
}

/**
 * Require user has permission OR owns the resource
 * 
 * @param user - User context
 * @param resourceOwnerId - Owner of the resource
 * @param permission - Required permission
 * @throws Error if access denied
 */
export function requirePermissionOrOwnership(
  user: { userId: string; roles: Role[] },
  resourceOwnerId: string,
  permission: Permission
): void {
  OwnershipRBACService.requirePermissionOrOwnership(
    {
      requestingUserId: user.userId,
      resourceOwnerId,
      userRoles: user.roles,
    },
    permission
  );
}

/**
 * Check if user has permission (returns boolean)
 * 
 * @param user - User context
 * @param permission - Permission to check
 * @returns true if user has permission
 */
export function hasPermission(
  user: { userId: string; roles: Role[] },
  permission: Permission
): boolean {
  return RBACService.hasPermission(user.roles, permission, user.userId);
}

/**
 * Check if user has any of the permissions
 * 
 * @param user - User context
 * @param permissions - Permissions to check
 * @returns true if user has any permission
 */
export function hasAnyPermission(
  user: { userId: string; roles: Role[] },
  permissions: Permission[]
): boolean {
  return RBACService.hasAnyPermission(user.roles, permissions);
}

/**
 * Check if user has all permissions
 * 
 * @param user - User context
 * @param permissions - Permissions to check
 * @returns true if user has all permissions
 */
export function hasAllPermissions(
  user: { userId: string; roles: Role[] },
  permissions: Permission[]
): boolean {
  return RBACService.hasAllPermissions(user.roles, permissions);
}
