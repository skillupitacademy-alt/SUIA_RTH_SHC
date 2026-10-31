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
    
    
    if (expectedSecret !== receivedSecret) {
      console.error(`[AUTH][${correlationId}] Invalid internal secret provided`);
      // 🔐 SECURITY FIX: Removed secret substring log
      return {
        error: new Response(JSON.stringify({ 
          error: 'Unauthorized', 
          message: 'Invalid internal service secret' 
        }), { 
          status: 401,
          headers: { 'content-type': 'application/json' }
        })
      };
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
    return {
      error: new Response(JSON.stringify({ 
        error: 'Unauthorized', 
        message: 'Internal secret required for this endpoint' 
      }), { 
        status: 401,
        headers: { 'content-type': 'application/json' }
      })
    };
  }
  
  // Mode 2: Gateway Authentication (EXISTING)
  // 🔒 SECURITY FIX (GATEWAY-01): When GATEWAY_TRUST_SECRET is configured,
  // gateway mode requires the x-gateway-secret header to match.
  // This prevents attackers who can reach the API directly from spoofing
  // x-user-id + x-brand headers to impersonate any user.
  const gatewayUserId = req.headers.get('x-user-id');
  const gatewayBrand = req.headers.get('x-brand');
  const gatewayRoles = req.headers.get('x-user-roles');
  
  if (gatewayUserId !== null && gatewayBrand !== null) {
    const gatewayTrustSecret = process.env.GATEWAY_TRUST_SECRET;
    if (typeof gatewayTrustSecret === 'string' && gatewayTrustSecret.length > 0) {
      const providedGatewaySecret = req.headers.get('x-gateway-secret');
      if (providedGatewaySecret !== gatewayTrustSecret) {
        console.error(`[AUTH][${correlationId}] Gateway auth rejected: invalid or missing x-gateway-secret`);
        return {
          error: new Response(JSON.stringify({
            error: 'Unauthorized',
            message: 'Invalid gateway credentials'
          }), {
            status: 401,
            headers: { 'content-type': 'application/json' }
          })
        };
      }
    } else {
      // GATEWAY_TRUST_SECRET not configured — log deprecation warning
      console.warn(`[AUTH][${correlationId}] ⚠️ Gateway mode without GATEWAY_TRUST_SECRET is deprecated. Set GATEWAY_TRUST_SECRET and pass x-gateway-secret from BFF apps.`);
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
 */
export function blockDirectAccess(req: NextRequest): Response | null {
  const internalSecret = req.headers.get('x-internal-secret');
  const gatewayUserId = req.headers.get('x-user-id');
  const hasJwtCookie = req.headers.get('cookie')?.includes('accessToken=');
  
  // Allow if any valid auth method present
  if (internalSecret !== null || gatewayUserId !== null || hasJwtCookie === true) {
    return null; // Allow
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