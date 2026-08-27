import { Hono, type Context } from 'hono';

import { authenticateRequest } from '@/middleware/auth';
import { createCorsMiddleware } from '@/middleware/cors';
import { createTraceDebugMiddleware } from '@/middleware/trace-debug';
import { proxyRequest } from '@/lib/proxy';
import { createRateLimitMiddleware } from '@/middleware/rate-limit';
import { createRequestIdMiddleware } from '@/middleware/request-id';
import { resolveGatewayRoute } from '@/routes/routing-table';
import { buildGatewayHealthSnapshot } from '@/lib/validation';
import { resolveTrustedRequestBrand, hasTrustedInternalRequest } from '@/lib/request-brand';
import { validateBrandAssertion } from '@/lib/brand-assertion';
import type { GatewayBindings, GatewayVariables } from '@/types';

function rewritePath(pathname: string, routePrefix: string, upstreamPathPrefix?: string): string | undefined {
  if (upstreamPathPrefix === undefined) {
    return undefined;
  }

  const suffix = pathname.slice(routePrefix.length);
  return `${upstreamPathPrefix}${suffix}`;
}

export const createApp = () => {
  const app = new Hono<{ Bindings: GatewayBindings; Variables: GatewayVariables }>();

  app.onError((_error, c) =>
    c.json(
      {
        error: 'Internal Server Error',
        requestId: c.get('requestId'),
      },
      500,
    ),
  );

  // 🔥 OBSERVABILITY MIDDLEWARE
  app.use('*', createRequestIdMiddleware());
  app.use('*', createTraceDebugMiddleware()); // 🌐 NEW: Trace debugging
  app.use('*', createCorsMiddleware());
  app.use('*', createRateLimitMiddleware());

  app.get('/healthz', (c) => c.json({ status: 'ok', ts: Date.now() }));
  app.get('/internal/health', (c) => c.json(buildGatewayHealthSnapshot(c.env)));

  app.all('*', async (c: Context<{ Bindings: GatewayBindings; Variables: GatewayVariables }>) => {
    const perfStart = Date.now();
    const timings = {
      start: perfStart,
      afterRouteResolve: 0,
      afterAuth: 0,
      afterProxy: 0,
    };
    
    const requestUrl = new URL(c.req.url);
    const route = resolveGatewayRoute(requestUrl.hostname, requestUrl.pathname);
    timings.afterRouteResolve = Date.now();
    
    // 🔥 DEBUG: Log route resolution
    console.log('[GATEWAY_ROUTE_DEBUG]', JSON.stringify({
      hostname: requestUrl.hostname,
      pathname: requestUrl.pathname,
      routeFound: route !== undefined,
      routePrefix: route?.prefix,
      upstreamKey: route?.upstreamKey,
      upstreamPathPrefix: route?.upstreamPathPrefix,
      auth: route?.auth,
    }));
    
    // 🔒 SECURITY: Return 404 BEFORE auth to prevent resource enumeration
    // This prevents attackers from probing endpoints to detect valid routes
    if (route === undefined) {
      console.log('[GATEWAY_ERROR] No route found for request');
      return c.json({ error: 'Not Found', requestId: c.get('requestId') }, 404);
    }
    
    // 🔒 SECURITY: Reject catch-all routes for API paths to prevent enumeration
    // API paths should have explicit routes, not fall through to frontend catch-all
    // Exception: Host-specific catch-all routes (like admin.realtutorialhub.com -> /) are allowed
    const normalizedPath = requestUrl.pathname.startsWith('/api/') ? requestUrl.pathname.slice(4) : requestUrl.pathname;
    const isApiPath = requestUrl.pathname.startsWith('/api/');
    const isCatchAllRoute = route.prefix === '/';
    const isHostSpecificRoute = route.host !== undefined;
    
    if (isApiPath && isCatchAllRoute && !isHostSpecificRoute) {
      console.log('[GATEWAY_SECURITY] Blocked API path with catch-all route', JSON.stringify({
        pathname: requestUrl.pathname,
        normalizedPath,
        routePrefix: route.prefix,
        routeHost: route.host,
      }));
      return c.json({ error: 'Not Found', requestId: c.get('requestId') }, 404);
    }

    const upstream = c.env[route.upstreamKey];
    
    // 🔥 DEBUG: Log upstream resolution
    console.log('[GATEWAY_UPSTREAM_DEBUG]', JSON.stringify({
      upstreamKey: route.upstreamKey,
      upstreamFound: upstream !== undefined,
      upstreamUrl: upstream ? upstream.substring(0, 50) + '...' : 'undefined',
    }));
    
    if (typeof upstream !== 'string' || upstream.length === 0) {
      console.log('[GATEWAY_ERROR] Upstream not configured');
      return c.json({ error: 'Upstream not configured', requestId: c.get('requestId') }, 502);
    }

    // 🏷️ BRAND RESOLUTION: Resolve brand from trusted hostname source
    const requestBrand = resolveTrustedRequestBrand(c);
    
    // 🔥 STEP 4 DIAGNOSTIC: Evidence for brand resolution investigation
    console.log('[GATEWAY_BRAND_EVIDENCE]', JSON.stringify({
      requestUrl: c.req.url,
      host: c.req.header('host') ?? null,
      forwardedHost: c.req.header('x-forwarded-host') ?? null,
      originalHost: c.req.header('x-original-host') ?? null,
      assertedBrand: c.req.header('x-brand') ?? null,
      platform: c.req.header('x-platform') ?? null,
      trustedInternalRequest: hasTrustedInternalRequest(c),
      resolvedBrand: requestBrand?.brand ?? null,
      resolvedHostname: requestBrand?.hostname ?? null,
      resolvedSource: requestBrand?.source ?? null,
    }));
    
    if (!requestBrand) {
      console.log('[GATEWAY_ERROR] Unable to resolve brand from request');
      return c.json({ 
        error: 'Bad Request',
        reason: 'brand_unresolved',
        message: 'Unable to resolve brand from request hostname',
        requestId: c.get('requestId')
      }, 400);
    }

    const brand = requestBrand.brand;

    // 🔥 BRAND CONSISTENCY: Validate X-Brand header if present (trusted requests only)
    if (hasTrustedInternalRequest(c)) {
      const assertedBrand = c.req.header('x-brand');
      if (!validateBrandAssertion(assertedBrand, brand)) {
        console.log('[GATEWAY_ERROR] Brand assertion mismatch');
        return c.json({
          error: 'Forbidden',
          reason: 'brand_assertion_mismatch',
          requestId: c.get('requestId')
        }, 403);
      }
    }

    // 🔥 DEBUG: Log brand resolution
    console.log('[GATEWAY_BRAND_DEBUG]', JSON.stringify({
      hostname: requestBrand.hostname,
      brand: requestBrand.brand,
      source: requestBrand.source,
      internalRequest: hasTrustedInternalRequest(c),
    }));

    // 🔥 CRITICAL FIX: Set brand header for ALL requests (not just authenticated ones)
    // This ensures login/signup get the correct brand
    let requestToProxy = c.req.raw;
    const headers = new Headers(c.req.raw.headers);
    headers.set('x-brand', brand);
    requestToProxy = new Request(c.req.raw, { headers });

    let userId: string | undefined;
    let shadowUserId: string | undefined;
    let originalUserId: string | undefined;
    let portal: 'admin' | 'user' | undefined;
    let roles: string[] | undefined; // 🔥 ADD: Extract roles from JWT
    if (route.auth === true) {
      const authStart = Date.now();
      const authResult = await authenticateRequest(requestToProxy, c.env, route, brand);
      timings.afterAuth = Date.now();
      console.log('[PERF][GATEWAY][AUTH]', { duration: timings.afterAuth - authStart });
      
      if (authResult instanceof Response) {
        return authResult;
      }

      console.log('[GATEWAY_AUTH][CHECK]', JSON.stringify({
        requestId: c.get('requestId'),
        traceId: c.get('traceId'), // 🔥 NEW: Include trace ID
        host: requestUrl.hostname,
        path: requestUrl.pathname,
        portal: authResult.portal,
        tokenSource: authResult.tokenSource,
        requestBrand: authResult.requestBrand,
        roles: authResult.payload.roles, // 🔥 ADD: Log roles for debugging
      }));

      shadowUserId = authResult.payload.shadowUserId;
      originalUserId = authResult.payload.originalUserId;
      userId = originalUserId; // 🔥 FIX: Use originalUserId for database queries (profiles are stored under originalUserId)
      portal = authResult.portal;
      roles = authResult.payload.roles; // 🔥 ADD: Extract roles from JWT payload
      
      // 🔒 SECURITY: Ensure roles are always present for authenticated requests
      if (!roles || !Array.isArray(roles) || roles.length === 0) {
        console.error('[GATEWAY_SECURITY] Authenticated request missing roles', JSON.stringify({
          requestId: c.get('requestId'),
          path: requestUrl.pathname,
          portal,
          userId: userId?.slice(0, 8),
          rolesType: typeof roles,
          rolesValue: roles,
        }));
        // Don't block - let API server handle with empty roles (will deny via RBAC)
      }
      
      // Brand is already set from hostname resolution above
      c.set('user', authResult.payload);
    }

    // normalizedPath already declared above for security check - reuse it
    try {
      const response = await proxyRequest(requestToProxy, upstream, {
        requestId: c.get('requestId'),
        gatewaySecret: c.env.INTERNAL_GATEWAY_SECRET,
        userId,
        shadowUserId,
        originalUserId,
        portal,
        brand,
        roles, // 🔥 ADD: Forward roles to upstream
        upstreamPath: rewritePath(normalizedPath, route.prefix, route.upstreamPathPrefix),
      });
      timings.afterProxy = Date.now();
      
      // 🔥 PERFORMANCE INSTRUMENTATION
      const totalDuration = timings.afterProxy - timings.start;
      console.log('[PERF][GATEWAY]', JSON.stringify({
        total: totalDuration,
        breakdown: {
          routeResolve: timings.afterRouteResolve - timings.start,
          auth: route.auth ? timings.afterAuth - timings.afterRouteResolve : 0,
          proxy: timings.afterProxy - (route.auth ? timings.afterAuth : timings.afterRouteResolve),
        },
        path: requestUrl.pathname,
        method: c.req.method,
      }));
      
      return response;
    } catch (error) {
      console.error('[GATEWAY_PROXY_ERROR]', {
        requestId: c.get('requestId'),
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        upstream,
        path: requestUrl.pathname,
      });
      return c.json({ 
        error: 'Internal Server Error',
        requestId: c.get('requestId'),
        details: error instanceof Error ? error.message : 'Proxy failed'
      }, 500);
    }
  });

  app.notFound((c) => c.json({ error: 'Not Found', requestId: c.get('requestId') }, 404));

  return app;
};

const app = createApp();

export default app;
