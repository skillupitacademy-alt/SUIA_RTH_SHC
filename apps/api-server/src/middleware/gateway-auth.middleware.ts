import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * 🔥 GATEWAY-FIRST ARCHITECTURE: Gateway Secret Validation
 * 
 * This middleware ensures ALL requests to the API server come through the API Gateway.
 * Direct API server access is FORBIDDEN.
 * 
 * SECURITY MODEL:
 * - Gateway validates JWT and injects user headers
 * - Gateway adds X-Gateway-Secret header
 * - API server trusts gateway headers if secret is valid
 * - API server rejects requests without valid gateway secret
 */

export function validateGatewaySecret(req: NextRequest): NextResponse | null {
  const gatewaySecret = req.headers.get('x-gateway-secret');
  const expectedSecret = process.env.INTERNAL_GATEWAY_SECRET;
  
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
  
  // Validate gateway secret for all other requests
  if (typeof expectedSecret !== 'string' || expectedSecret.trim().length === 0) {
    console.error('[GATEWAY_AUTH] INTERNAL_GATEWAY_SECRET not configured');
    return NextResponse.json(
      { 
        error: 'Server configuration error',
        message: 'Gateway secret not configured'
      },
      { status: 500 }
    );
  }
  
  if (typeof gatewaySecret !== 'string' || gatewaySecret !== expectedSecret) {
    const forwardedFor = req.headers.get('x-forwarded-for');
    const cfConnectingIp = req.headers.get('cf-connecting-ip');

    console.warn('[GATEWAY_AUTH] Invalid or missing gateway secret', {
      path: pathname,
      hasSecret: typeof gatewaySecret === 'string' && gatewaySecret.length > 0,
      ip: forwardedFor ?? cfConnectingIp ?? 'unknown',
    });
    
    return NextResponse.json(
      { 
        error: 'Forbidden',
        message: 'Direct API access is not allowed. All requests must go through API Gateway.'
      },
      { status: 403 }
    );
  }
  
  // Gateway secret is valid - allow request
  return null;
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
