import type { Context, Next } from 'hono';
import type { GatewayBindings, GatewayVariables } from '@/types';

/**
 * 🌐 CLOUDFLARE TRACE DEBUG MIDDLEWARE
 * 
 * Logs incoming request headers for debugging auth issues
 * Helps identify if headers are being stripped by Cloudflare
 */

interface DebugHeaders {
  cookie?: string;
  authorization?: string;
  'x-forwarded-for'?: string;
  'user-agent'?: string;
  'cf-connecting-ip'?: string;
  'cf-ray'?: string;
  'x-trace-id'?: string;
  origin?: string;
  referer?: string;
}

export function createTraceDebugMiddleware() {
  return async (c: Context<{ Bindings: GatewayBindings; Variables: GatewayVariables }>, next: Next) => {
    const traceId = c.get('requestId');
    const url = new URL(c.req.url);
    
    // Extract key headers for debugging
    const headers: DebugHeaders = {
      cookie: c.req.header('cookie')?.slice(0, 100), // Truncate for security
      authorization: c.req.header('authorization')?.slice(0, 50),
      'x-forwarded-for': c.req.header('x-forwarded-for'),
      'user-agent': c.req.header('user-agent'),
      'cf-connecting-ip': c.req.header('cf-connecting-ip'),
      'cf-ray': c.req.header('cf-ray'),
      'x-trace-id': traceId,
      origin: c.req.header('origin'),
      referer: c.req.header('referer'),
    };

    // Log request debug info
    console.log('🌐 [CF DEBUG] Incoming Request', JSON.stringify({
      traceId,
      method: c.req.method,
      url: url.pathname,
      hostname: url.hostname,
      hasCookie: !!headers.cookie,
      hasAuth: !!headers.authorization,
      cfRay: headers['cf-ray'],
      ip: headers['cf-connecting-ip'],
    }));

    // Log detailed headers for auth-related paths
    if (url.pathname.includes('/auth/') || url.pathname.includes('/profile') || url.pathname.includes('/onboarding')) {
      console.log('🔍 [CF AUTH DEBUG]', JSON.stringify({
        traceId,
        path: url.pathname,
        headers: {
          cookie: headers.cookie ? `${headers.cookie.slice(0, 30)}...` : 'MISSING',
          authorization: headers.authorization ? `${headers.authorization.slice(0, 20)}...` : 'MISSING',
          origin: headers.origin || 'MISSING',
        },
      }));
    }

    // Store trace ID in context for downstream use
    c.set('traceId', traceId);

    await next();

    // Log response status
    console.log('🌐 [CF DEBUG] Response', JSON.stringify({
      traceId,
      status: c.res.status,
      path: url.pathname,
    }));
  };
}

/**
 * Helper to check if critical headers are missing
 */
export function validateAuthHeaders(c: Context<{ Bindings: GatewayBindings; Variables: GatewayVariables }>): {
  valid: boolean;
  missing: string[];
} {
  const missing: string[] = [];
  
  const cookie = c.req.header('cookie');
  const auth = c.req.header('authorization');
  
  if (!cookie && !auth) {
    missing.push('cookie', 'authorization');
  }
  
  return {
    valid: missing.length === 0,
    missing,
  };
}
