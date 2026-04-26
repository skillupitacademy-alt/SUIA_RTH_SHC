/**
 * 🔐 GATEWAY-LEVEL RBAC (ZERO TRUST)
 * 
 * First layer of RBAC enforcement at Cloudflare Worker
 * API server provides second layer (defense in depth)
 */

export type Role = 'user' | 'student' | 'admin' | 'super_admin' | 'faculty' | 'infrastructure';

export type Permission = 
  | 'profile.read'
  | 'profile.write'
  | 'admin.panel'
  | 'analytics.view'
  | 'exam.create'
  | 'exam.grade'
  | 'user.manage'
  | '*';

/**
 * Role-Permission Mapping (Gateway Layer)
 * 
 * This is a simplified version for gateway-level checks
 * Full RBAC logic lives in API server
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  user: ['profile.read'],
  student: ['profile.read', 'profile.write'],
  admin: ['*'],
  super_admin: ['*'],
  faculty: ['profile.read', 'profile.write', 'exam.create', 'exam.grade'],
  infrastructure: ['*']
};

/**
 * Check if user has permission (Gateway Layer)
 */
export function hasPermission(roles: Role[], permission: Permission): boolean {
  if (!roles || roles.length === 0) {
    return false;
  }

  return roles.some(role => {
    const permissions = ROLE_PERMISSIONS[role];
    if (!permissions) return false;
    
    // Wildcard permission grants everything
    if (permissions.includes('*')) return true;
    
    // Check specific permission
    return permissions.includes(permission);
  });
}

/**
 * Route-Permission Mapping
 * 
 * Maps URL patterns to required permissions
 */
export const ROUTE_PERMISSIONS: Record<string, Permission> = {
  '/api/admin': 'admin.panel',
  '/api/analytics/admin': 'analytics.view',
  '/api/auth/profile': 'profile.read', // GET
  // Add more routes as needed
};

/**
 * Check if request should be allowed at gateway level
 * 
 * Returns:
 * - true: Allow request to proceed to API server
 * - false: Block request at gateway (403)
 */
export function shouldAllowRequest(
  pathname: string,
  method: string,
  roles: Role[]
): { allowed: boolean; reason?: string } {
  // Admin endpoints
  if (pathname.startsWith('/api/admin')) {
    if (!hasPermission(roles, 'admin.panel')) {
      return { 
        allowed: false, 
        reason: 'GATEWAY_RBAC: admin.panel permission required' 
      };
    }
  }

  // Analytics endpoints
  if (pathname.startsWith('/api/analytics/admin')) {
    if (!hasPermission(roles, 'analytics.view')) {
      return { 
        allowed: false, 
        reason: 'GATEWAY_RBAC: analytics.view permission required' 
      };
    }
  }

  // Profile write operations
  if (pathname === '/api/auth/profile' && method === 'PATCH') {
    if (!hasPermission(roles, 'profile.write')) {
      return { 
        allowed: false, 
        reason: 'GATEWAY_RBAC: profile.write permission required' 
      };
    }
  }

  // Allow by default (API server will do full RBAC check)
  return { allowed: true };
}

/**
 * JWT Payload interface for type safety
 */
interface JWTPayload {
  role?: string;
  roles?: string[];
  [key: string]: unknown;
}

/**
 * Extract roles from JWT payload
 */
export function extractRoles(jwtPayload: JWTPayload | null | undefined): Role[] {
  if (!jwtPayload) return [];
  
  // Handle single role
  if (jwtPayload.role) {
    return [jwtPayload.role.toLowerCase() as Role];
  }
  
  // Handle multiple roles
  if (jwtPayload.roles && Array.isArray(jwtPayload.roles)) {
    return jwtPayload.roles.map((r: unknown) => (r as string).toLowerCase() as Role);
  }
  
  return [];
}

/**
 * Log RBAC decision at gateway
 */
export function logGatewayRBAC(
  decision: 'ALLOW' | 'DENY',
  pathname: string,
  roles: Role[],
  reason?: string
) {
  console.log(JSON.stringify({
    tag: 'GATEWAY_RBAC',
    decision,
    pathname,
    roles,
    reason,
    timestamp: new Date().toISOString()
  }));
}
