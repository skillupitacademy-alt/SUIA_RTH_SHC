import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * 🔥 GATEWAY-FIRST ARCHITECTURE: Internal Secret Validation
 * 
 * This middleware ensures ALL requests to the API server come through trusted sources.
 * Direct API server access is FORBIDDEN.
 * 
 * SECURITY MODEL:
 * - Gateway validates JWT and injects user headers
 * - Gateway adds X-Internal-Secret header (Phase 3: standardized)
 * - BFF services add X-Internal-Secret header for internal calls
 * - API server trusts headers if secret is valid
 * - API server rejects requests without valid secret
 * 
 * PHASE 3 TRANSITION:
 * - Accepts BOTH x-gateway-secret (legacy) and x-internal-secret (new standard)
 * - Prefers x-internal-secret if both present
 * - This allows zero-downtime migration
 */

export function validateGatewaySecret(req: NextRequest): NextResponse | null {
  // Phase 3: Check for new standardized header first
  const internalSecret = req.headers.get('x-internal-secret');
  // Backward compatibility: Check legacy header
  const gatewaySecret = req.headers.get('x-gateway-secret');
  
  const expectedSecret = process.env.INTERNAL_GATEWAY_SECRET;
  const expectedInternalSecret = process.env.INTERNAL_API_SECRET;
  
  // Allow health checks without gateway secret
  const pathname = req.nextUrl.pathname;
  if (pathname === '/api/health' || pathname === '/api/health/live' || pathname === '/health' || pathname === '/healthz') {
    return null;
  }
  
  // Allow public auth endpoints (login, signup) without gateway secret
  // These endpoints don't have JWT yet, so gateway can't validate
  const publicAuthPaths = [
    '/api/auth/login',
    '/api/auth/signup',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/verify-email',
  ];
  
  if (publicAuthPaths.some(path => pathname === path || pathname.startsWith(`${path}/`))) {
    return null;
  }
  
  // 🔥 PHASE 3: Unified internal authentication
  // Accept BOTH x-internal-secret (new standard) and x-gateway-secret (legacy)
  // This allows zero-downtime migration
  
  // Priority 1: Check x-internal-secret (new standard from BFF or Gateway)
  if (internalSecret !== null) {
    const trimmedInternalSecret = internalSecret.trim();
    const trimmedExpectedSecret = expectedInternalSecret?.trim();
    
    console.log('[GATEWAY_AUTH] Internal secret authentication', {
      path: pathname,
      headerType: 'x-internal-secret',
      hasSecret: true,
      secretMatch: trimmedInternalSecret === trimmedExpectedSecret,
    });
    
    if (trimmedExpectedSecret !== undefined && trimmedInternalSecret === trimmedExpectedSecret) {
      console.log('[GATEWAY_AUTH] Internal authentication SUCCESS (x-internal-secret)');
      return null; // Allow request
    }
    
    console.error('[GATEWAY_AUTH] Invalid internal secret', {
      path: pathname,
      received: trimmedInternalSecret.substring(0, 10) + '...',
      expected: trimmedExpectedSecret !== undefined ? trimmedExpectedSecret.substring(0, 10) + '...' : 'NOT_SET',
    });
    
    return NextResponse.json(
      { 
        error: 'Forbidden',
        message: 'Invalid internal service secret'
      },
      { status: 403 }
    );
  }
  
  // Priority 2: Check x-gateway-secret (legacy, backward compatibility)
  if (gatewaySecret !== null) {
    const trimmedGatewaySecret = gatewaySecret.trim();
    const trimmedExpectedSecret = expectedSecret?.trim();
    
    console.log('[GATEWAY_AUTH] Gateway secret authentication (legacy)', {
      path: pathname,
      headerType: 'x-gateway-secret',
      hasSecret: true,
      secretMatch: trimmedGatewaySecret === trimmedExpectedSecret,
    });
    
    if (trimmedExpectedSecret !== undefined && trimmedGatewaySecret === trimmedExpectedSecret) {
      console.log('[GATEWAY_AUTH] Gateway authentication SUCCESS (x-gateway-secret - legacy)');
      return null; // Allow request
    }
    
    console.error('[GATEWAY_AUTH] Invalid gateway secret', {
      path: pathname,
      received: trimmedGatewaySecret.substring(0, 10) + '...',
      expected: trimmedExpectedSecret !== undefined ? trimmedExpectedSecret.substring(0, 10) + '...' : 'NOT_SET',
    });
    
    return NextResponse.json(
      { 
        error: 'Forbidden',
        message: 'Invalid gateway secret'
      },
      { status: 403 }
    );
  }
  
  // No valid authentication header found
  const forwardedFor = req.headers.get('x-forwarded-for');
  const cfConnectingIp = req.headers.get('cf-connecting-ip');

  console.warn('[GATEWAY_AUTH] No valid authentication header', {
    path: pathname,
    hasInternalSecret: false,
    hasGatewaySecret: false,
    ip: forwardedFor ?? cfConnectingIp ?? 'unknown',
  });
  
  return NextResponse.json(
    { 
      error: 'Forbidden',
      message: 'Direct API access is not allowed. All requests must go through API Gateway or BFF.'
    },
    { status: 403 }
  );
}

/**
 * Middleware wrapper for Next.js API routes
 */
export function withGatewayAuth(
  handler: (req: NextRequest) => Promise<NextResponse> | NextResponse
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const validationError = validateGatewaySecret(req);
    if (validationError) {
      return validationError;
    }
    
    return handler(req);
  };
}
