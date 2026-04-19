import { Hono, type Context } from 'hono';

import { authenticateRequest } from '@/middleware/auth';
import { createCorsMiddleware } from '@/middleware/cors';
import { createTraceDebugMiddleware } from '@/middleware/trace-debug';
import { proxyRequest } from '@/lib/proxy';
import { createRateLimitMiddleware } from '@/middleware/rate-limit';
import { createRequestIdMiddleware } from '@/middleware/request-id';
import { resolveGatewayRoute } from '@/routes/routing-table';
import { buildGatewayHealthSnapshot } from '@/lib/validation';
import { resolveBrandFromHostname } from '@/middleware/auth';
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
    const requestUrl = new URL(c.req.url);
    const route = resolveGatewayRoute(requestUrl.hostname, requestUrl.pathname);
    
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
    
    if (route === undefined) {
      console.log('[GATEWAY_ERROR] No route found for request');
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

    // 🏷️ BRAND RESOLUTION: Use consistent hostname-based brand resolution
    const hostname = requestUrl.hostname.toLowerCase();
    const brand = resolveBrandFromHostname(hostname);

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
    if (route.auth === true) {
      const authResult = await authenticateRequest(requestToProxy, c.env, route);
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
        requestBrand: authResult.requestBrand ?? null,
      }));

      shadowUserId = authResult.payload.shadowUserId;
      originalUserId = authResult.payload.originalUserId;
      userId = shadowUserId;
      portal = authResult.portal;
      // Brand is already set from hostname resolution above
      c.set('user', authResult.payload);
    }

    // Normalize pathname — strip /api prefix to match route prefixes
    const normalizedPath = requestUrl.pathname.startsWith('/api/') ? requestUrl.pathname.slice(4) : requestUrl.pathname;

    try {
      return await proxyRequest(requestToProxy, upstream, {
        requestId: c.get('requestId'),
        gatewaySecret: c.env.INTERNAL_GATEWAY_SECRET,
        userId,
        shadowUserId,
        originalUserId,
        portal,
        brand,
        upstreamPath: rewritePath(normalizedPath, route.prefix, route.upstreamPathPrefix),
      });
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
