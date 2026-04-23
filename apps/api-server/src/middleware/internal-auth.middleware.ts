import type { NextRequest } from 'next/server';

/**
 * Internal Service-to-Service Authentication Middleware
 * 
 * Supports TWO TRUST MODES for multi-brand system:
 * 1. Gateway Mode: x-user-id + x-brand (existing)
 * 2. Internal Mode: x-internal-secret + identity headers (NEW)
 */

export interface AuthContext {
  userId: string;
  userEmail?: string;
  brand: string;
  correlationId: string;
  authMode: 'gateway' | 'internal';
}

export function validateRequest(req: NextRequest): { error?: Response; context?: AuthContext } {
  const correlationId = req.headers.get('x-correlation-id') ?? crypto.randomUUID();
  
  // Mode 1: Internal Service Authentication (NEW - FASTEST)
  const internalSecret = req.headers.get('x-internal-secret');
  const userId = req.headers.get('x-user-id');
  const userEmail = req.headers.get('x-user-email');
  const brand = req.headers.get('x-brand');
  
  console.log(`[AUTH][${correlationId}] Headers received:`, {
    hasInternalSecret: internalSecret !== null,
    internalSecretLength: internalSecret?.length ?? 0,
    internalSecretPreview: internalSecret !== null ? `${internalSecret.substring(0, 20)}...` : 'NONE',
    hasUserId: userId !== null,
    hasBrand: brand !== null,
    brand
  });
  
  console.log(`[AUTH][${correlationId}] Expected secret configured:`, {
    hasSecret: process.env.INTERNAL_API_SECRET !== undefined,
    secretLength: process.env.INTERNAL_API_SECRET?.length ?? 0,
    secretPreview: process.env.INTERNAL_API_SECRET !== undefined ? `${process.env.INTERNAL_API_SECRET.substring(0, 20)}...` : 'NONE'
  });
  
  // If internal secret is provided, validate it strictly
  if (internalSecret !== null) {
    console.log(`[AUTH][${correlationId}] Validating internal secret...`);
    
    // Trim both secrets to handle whitespace issues
    const receivedSecret = internalSecret.trim();
    const expectedSecret = process.env.INTERNAL_API_SECRET?.trim();
    
    console.log(`[AUTH][${correlationId}] Secret comparison:`, {
      receivedLength: receivedSecret.length,
      expectedLength: expectedSecret?.length ?? 0,
      match: receivedSecret === expectedSecret
    });
    
    if (expectedSecret !== receivedSecret) {
      console.error(`[AUTH][${correlationId}] Invalid internal secret provided`);
      console.error(`[AUTH][${correlationId}] Secret mismatch - received: ${receivedSecret?.substring(0, 20)}..., expected: ${expectedSecret?.substring(0, 20)}...`);
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
    
    console.log(`[AUTH][${correlationId}] Internal service authentication`);
    
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
    
    console.log(`[PERF][AUTH][INTERNAL][${correlationId}]`, { 
      duration: 0, 
      optimization: 'Skipped all auth validation',
      brand
    });
    
    return {
      context: {
        userId,
        userEmail: userEmail ?? undefined,
        brand,
        correlationId,
        authMode: 'internal'
      }
    };
  }
  
  // Mode 2: Gateway Authentication (EXISTING)
  const gatewayUserId = req.headers.get('x-user-id');
  const gatewayBrand = req.headers.get('x-brand');
  
  if (gatewayUserId !== null && gatewayBrand !== null) {
    console.log(`[AUTH][${correlationId}] Gateway authentication`);
    
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
    
    console.log(`[PERF][AUTH][GATEWAY][${correlationId}]`, { 
      duration: 1, 
      optimization: 'Skipped JWT validation',
      brand: gatewayBrand
    });
    
    return {
      context: {
        userId: gatewayUserId,
        userEmail: req.headers.get('x-user-email') ?? undefined,
        brand: gatewayBrand,
        correlationId,
        authMode: 'gateway'
      }
    };
  }
  
  // No internal or gateway auth - will fall back to JWT
  console.log(`[AUTH][${correlationId}] No internal/gateway auth, will use JWT fallback`);
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