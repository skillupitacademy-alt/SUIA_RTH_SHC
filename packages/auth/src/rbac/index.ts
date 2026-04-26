/**
 * 🔐 RBAC SYSTEM - MAIN EXPORTS
 * 
 * Single import point for all RBAC functionality.
 * Use this to import RBAC components throughout the codebase.
 */

// Core RBAC engine
export { RBACService, RBACError, PermissionDeniedError, createPermissionChecker } from './rbac.service';

// Role definitions
export { ROLES, VALID_ROLES, isValidRole, filterValidRoles } from './roles';
export type { Role } from './roles';

// Permission definitions
export { PERMISSIONS, isValidPermission } from './permissions';
export type { Permission } from './permissions';

// Role-Permission mappings
export { ROLE_PERMISSIONS, getRolePermissions, hasWildcardAccess } from './role-permissions';

// RBAC User adapter
export { createRBACUser, validateRBACUser, RBACUserUtils } from './rbac.adapter';
export type { RBACUser } from './rbac.adapter';

// Ownership-based RBAC
export { OwnershipRBACService, createOwnershipChecker } from './ownership.service';
export type { OwnershipContext } from './ownership.service';

// RBAC Guard (Wrapper)
export { withRBAC, withOwnershipRBAC, withPermissionRBAC } from './rbac.guard';
export type { RBACOptions, RBACContext } from './rbac.guard';

/**
 * 🔥 CONVENIENCE: Most commonly used exports
 */
import { RBACService } from './rbac.service';
import { OwnershipRBACService } from './ownership.service';
import { ROLES } from './roles';
import { PERMISSIONS } from './permissions';
import { createRBACUser } from './rbac.adapter';

export const RBAC = {
  // Service
  hasPermission: RBACService.hasPermission,
  requirePermission: RBACService.requirePermission,
  hasPermissionOrOwnership: OwnershipRBACService.hasPermissionOrOwnership,
  requirePermissionOrOwnership: OwnershipRBACService.requirePermissionOrOwnership,
  
  // Constants
  ROLES,
  PERMISSIONS,
  
  // Utils
  createRBACUser,
} as const;