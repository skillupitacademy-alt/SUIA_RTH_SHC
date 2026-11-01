import type { NextRequest } from 'next/server';

/**
 * Internal Service-to-Service Authentication Middleware
 * 
 * Supports TWO TRUST MODES for multi-brand system:
 * 1. Gateway Mode: x-user-id + x-brand (existing)
 * 2. Internal Mode: x-internal-secret + identity headers (NEW)
 * 
 * Options:
 * - requireInternalSecret: When true, ONLY internal mode is accepted (gateway fallback disabled)
 */

export interface AuthContext {
  userId: string;
  userEmail?: string;
  brand: string;
  correlationId: string;
  authMode: 'gateway' | 'internal';
  roles?: string[]; // User roles for RBAC
}

export interface ValidateRequestOptions {
  requireInternalSecret?: boolean;
}

function rejectUnauthorized(message = 'Unauthorized') {
  return {
    error: new Response(
      JSON.stringify({ error: 'Unauthorized', message }),
      {
        status: 401,
        headers: { 'content-type': 'application/json' },
      }
    ),
  };
}

function serviceMisconfigured(message = 'Authentication service is misconfigured') {
  return {
    error: new Response(
      JSON.stringify({ error: 'Service Misconfigured', message }),
      {
        status: 503,
        headers: { 'content-type': 'application/json' },
      }
    ),
  };
}

export function validateRequest(
  req: NextRequest,
  options?: ValidateRequestOptions
): { error?: Response; context?: AuthContext } {
  const correlationId = req.headers.get('x-correlation-id') ?? crypto.randomUUID();
  
  // Mode 1: Internal Service Authentication (NEW - FASTEST)
  const internalSecret = req.headers.get('x-internal-secret');
  const userId = req.headers.get('x-user-id');
  const userEmail = req.headers.get('x-user-email');
  const brand = req.headers.get('x-brand');
  const userRoles = req.headers.get('x-user-roles'); // Extract roles from gateway
  
  // If internal secret is provided, validate it strictly
  if (internalSecret !== null) {
    // Trim both secrets to handle whitespace issues
    const receivedSecret = internalSecret.trim();
    const expectedSecret = process.env.INTERNAL_API_SECRET?.trim();
    
    if (!expectedSecret) {
      console.error(`[AUTH][${correlationId}] Internal authentication unavailable: INTERNAL_API_SECRET is not configured`);
      return serviceMisconfigured('Internal authentication is unavailable');
    }
    
    if (expectedSecret !== receivedSecret) {
      console.error(`[AUTH][${correlationId}] Invalid internal secret provided`);
      return rejectUnauthorized('Invalid internal service secret');
    }
    
    if (userId === null || brand === null) {
      console.error(`[AUTH][${correlationId}] Internal call missing required headers`);
      return {
        error: new Response(JSON.stringify({ 
          error: 'Bad Request', 
          message: 'Internal calls must include x-user-id and x-brand' 
        }), { 
          status: 400,
          headers: { 'content-type': 'application/json' }
        })
      };
    }
    
    // Validate brand for multi-brand system
    if (!['realtutorialhub', 'skillup'].includes(brand)) {
      console.error(`[AUTH][${correlationId}] Invalid brand: ${brand}`);
      return {
        error: new Response(JSON.stringify({ 
          error: 'Bad Request', 
          message: 'Invalid brand specified' 
        }), { 
          status: 400,
          headers: { 'content-type': 'application/json' }
        })
      };
    }
    
    // 🔥 CRITICAL FIX: Use unified role normalization
    // This handles "user,student" string → ["user"] array
    const roles = typeof userRoles === 'string' && userRoles.trim() !== ''
      ? userRoles.split(',').map(r => r.trim().toLowerCase()).filter(r => r.length > 0)
      : undefined;
    
    // 🚨 GUARD: Ensure roles is always array or undefined (never string)
    if (roles && !Array.isArray(roles)) {
      console.error(`🚨 [API_AUTH_ERROR][${correlationId}] Roles is not an array!`, { roles, type: typeof roles });
      throw new Error('RBAC_ERROR: Roles must be an array');
    }
    
    return {
      context: {
        userId,
        userEmail: userEmail ?? undefined,
        brand,
        correlationId,
        authMode: 'internal',
        roles, // Always array or undefined
      }
    };
  }
  
  // 🔒 SECURITY POLICY: Internal-Only Routes
  // When requireInternalSecret is true, missing internal secret is unauthorized
  // This prevents ILS routes from falling back to gateway authentication
  if (options?.requireInternalSecret === true) {
    return rejectUnauthorized('Internal secret required for this endpoint');
  }
  
  // Mode 2: Gateway Authentication (FAIL CLOSED)
  // 🔒 SECURITY FIX (GATEWAY-01): Fail-closed enforcement
  // When gateway headers (x-user-id + x-brand) are presented:
  // 1. GATEWAY_TRUST_SECRET must be configured in environment (otherwise 503 Service Misconfigured)
  // 2. x-gateway-secret header must match GATEWAY_TRUST_SECRET (otherwise 401 Unauthorized)
  const gatewayUserId = req.headers.get('x-user-id');
  const gatewayBrand = req.headers.get('x-brand');
  const gatewayRoles = req.headers.get('x-user-roles');
  
  if (gatewayUserId !== null && gatewayBrand !== null) {
    const gatewayTrustSecret = process.env.GATEWAY_TRUST_SECRET?.trim();
    if (!gatewayTrustSecret) {
      console.error(`[AUTH][${correlationId}] Gateway authentication unavailable: GATEWAY_TRUST_SECRET is not configured`);
      return serviceMisconfigured('Gateway authentication is unavailable');
    }

    const providedGatewaySecret = req.headers.get('x-gateway-secret')?.trim();
    if (!providedGatewaySecret || providedGatewaySecret !== gatewayTrustSecret) {
      console.error(`[AUTH][${correlationId}] Gateway auth rejected: invalid or missing x-gateway-secret`);
      return rejectUnauthorized('Invalid gateway credentials');
    }
    
    // Validate brand for multi-brand system
    if (!['realtutorialhub', 'skillup'].includes(gatewayBrand)) {
      console.error(`[AUTH][${correlationId}] Invalid gateway brand: ${gatewayBrand}`);
      return {
        error: new Response(JSON.stringify({ 
          error: 'Bad Request', 
          message: 'Invalid brand specified' 
        }), { 
          status: 400,
          headers: { 'content-type': 'application/json' }
        })
      };
    }
    
    // 🔥 CRITICAL FIX: Use unified role normalization
    // This handles "user,student" string → ["user"] array
    const roles = typeof gatewayRoles === 'string' && gatewayRoles.trim() !== ''
      ? gatewayRoles.split(',').map(r => r.trim().toLowerCase()).filter(r => r.length > 0)
      : undefined;
    
    // 🚨 GUARD: Ensure roles is always array or undefined (never string)
    if (roles && !Array.isArray(roles)) {
      console.error(`🚨 [API_AUTH_ERROR][${correlationId}] Roles is not an array!`, { roles, type: typeof roles });
      throw new Error('RBAC_ERROR: Roles must be an array');
    }
    
    return {
      context: {
        userId: gatewayUserId,
        userEmail: req.headers.get('x-user-email') ?? undefined,
        brand: gatewayBrand,
        correlationId,
        authMode: 'gateway',
        roles, // Always array or undefined
      }
    };
  }
  
  // No internal or gateway auth - will fall back to JWT
  return {};
}

/**
 * Block unauthorized direct access (security enforcement)
 * Strictly verifies secrets when gateway or internal headers are presented.
 * Bare x-user-id without verified gateway secret is rejected.
 */
export function blockDirectAccess(req: NextRequest): Response | null {
  const internalSecret = req.headers.get('x-internal-secret')?.trim();
  const gatewayUserId = req.headers.get('x-user-id')?.trim();
  const gatewaySecret = req.headers.get('x-gateway-secret')?.trim();
  const hasJwtCookie = req.headers.get('cookie')?.includes('accessToken=');
  const hasAuthHeader = req.headers.get('authorization')?.startsWith('Bearer ');
  
  // 1. If internal secret header is present, it must match configured INTERNAL_API_SECRET
  if (internalSecret) {
    const expectedInternal = process.env.INTERNAL_API_SECRET?.trim();
    if (expectedInternal && internalSecret === expectedInternal) {
      return null;
    }
    return new Response(JSON.stringify({ 
      error: 'Forbidden', 
      message: 'Invalid internal secret' 
    }), { 
      status: 403,
      headers: { 'content-type': 'application/json' }
    });
  }

  // 2. If gateway user header is present, it must be accompanied by a valid x-gateway-secret
  if (gatewayUserId) {
    const expectedGateway = process.env.GATEWAY_TRUST_SECRET?.trim();
    if (expectedGateway && gatewaySecret && gatewaySecret === expectedGateway) {
      return null;
    }
    return new Response(JSON.stringify({ 
      error: 'Forbidden', 
      message: 'Direct API access with unverified gateway headers is blocked' 
    }), { 
      status: 403,
      headers: { 'content-type': 'application/json' }
    });
  }

  // 3. Direct JWT access allowed via cookie or Authorization header
  if (hasJwtCookie === true || hasAuthHeader === true) {
    return null; // Allow to proceed to JWT validation
  }
  
  console.error('[AUTH] Blocked direct access - no authentication');
  return new Response(JSON.stringify({ 
    error: 'Forbidden', 
    message: 'Direct API access not allowed. Use proper authentication.' 
  }), { 
    status: 403,
    headers: { 'content-type': 'application/json' }
  });
}
