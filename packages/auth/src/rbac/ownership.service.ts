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
   * FND03: Tenant of the requesting user
   */
  requestingTenant: string;
  
  /**
   * FND03: Canonical identity of requesting user (optional)
   */
  requestingShadowUserId?: string;
  
  /**
   * The user who owns the resource
   */
  resourceOwnerId: string;
  
  /**
   * FND03: Tenant of the resource owner
   */
  resourceTenant: string;
  
  /**
   * FND03: Canonical identity of resource owner (optional)
   */
  resourceShadowUserId?: string;
  
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
   * 1. FND03: Verify tenant boundary FIRST (unless admin with cross-tenant permission)
   * 2. If user has the permission → GRANT (admin, faculty, etc.)
   * 3. If user is accessing their OWN resource within SAME TENANT → GRANT (ownership)
   * 4. Otherwise → DENY
   * 
   * FND03: Enforces tenant boundary before userId comparison.
   * Cross-tenant access is DENIED by default unless admin has explicit cross-tenant permission.
   * 
   * @param context - Ownership context
   * @param permission - Permission to check
   * @returns true if access granted
   */
  static hasPermissionOrOwnership(
    context: OwnershipContext,
    permission: Permission
  ): boolean {
    const { requestingUserId, requestingTenant, requestingShadowUserId, resourceOwnerId, resourceTenant, resourceShadowUserId, userRoles } = context;
    
    // 1. FND03: Check tenant boundary FIRST for non-admin users
    const isCrossTenantAccess = requestingTenant !== resourceTenant;
    const isAdmin = userRoles.some(role => role === 'admin' || role === 'super_admin');
    
    if (isCrossTenantAccess && !isAdmin) {
      // Non-admin users cannot access cross-tenant resources
      logOwnershipCheck({
        requestingUserId,
        resourceOwnerId,
        permission,
        result: 'DENIED',
        reason: 'cross_tenant_access_denied',
      });
      return false;
    }
    
    // 2. Check if user has explicit permission (admin, faculty, etc.)
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
    
    // 3. Check ownership - must be same tenant AND same user
    if (requestingTenant === resourceTenant) {
      const ownershipMatch = requestingUserId === resourceOwnerId ||
        (requestingShadowUserId && resourceShadowUserId && requestingShadowUserId === resourceShadowUserId);
      
      if (ownershipMatch) {
        logOwnershipCheck({
          requestingUserId,
          resourceOwnerId,
          permission,
          result: 'GRANTED',
          reason: 'resource_owner',
        });
        return true;
      }
    }
    
    // 4. No permission and not owner → deny
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
      const { requestingUserId, requestingTenant, resourceOwnerId, resourceTenant } = context;
      
      // Provide helpful error message
      if (requestingTenant !== resourceTenant) {
        throw new ForbiddenError(
          `Cross-tenant access denied: requesting tenant '${requestingTenant}' cannot access resource in tenant '${resourceTenant}'`
        );
      } else if (requestingUserId !== resourceOwnerId) {
        throw new ForbiddenError(
          `Missing permission '${permission}' and not resource owner`
        );
      } else {
        throw new ForbiddenError(`Missing permission '${permission}'`);
      }
    }
  }

  /**
   * 🔍 Check if user is owner (FND03: tenant-qualified)
   * 
   * @param requestingUserId - Requesting user ID
   * @param requestingTenant - Requesting user's tenant
   * @param resourceOwnerId - Resource owner ID
   * @param resourceTenant - Resource tenant
   * @param requestingShadowUserId - Optional canonical identity
   * @param resourceShadowUserId - Optional canonical identity
   * @returns true if same tenant AND same user
   */
  static isOwner(
    requestingUserId: string,
    requestingTenant: string,
    resourceOwnerId: string,
    resourceTenant: string,
    requestingShadowUserId?: string,
    resourceShadowUserId?: string
  ): boolean {
    // FND03: Tenant must match first
    if (requestingTenant !== resourceTenant) {
      return false;
    }
    
    // Within same tenant, check userId OR shadowUserId
    if (requestingUserId === resourceOwnerId) {
      return true;
    }
    
    // Fallback to canonical identity if available
    if (requestingShadowUserId && resourceShadowUserId) {
      return requestingShadowUserId === resourceShadowUserId;
    }
    
    return false;
  }

  /**
   * 🔍 Check if user can access resource (permission OR ownership)
   * FND03: Enforces tenant boundary
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
    const { requestingUserId, requestingTenant, requestingShadowUserId, resourceOwnerId, resourceTenant, resourceShadowUserId, userRoles } = context;
    
    // FND03: Check tenant-qualified ownership
    const isOwner = this.isOwner(
      requestingUserId,
      requestingTenant,
      resourceOwnerId,
      resourceTenant,
      requestingShadowUserId,
      resourceShadowUserId
    );
    
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
 * Create ownership checker for a specific user and resource (FND03: tenant-aware)
 */
export function createOwnershipChecker(
  requestingUserId: string,
  requestingTenant: string,
  resourceOwnerId: string,
  resourceTenant: string,
  userRoles: Role[],
  requestingShadowUserId?: string,
  resourceShadowUserId?: string
) {
  const context: OwnershipContext = {
    requestingUserId,
    requestingTenant,
    requestingShadowUserId,
    resourceOwnerId,
    resourceTenant,
    resourceShadowUserId,
    userRoles,
  };

  return {
    has: (permission: Permission) =>
      OwnershipRBACService.hasPermissionOrOwnership(context, permission),
    require: (permission: Permission) =>
      OwnershipRBACService.requirePermissionOrOwnership(context, permission),
    isOwner: () => OwnershipRBACService.isOwner(
      requestingUserId,
      requestingTenant,
      resourceOwnerId,
      resourceTenant,
      requestingShadowUserId,
      resourceShadowUserId
    ),
    canAccess: (readPermission: Permission, writePermission?: Permission) =>
      OwnershipRBACService.canAccessResource(context, readPermission, writePermission),
  };
}
