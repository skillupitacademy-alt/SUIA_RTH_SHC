/**
 * Authentication Helpers for SkillHubCore Admin
 * 
 * Provides authentication and authorization utilities for internal API routes
 * that directly access the database (non-proxied routes).
 * 
 * Uses the existing RBAC permission system from @quiz/auth package.
 * 
 * NOTE: Most SkillHubCore admin routes use proxyUpstreamRequest() and rely on
 * gateway authentication. These helpers are for NEW internal routes like the
 * Tutorial Composer that write directly to the database.
 */

import { TokenService } from '@quiz/auth';
import { RBACService, PERMISSIONS, type Permission } from '@quiz/auth/rbac';
import type { Role } from '@quiz/auth/rbac/roles';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * Token payload structure returned by TokenService
 */
export interface AuthenticatedUser {
  userId: string;
  originalUserId: string;
  shadowUserId: string;
  roles: Role[];
  isAdmin: boolean;
  email?: string;
}

/**
 * Authentication context for API handlers
 */
export interface AuthContext {
  user: AuthenticatedUser;
}

/**
 * Possible authentication errors
 */
export type AuthError =
  | { type: 'MISSING_TOKEN'; message: string }
  | { type: 'INVALID_TOKEN'; message: string }
  | { type: 'FORBIDDEN'; message: string };

/**
 * Extract access token from request cookies
 * 
 * Checks both 'accessToken' and 'admin_accessToken' cookies
 * (both are set during login for compatibility)
 */
function getAccessToken(request: NextRequest): string | undefined {
  return (
    request.cookies.get('accessToken')?.value ||
    request.cookies.get('admin_accessToken')?.value
  );
}

/**
 * Verify and extract user from access token
 * 
 * @param token - JWT access token
 * @returns AuthenticatedUser if valid, null if invalid
 */
async function verifyToken(token: string): Promise<AuthenticatedUser | null> {
  try {
    // Try primary audience first (shc-admin for gateway tokens)
    let payload;
    try {
      payload = await TokenService.verifyAdminAccessToken(token, { 
        audience: 'shc-admin' 
      });
    } catch {
      // Fallback to 'admin' audience for compatibility
      payload = await TokenService.verifyAdminAccessToken(token, { 
        audience: 'admin' 
      });
    }

    // Extract user identity from token payload
    const originalUserId = payload.originalUserId ?? payload.sub ?? payload.userId;
    const shadowUserId = payload.shadowUserId ?? originalUserId;
    
    if (!originalUserId || typeof originalUserId !== 'string') {
      console.error('[AUTH] Token missing user ID claims', {
        hasOriginalUserId: !!payload.originalUserId,
        hasSub: !!payload.sub,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        hasUserId: !!(payload as any).userId,
      });
      return null;
    }

    return {
      userId: shadowUserId,
      originalUserId,
      shadowUserId,
      roles: (payload.roles ?? []) as Role[],
      isAdmin: payload.isAdmin ?? true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      email: (payload as any).email,
    };
  } catch (error) {
    console.error('[AUTH] Token verification failed:', error);
    return null;
  }
}

/**
 * Authenticate request and extract user context
 * 
 * This is the primary authentication function for Tutorial Composer API routes.
 * 
 * @param request - Next.js request object
 * @returns AuthContext on success, AuthError on failure
 * 
 * @example
 * ```ts
 * const authResult = await authenticateRequest(request);
 * if ('type' in authResult) {
 *   return createAuthErrorResponse(authResult);
 * }
 * const { user } = authResult;
 * ```
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<AuthContext | AuthError> {
  const token = getAccessToken(request);

  if (!token) {
    return {
      type: 'MISSING_TOKEN',
      message: 'Authentication required. Please log in.',
    };
  }

  const user = await verifyToken(token);

  if (!user) {
    return {
      type: 'INVALID_TOKEN',
      message: 'Invalid or expired authentication token.',
    };
  }

  return { user };
}

/**
 * Create standard HTTP response for authentication errors
 * 
 * @param error - AuthError from authenticateRequest
 * @returns NextResponse with appropriate status code
 */
export function createAuthErrorResponse(error: AuthError): NextResponse {
  if (error.type === 'MISSING_TOKEN' || error.type === 'INVALID_TOKEN') {
    return NextResponse.json(
      { error: error.message },
      { status: 401 }
    );
  }

  if (error.type === 'FORBIDDEN') {
    return NextResponse.json(
      { error: error.message },
      { status: 403 }
    );
  }

  // Exhaustiveness check
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _exhaustive: never = error;
  return NextResponse.json({ error: 'Unknown auth error' }, { status: 500 });
}

/**
 * Check if user has required admin role
 * 
 * @param user - Authenticated user from AuthContext
 * @returns true if user has admin role
 */
export function hasAdminRole(user: AuthenticatedUser): boolean {
  return RBACService.isAdminLevel(user.roles) || user.isAdmin;
}

/**
 * Require admin role for API route
 * 
 * @param user - Authenticated user from AuthContext
 * @returns AuthError if not admin, null if authorized
 * 
 * @example
 * ```ts
 * const authError = requireAdminRole(user);
 * if (authError) {
 *   return createAuthErrorResponse(authError);
 * }
 * ```
 */
export function requireAdminRole(user: AuthenticatedUser): AuthError | null {
  if (!hasAdminRole(user)) {
    return {
      type: 'FORBIDDEN',
      message: 'Admin access required.',
    };
  }
  return null;
}

/**
 * Check if user has specific permission using RBAC system
 * 
 * @param user - Authenticated user
 * @param permission - Permission to check
 * @returns true if user has permission
 */
export function hasPermission(
  user: AuthenticatedUser,
  permission: Permission
): boolean {
  return RBACService.hasPermission(user.roles, permission, user.userId);
}

/**
 * Require specific permission for API route
 * 
 * @param user - Authenticated user
 * @param permission - Required permission
 * @param action - Description of action for error message
 * @returns AuthError if permission denied, null if authorized
 * 
 * @example
 * ```ts
 * const authError = requirePermission(user, PERMISSIONS.TUTORIAL_AUTHOR_CREATE, 'create tutorial');
 * if (authError) {
 *   return createAuthErrorResponse(authError);
 * }
 * ```
 */
export function requirePermission(
  user: AuthenticatedUser,
  permission: Permission,
  action?: string
): AuthError | null {
  if (!hasPermission(user, permission)) {
    return {
      type: 'FORBIDDEN',
      message: action
        ? `You do not have permission to ${action}.`
        : 'Permission denied.',
    };
  }
  return null;
}

/**
 * Verify user has permission to create tutorial content
 * 
 * Uses RBAC system to check TUTORIAL_AUTHOR_CREATE permission.
 * Currently granted to admin and super_admin roles.
 * 
 * @param user - Authenticated user
 * @returns AuthError if not authorized, null if authorized
 */
export function requireTutorialCreatePermission(
  user: AuthenticatedUser
): AuthError | null {
  return requirePermission(
    user,
    PERMISSIONS.TUTORIAL_AUTHOR_CREATE,
    'create tutorial content'
  );
}

/**
 * Verify user has permission to edit tutorial content
 * 
 * Uses RBAC system to check TUTORIAL_AUTHOR_EDIT permission.
 * Currently granted to admin and super_admin roles.
 * 
 * @param user - Authenticated user
 * @returns AuthError if not authorized, null if authorized
 */
export function requireTutorialEditPermission(
  user: AuthenticatedUser
): AuthError | null {
  return requirePermission(
    user,
    PERMISSIONS.TUTORIAL_AUTHOR_EDIT,
    'edit tutorial content'
  );
}

/**
 * Verify user has permission to delete tutorial content
 * 
 * Uses RBAC system to check TUTORIAL_AUTHOR_DELETE permission.
 * Currently granted to admin and super_admin roles.
 * 
 * @param user - Authenticated user
 * @returns AuthError if not authorized, null if authorized
 */
export function requireTutorialDeletePermission(
  user: AuthenticatedUser
): AuthError | null {
  return requirePermission(
    user,
    PERMISSIONS.TUTORIAL_AUTHOR_DELETE,
    'delete tutorial content'
  );
}

/**
 * Verify user has permission to publish tutorial content
 * 
 * Uses RBAC system to check TUTORIAL_AUTHOR_PUBLISH permission.
 * Currently granted to admin and super_admin roles.
 * 
 * @param user - Authenticated user
 * @returns AuthError if not authorized, null if authorized
 */
export function requireTutorialPublishPermission(
  user: AuthenticatedUser
): AuthError | null {
  return requirePermission(
    user,
    PERMISSIONS.TUTORIAL_AUTHOR_PUBLISH,
    'publish tutorial content'
  );
}

/**
 * Verify user has permission to modify a specific subtopic
 * 
 * CURRENT IMPLEMENTATION: Uses RBAC system for permission checking.
 * Permission grants are role-based (admin/super_admin can modify all subtopics).
 * 
 * FUTURE ENHANCEMENT: Once fine-grained access control is implemented,
 * this should check user's assigned subtopics against the requested subtopicId.
 * 
 * @param user - Authenticated user
 * @param subtopicId - Subtopic ID to check access for
 * @returns AuthError if not authorized, null if authorized
 */
export function requireSubtopicAccess(
  user: AuthenticatedUser,
  subtopicId: string
): AuthError | null {
  // Check if user has tutorial authoring permission (role-based)
  const hasAuthorPermission =
    hasPermission(user, PERMISSIONS.TUTORIAL_AUTHOR_CREATE) ||
    hasPermission(user, PERMISSIONS.TUTORIAL_AUTHOR_EDIT);

  if (!hasAuthorPermission) {
    return {
      type: 'FORBIDDEN',
      message: `Access denied to subtopic ${subtopicId}.`,
    };
  }

  // FUTURE ENHANCEMENT PLACEHOLDER:
  // Once fine-grained access control exists, add:
  // const userSubtopics = await getUserAssignedSubtopics(user.userId);
  // if (!userSubtopics.includes(subtopicId)) {
  //   return {
  //     type: 'FORBIDDEN',
  //     message: `You do not have access to modify subtopic ${subtopicId}.`,
  //   };
  // }

  return null;
}

/**
 * Verify user has permission for a specific brand
 * 
 * CURRENT IMPLEMENTATION: Uses RBAC system for permission checking.
 * Permission grants are role-based (admin/super_admin can access all brands).
 * 
 * FUTURE ENHANCEMENT: Once brand-level access control is implemented,
 * this should check user's assigned brands against the requested brandId.
 * 
 * @param user - Authenticated user
 * @param brandId - Brand ID to check access for
 * @returns AuthError if not authorized, null if authorized
 */
export function requireBrandAccess(
  user: AuthenticatedUser,
  brandId: string
): AuthError | null {
  // Check if user has tutorial authoring permission (role-based)
  const hasAuthorPermission =
    hasPermission(user, PERMISSIONS.TUTORIAL_AUTHOR_CREATE) ||
    hasPermission(user, PERMISSIONS.TUTORIAL_AUTHOR_EDIT);

  if (!hasAuthorPermission) {
    return {
      type: 'FORBIDDEN',
      message: `Access denied to brand ${brandId}.`,
    };
  }

  // FUTURE ENHANCEMENT PLACEHOLDER:
  // Once brand-level access control exists, add:
  // const userBrands = await getUserAssignedBrands(user.userId);
  // if (!userBrands.includes(brandId)) {
  //   return {
  //     type: 'FORBIDDEN',
  //     message: `You do not have access to modify content for brand ${brandId}.`,
  //   };
  // }

  return null;
}
