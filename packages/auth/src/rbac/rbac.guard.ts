/**
 * 🔐 RBAC GUARD - CENTRALIZED ENFORCEMENT
 * 
 * Wrapper for Next.js route handlers that enforces RBAC.
 * Single source of truth for permission checks.
 * 
 * Usage:
 * 
 * // Permission-based
 * export const GET = withRBAC(handler, {
 *   permission: PERMISSIONS.ADMIN_PANEL
 * });
 * 
 * // Ownership-based
 * export const PATCH = withRBAC(handler, {
 *   permission: PERMISSIONS.PROFILE_WRITE,
 *   ownership: true,
 *   getResourceUserId: async (req) => extractUserId(req)
 * });
 */

import type { NextRequest } from 'next/server';
import { RBACService } from './rbac.service';
import { OwnershipRBACService } from './ownership.service';
import { createRBACUser } from './rbac.adapter';
import type { Permission } from './permissions';

// Note: AuthContext should be imported from your API server
// This is a minimal type definition for the guard
interface AuthContext {
  userId: string;
  brand: string;
  correlationId: string;
  source: string;
  email?: string;
  roles?: string[];
}

export interface RBACOptions {
  /**
   * Required permission for this route
   */
  permission: Permission;
  
  /**
   * Enable ownership-based access
   * If true, users can access their own resources even without explicit permission
   */
  ownership?: boolean;
  
  /**
   * Function to extract resource owner ID from request
   * Required if ownership is true
   */
  getResourceUserId?: (req: NextRequest) => Promise<string> | string;
  
  /**
   * Custom error message for permission denial
   */
  denialMessage?: string;
}

export interface RBACContext extends AuthContext {
  /**
   * RBAC user with validated roles
   */
  rbacUser: ReturnType<typeof createRBACUser>;
}

type RouteHandler<T = any> = (
  req: NextRequest,
  context: RBACContext
) => Promise<Response> | Response;

/**
 * 🔐 RBAC Guard Wrapper
 * 
 * Wraps a Next.js route handler with RBAC enforcement.
 * 
 * @param handler - Route handler function
 * @param options - RBAC configuration
 * @returns Wrapped handler with RBAC enforcement
 */
export function withRBAC(
  handler: RouteHandler,
  options: RBACOptions
): RouteHandler {
  return async (req: NextRequest, context: any) => {
    const startTime = Date.now();
    
    // 1. Extract auth context
    const auth = context?.auth || (req as any).auth;
    
    if (!auth) {
      console.warn('🔐 RBAC GUARD: No auth context', {
        route: req.url,
        method: req.method,
      });
      
      return new Response(
        JSON.stringify({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 2. Create RBAC user
    let rbacUser;
    try {
      rbacUser = createRBACUser(auth);
    } catch (error) {
      console.error('🔐 RBAC GUARD: Failed to create RBAC user', {
        route: req.url,
        userId: auth.userId,
        error: error instanceof Error ? error.message : 'Unknown',
      });
      
      return new Response(
        JSON.stringify({
          code: 'RBAC_ERROR',
          message: 'Failed to validate user roles',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 3. Check for empty roles (CRITICAL SECURITY)
    if (!rbacUser.roles || rbacUser.roles.length === 0) {
      console.warn('🔐 RBAC GUARD: User has no roles', {
        route: req.url,
        userId: auth.userId,
        permission: options.permission,
      });
      
      return new Response(
        JSON.stringify({
          code: 'NO_ROLES',
          message: 'User has no roles assigned',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 4. Perform RBAC check
    try {
      if (options.ownership) {
        // Ownership-based check
        if (!options.getResourceUserId) {
          throw new Error('getResourceUserId is required when ownership is enabled');
        }
        
        const resourceUserId = await options.getResourceUserId(req);
        
        OwnershipRBACService.requirePermissionOrOwnership(
          {
            requestingUserId: auth.userId,
            resourceOwnerId: resourceUserId,
            userRoles: rbacUser.roles,
          },
          options.permission
        );
        
        // Log success
        console.log('🔐 RBAC GUARD: Access granted (ownership)', {
          route: req.url,
          method: req.method,
          userId: auth.userId.slice(0, 8),
          roles: rbacUser.roles,
          permission: options.permission,
          isOwner: auth.userId === resourceUserId,
          duration: Date.now() - startTime,
        });
      } else {
        // Permission-based check
        RBACService.requirePermission(rbacUser.roles, options.permission);
        
        // Log success
        console.log('🔐 RBAC GUARD: Access granted (permission)', {
          route: req.url,
          method: req.method,
          userId: auth.userId.slice(0, 8),
          roles: rbacUser.roles,
          permission: options.permission,
          duration: Date.now() - startTime,
        });
      }
    } catch (error) {
      // Log denial
      console.warn('🔐 RBAC GUARD: Access denied', {
        route: req.url,
        method: req.method,
        userId: auth.userId.slice(0, 8),
        roles: rbacUser.roles,
        permission: options.permission,
        error: error instanceof Error ? error.message : 'Unknown',
        duration: Date.now() - startTime,
      });
      
      return new Response(
        JSON.stringify({
          code: 'PERMISSION_DENIED',
          message: options.denialMessage || `Permission required: ${options.permission}`,
          permission: options.permission,
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 5. Execute handler with RBAC context
    try {
      return await handler(req, {
        ...context,
        auth,
        rbacUser,
      });
    } catch (error) {
      console.error('🔐 RBAC GUARD: Handler error', {
        route: req.url,
        error: error instanceof Error ? error.message : 'Unknown',
      });
      throw error;
    }
  };
}

/**
 * 🔐 Helper: Create ownership-based RBAC guard
 * 
 * Convenience function for routes that use ownership checks.
 */
export function withOwnershipRBAC(
  handler: RouteHandler,
  permission: Permission,
  getResourceUserId: (req: NextRequest) => Promise<string> | string
): RouteHandler {
  return withRBAC(handler, {
    permission,
    ownership: true,
    getResourceUserId,
  });
}

/**
 * 🔐 Helper: Create permission-based RBAC guard
 * 
 * Convenience function for routes that only need permission checks.
 */
export function withPermissionRBAC(
  handler: RouteHandler,
  permission: Permission
): RouteHandler {
  return withRBAC(handler, {
    permission,
  });
}
