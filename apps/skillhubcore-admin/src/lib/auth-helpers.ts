/**
 * Authentication Helpers for SkillHubCore Admin
 * 
 * Provides authentication and authorization utilities for internal API routes
 * that directly access the database (non-proxied routes).
 * 
 * Uses the existing RBAC permission system from @quiz/auth package.
 * 
 * Every admin handler verifies its local principal before database access or
 * upstream forwarding. The gateway remains an additional authorization boundary.
 */

import { TokenService, ConfigurationError } from '@quiz/auth';
import { RBACService, PERMISSIONS, type Permission } from '@quiz/auth/rbac';
import { normalizeRoles } from '@quiz/auth/rbac/normalize-roles';
import type { Role } from '@quiz/auth/rbac/roles';
import { decodeProtectedHeader } from 'jose';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { EXPECTED_JWT_ALGORITHM, EXPECTED_JWT_ISSUER } from './server-page-auth';
import { evaluateAccountAdmission } from './shc-account-authority';

interface AdminTokenClaims {
  sub?: string;
  userId?: string;
  originalUserId?: string;
  shadowUserId?: string;
  roles?: Role[] | string[];
  brand?: string;
  email?: string;
  isActive?: boolean;
  accountStatus?: string;
  isRevoked?: boolean;
  adminScope?: string[];
  allowedBrands?: string[];
  allowedSubtopics?: string[];
  iss?: string;
  exp?: number;
  nbf?: number;
}

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
  brand?: string;
  adminScope?: string[];
  allowedBrands?: string[];
  allowedSubtopics?: string[];
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
  | { type: 'FORBIDDEN'; message: string }
  | { type: 'SERVICE_UNAVAILABLE'; message: string };

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
 * Verify and extract user from access token.
 * 🔒 G2: Unified JWT verification enforcing algorithm HS256, pinned issuer skillhubcore.in,
 * audience shc-admin, finite unexpired exp, and brand isolation.
 * 
 * @param token - JWT access token
 * @returns AuthenticatedUser if valid, null if invalid
 */
async function verifyToken(token: string): Promise<AuthenticatedUser | null> {
  try {
    // 1. Verify protected header algorithm if token is formatted as a JWT
    try {
      const header = decodeProtectedHeader(token);
      if (header.alg !== EXPECTED_JWT_ALGORITHM) {
        return null;
      }
    } catch {
      // If token is a mock test token string, allow TokenService to process
    }

    // 2. Delegate to TokenService for signature and audience verification
    const rawPayload = await TokenService.verifyAdminAccessToken(token, { audience: 'shc-admin' });
    const payload = rawPayload as unknown as AdminTokenClaims;

    // 3. MANDATORY trusted issuer
    if (!payload.iss || payload.iss !== EXPECTED_JWT_ISSUER) {
      return null;
    }

    // 4. MANDATORY finite numeric future exp claim
    if (typeof payload.exp !== 'number' || !Number.isFinite(payload.exp)) {
      return null;
    }
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (payload.exp <= nowSeconds) {
      return null;
    }

    // 5. Not-before verification if present
    if (payload.nbf !== undefined) {
      const nowSeconds = Math.floor(Date.now() / 1000);
      if (typeof payload.nbf !== 'number' || !Number.isFinite(payload.nbf) || payload.nbf > nowSeconds) {
        return null;
      }
    }

    // 6. Enforce brand isolation
    if (!payload.brand || payload.brand !== 'skillhubcore') return null;

    // 7. G1: Token-level account status check
    if (
      payload.isActive === false ||
      payload.accountStatus === 'disabled' ||
      payload.isRevoked === true
    ) {
      return null;
    }

    // Extract user identity from token payload
    const originalUserId = payload.originalUserId ?? payload.sub ?? payload.userId;
    const shadowUserId = payload.shadowUserId ?? originalUserId;
    
    if (typeof originalUserId !== 'string' || !originalUserId.trim() ||
        typeof shadowUserId !== 'string' || !shadowUserId.trim()) {
      return null;
    }

    return {
      userId: shadowUserId,
      originalUserId,
      shadowUserId,
      roles: normalizeRoles(payload.roles),
      isAdmin: RBACService.isAdminLevel(normalizeRoles(payload.roles)),
      email: payload.email,
      brand: payload.brand,
      adminScope: payload.adminScope,
      allowedBrands: payload.allowedBrands ?? payload.adminScope,
      allowedSubtopics: payload.allowedSubtopics,
    };
  } catch (err) {
    if (err instanceof ConfigurationError || (err as { name?: string })?.name === 'ConfigurationError') {
      throw err;
    }
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

  let user: AuthenticatedUser | null = null;
  try {
    user = await verifyToken(token);
  } catch (err) {
    if (err instanceof ConfigurationError || (err as { name?: string })?.name === 'ConfigurationError') {
      return {
        type: 'SERVICE_UNAVAILABLE',
        message: 'Authentication service configuration error.',
      };
    }
    return {
      type: 'INVALID_TOKEN',
      message: 'Token verification failed.',
    };
  }

  if (!user) {
    return {
      type: 'INVALID_TOKEN',
      message: 'Invalid or expired authentication token.',
    };
  }

  // 🔒 G1: Authoritative live account admission check with token and roles
  const accountAdmission = await evaluateAccountAdmission({
    originalUserId: user.originalUserId,
    brand: user.brand ?? 'skillhubcore',
    token,
    tokenRoles: user.roles,
  });

  if (accountAdmission.status === 'UNAVAILABLE') {
    return {
      type: 'SERVICE_UNAVAILABLE',
      message: accountAdmission.message,
    };
  }
  if (accountAdmission.status === 'UNAUTHENTICATED') {
    return {
      type: 'INVALID_TOKEN',
      message: accountAdmission.message,
    };
  }
  if (accountAdmission.status === 'FORBIDDEN') {
    return {
      type: 'FORBIDDEN',
      message: accountAdmission.message,
    };
  }

  // 🔒 Reconcile effective roles & privileges (P1: R3-14, R3-15)
  const effectiveUser: AuthenticatedUser = {
    ...user,
    roles: accountAdmission.effectiveRoles,
    isAdmin: accountAdmission.isAdmin,
  };

  return { user: effectiveUser };
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
      { status: 401, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }

  if (error.type === 'FORBIDDEN') {
    return NextResponse.json(
      { error: error.message },
      { status: 403, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }

  if (error.type === 'SERVICE_UNAVAILABLE') {
    return NextResponse.json(
      { error: error.message },
      { status: 503, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }

  // Exhaustiveness check
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _exhaustive: never = error;
  return NextResponse.json(
    { error: 'Unknown auth error' },
    { status: 500, headers: { 'Cache-Control': 'private, no-store' } }
  );
}

/**
 * Check if user has required admin role
 * 
 * @param user - Authenticated user from AuthContext
 * @returns true if user has admin role
 */
export function hasAdminRole(user: AuthenticatedUser): boolean {
  return RBACService.isAdminLevel(user.roles);
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
  // Evaluate the union explicitly: the legacy shared RBAC canonicalizer drops
  // elevated roles when a student role is present. Each singleton still uses
  // the authoritative role-to-permission matrix, including wildcard grants.
  return user.roles.some(role => RBACService.hasPermission([role], permission, user.userId));
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
 * 🔒 G3: Verify user has permission to modify a specific subtopic.
 * Enforces actual resource-scope authorization:
 * - Checks tutorial authoring role permissions (TUTORIAL_AUTHOR_CREATE / EDIT / PUBLISH).
 * - Preserves platform-wide super_admin access.
 * - Enforces allowedSubtopics restrictions if specified on the principal.
 * 
 * @param user - Authenticated user
 * @param subtopicId - Subtopic ID to check access for
 * @returns AuthError if not authorized, null if authorized
 */
export function requireSubtopicAccess(
  user: AuthenticatedUser,
  subtopicId: string
): AuthError | null {
  const hasAuthorPermission =
    hasPermission(user, PERMISSIONS.TUTORIAL_AUTHOR_CREATE) ||
    hasPermission(user, PERMISSIONS.TUTORIAL_AUTHOR_EDIT);

  if (!hasAuthorPermission) {
    return {
      type: 'FORBIDDEN',
      message: `Access denied to subtopic ${subtopicId}. Authoring permission required.`,
    };
  }

  if (!subtopicId || typeof subtopicId !== 'string' || subtopicId.trim() === '') {
    return {
      type: 'FORBIDDEN',
      message: 'Invalid subtopic identifier.',
    };
  }

  // Reject non-SHC tenant callers attempting to manage SHC tutorial subtopics
  if (user.brand && user.brand !== 'skillhubcore') {
    return {
      type: 'FORBIDDEN',
      message: `Forbidden: tenant token '${user.brand}' cannot manage SHC tutorial subtopics.`,
    };
  }

  // super_admin has platform-wide authorization
  if (user.roles.includes('super_admin')) {
    return null;
  }

  // If explicit subtopic restrictions are defined on the principal, enforce them
  if (user.allowedSubtopics !== undefined) {
    if (!Array.isArray(user.allowedSubtopics) || user.allowedSubtopics.length === 0) {
      return {
        type: 'FORBIDDEN',
        message: 'Forbidden: author has no authorized subtopics assigned.',
      };
    }
    if (!user.allowedSubtopics.includes(subtopicId) && !user.allowedSubtopics.includes('*')) {
      return {
        type: 'FORBIDDEN',
        message: `Forbidden: user is not authorized to modify subtopic '${subtopicId}'.`,
      };
    }
    return null;
  }

  // 🔒 R5-06: Authorized SHC administrators have central authoring authority
  return null;
}

export const VALID_TUTORIAL_BRAND_IDS = new Set([
  'shared',
  'skillup',
  'realtutorialhub',
  'skillhubcore',
]);

/**
 * 🔒 G3 / R5-05 to R5-08: Verify user has permission for a specific tutorial brand.
 *
 * Central Authority Model:
 * - SHC Admin is the sole central authoring authority for all Tutorial V2 content.
 * - Valid tutorial distribution scopes are: 'shared', 'skillup', 'realtutorialhub', 'skillhubcore'.
 * - An authorized SHC administrator (with tutorial.author.create or tutorial.author.edit)
 *   can manage all valid distribution scopes without artificial per-brand scope claims.
 * - Non-SHC tenant tokens (e.g. user.brand !== 'skillhubcore') are strictly forbidden from SHC tutorial authoring.
 * 
 * @param user - Authenticated user
 * @param brandId - Brand ID to check access for
 * @returns AuthError if not authorized, null if authorized
 */
export function requireBrandAccess(
  user: AuthenticatedUser,
  brandId: string
): AuthError | null {
  const hasAuthorPermission =
    hasPermission(user, PERMISSIONS.TUTORIAL_AUTHOR_CREATE) ||
    hasPermission(user, PERMISSIONS.TUTORIAL_AUTHOR_EDIT);

  if (!hasAuthorPermission) {
    return {
      type: 'FORBIDDEN',
      message: `Access denied to brand ${brandId}. Authoring permission required.`,
    };
  }

  if (!brandId || typeof brandId !== 'string' || brandId.trim() === '') {
    return {
      type: 'FORBIDDEN',
      message: 'Invalid brand identifier.',
    };
  }

  const normalizedBrandId = brandId.trim().toLowerCase();
  if (!VALID_TUTORIAL_BRAND_IDS.has(normalizedBrandId)) {
    return {
      type: 'FORBIDDEN',
      message: `Invalid brand identifier '${brandId}'. Valid distribution brands are: ${Array.from(VALID_TUTORIAL_BRAND_IDS).join(', ')}.`,
    };
  }

  // Deny cross-tenant or learner-facing tenant tokens from SHC tutorial authoring
  if (user.brand && user.brand !== 'skillhubcore') {
    return {
      type: 'FORBIDDEN',
      message: `Forbidden: tenant token '${user.brand}' cannot author or manage SHC tutorials. Only SHC administrators are authorized.`,
    };
  }

  // super_admin has platform-wide wildcard authorization across all brands
  if (user.roles.includes('super_admin')) {
    return null;
  }

  // If explicit brand restrictions are defined on the principal, enforce them
  const allowedBrands = user.allowedBrands ?? user.adminScope;
  if (allowedBrands !== undefined) {
    if (!Array.isArray(allowedBrands) || allowedBrands.length === 0) {
      return {
        type: 'FORBIDDEN',
        message: 'Forbidden: administrator has no authorized brands assigned.',
      };
    }
    if (!allowedBrands.includes(normalizedBrandId) && !allowedBrands.includes('*')) {
      return {
        type: 'FORBIDDEN',
        message: `Forbidden: administrator scope does not permit accessing content for brand '${brandId}'.`,
      };
    }
    return null;
  }

  // 🔒 R5-06: Authorized SHC administrator has full central authoring authority across all valid distribution scopes
  return null;
}
