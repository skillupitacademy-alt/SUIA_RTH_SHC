/**
 * 🔐 OWNERSHIP-BASED RBAC SERVICE
 * 
 * Extends RBAC with resource ownership checks.
 * Allows users to access their own resources even without explicit permissions.
 * 
 * Example: A 'user' role can update their OWN profile, but not others' profiles.
 */

import { RBACService } from './rbac.service';
import type { Role } from './roles';
import type { Permission } from './permissions';
import { logOwnershipCheck } from '../audit/rbac.audit';
import { ForbiddenError } from '../errors/auth-errors';

export interface OwnershipContext {
  /**
   * The user making the request
   */
  requestingUserId: string;
  
  /**
   * The user who owns the resource
   */
  resourceOwnerId: string;
  
  /**
   * User's roles
   */
  userRoles: Role[];
}

export class OwnershipRBACService {
  /**
   * 🔥 CORE: Check permission with ownership consideration
   * 
   * Logic:
   * 1. If user has the permission → GRANT (admin, faculty, etc.)
   * 2. If user is accessing their OWN resource → GRANT (ownership)
   * 3. Otherwise → DENY
   * 
   * @param context - Ownership context
   * @param permission - Permission to check
   * @returns true if access granted
   */
  static hasPermissionOrOwnership(
    context: OwnershipContext,
    permission: Permission
  ): boolean {
    const { requestingUserId, resourceOwnerId, userRoles } = context;
    
    // 1. Check if user has explicit permission (admin, faculty, etc.)
    const hasPermission = RBACService.hasPermission(userRoles, permission, requestingUserId);
    
    if (hasPermission) {
      logOwnershipCheck({
        requestingUserId,
        resourceOwnerId,
        permission,
        result: 'GRANTED',
        reason: 'explicit_permission',
      });
      return true;
    }
    
    // 2. Check ownership - user can access their own resources
    if (requestingUserId === resourceOwnerId) {
      logOwnershipCheck({
        requestingUserId,
        resourceOwnerId,
        permission,
        result: 'GRANTED',
        reason: 'resource_owner',
      });
      return true;
    }
    
    // 3. No permission and not owner → deny
    logOwnershipCheck({
      requestingUserId,
      resourceOwnerId,
      permission,
      result: 'DENIED',
      reason: 'not_owner_and_no_permission',
    });
    return false;
  }

  /**
   * 🔥 ENFORCE: Require permission or ownership
   * 
   * @param context - Ownership context
   * @param permission - Required permission
   * @throws ForbiddenError (403) if access denied
   */
  static requirePermissionOrOwnership(
    context: OwnershipContext,
    permission: Permission
  ): void {
    if (!this.hasPermissionOrOwnership(context, permission)) {
      const { requestingUserId, resourceOwnerId } = context;
      
      // Provide helpful error message
      if (requestingUserId !== resourceOwnerId) {
        throw new ForbiddenError(
          `Missing permission '${permission}' and not resource owner`
        );
      } else {
        throw new ForbiddenError(`Missing permission '${permission}'`);
      }
    }
  }

  /**
   * 🔍 Check if user is owner
   */
  static isOwner(requestingUserId: string, resourceOwnerId: string): boolean {
    return requestingUserId === resourceOwnerId;
  }

  /**
   * 🔍 Check if user can access resource (permission OR ownership)
   */
  static canAccessResource(
    context: OwnershipContext,
    readPermission: Permission,
    writePermission?: Permission
  ): {
    canRead: boolean;
    canWrite: boolean;
    isOwner: boolean;
    hasExplicitPermission: boolean;
  } {
    const { requestingUserId, resourceOwnerId, userRoles } = context;
    const isOwner = requestingUserId === resourceOwnerId;
    const hasReadPermission = RBACService.hasPermission(userRoles, readPermission);
    const hasWritePermission = writePermission 
      ? RBACService.hasPermission(userRoles, writePermission)
      : false;

    return {
      canRead: hasReadPermission || isOwner,
      canWrite: hasWritePermission || isOwner,
      isOwner,
      hasExplicitPermission: hasReadPermission || hasWritePermission,
    };
  }
}

/**
 * 🔐 CONVENIENCE FUNCTIONS
 */

/**
 * Create ownership checker for a specific user and resource
 */
export function createOwnershipChecker(
  requestingUserId: string,
  resourceOwnerId: string,
  userRoles: Role[]
) {
  const context: OwnershipContext = {
    requestingUserId,
    resourceOwnerId,
    userRoles,
  };

  return {
    has: (permission: Permission) =>
      OwnershipRBACService.hasPermissionOrOwnership(context, permission),
    require: (permission: Permission) =>
      OwnershipRBACService.requirePermissionOrOwnership(context, permission),
    isOwner: () => OwnershipRBACService.isOwner(requestingUserId, resourceOwnerId),
    canAccess: (readPermission: Permission, writePermission?: Permission) =>
      OwnershipRBACService.canAccessResource(context, readPermission, writePermission),
  };
}
