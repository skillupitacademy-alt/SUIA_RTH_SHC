/**
 * 🔗 RBAC ADAPTER - CONNECT EXISTING AUTH WITH RBAC
 * 
 * Bridges the gap between your existing auth system and the new RBAC engine.
 * Converts BffAuthResult to RBACUser for permission checking.
 */

import type { Role } from './roles';

// 🔗 BffAuthResult interface (local definition to avoid circular imports)
// This matches the interface from src/share-branding/auth/unifiedBffAuth.ts
export interface BffAuthResult {
  isAuthenticated: boolean;
  userId?: string;
  email?: string;
  brand?: 'realtutorialhub' | 'skillup';
  roles?: Role[];
  accessToken?: string;
  shadowUserId?: string;
  originalUserId?: string;
}

/**
 * 🔐 RBAC User Interface
 * 
 * Standardized user object for RBAC operations
 */
export interface RBACUser {
  userId: string;
  originalUserId: string;
  shadowUserId: string;
  roles: Role[];
  brand: string;
  email?: string;
}

/**
 * 🔗 Convert BffAuthResult to RBACUser
 * 
 * This is the bridge between your existing auth and RBAC system.
 * 
 * @param auth - Result from extractAuthFromRequest()
 * @returns RBACUser for permission checking
 * @throws Error if auth is invalid
 */
export function createRBACUser(auth: BffAuthResult): RBACUser {
  if (!auth.isAuthenticated) {
    throw new Error('Cannot create RBAC user: User not authenticated');
  }

  if (!auth.originalUserId || !auth.shadowUserId) {
    throw new Error('Cannot create RBAC user: Missing user identity');
  }

  if (!auth.roles || auth.roles.length === 0) {
    throw new Error('Cannot create RBAC user: No roles assigned');
  }

  return {
    userId: auth.originalUserId, // Use originalUserId as primary ID
    originalUserId: auth.originalUserId,
    shadowUserId: auth.shadowUserId,
    roles: auth.roles, // Already normalized and typed
    brand: auth.brand || 'realtutorialhub',
    email: auth.email,
  };
}

/**
 * 🔐 Validate RBAC User
 * 
 * Ensures RBACUser has all required fields
 */
export function validateRBACUser(user: RBACUser): boolean {
  return !!(
    user.userId &&
    user.originalUserId &&
    user.shadowUserId &&
    user.roles &&
    user.roles.length > 0 &&
    user.brand
  );
}

/**
 * 🔍 RBAC User Utilities
 */
export class RBACUserUtils {
  /**
   * Check if user belongs to specific brand
   */
  static isBrand(user: RBACUser, brand: string): boolean {
    return user.brand === brand;
  }

  /**
   * Check if user has specific role
   */
  static hasRole(user: RBACUser, role: Role): boolean {
    return user.roles.includes(role);
  }

  /**
   * Check if user has any of the specified roles
   */
  static hasAnyRole(user: RBACUser, roles: Role[]): boolean {
    return roles.some(role => user.roles.includes(role));
  }

  /**
   * Get user's primary role (first role, or highest privilege)
   */
  static getPrimaryRole(user: RBACUser): Role {
    const roleHierarchy: Role[] = ['super_admin', 'admin', 'faculty', 'student'];
    
    for (const role of roleHierarchy) {
      if (user.roles.includes(role)) {
        return role;
      }
    }
    
    return user.roles[0]; // Fallback to first role
  }

  /**
   * Create display name for user
   */
  static getDisplayInfo(user: RBACUser): { name: string; role: string; brand: string } {
    return {
      name: user.email || `User ${user.userId.slice(0, 8)}`,
      role: this.getPrimaryRole(user),
      brand: user.brand,
    };
  }
}