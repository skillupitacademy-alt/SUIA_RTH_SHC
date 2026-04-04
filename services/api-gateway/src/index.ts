import { Hono, type Context } from 'hono';

import { authenticateRequest } from '@/middleware/auth';
import { createCorsMiddleware } from '@/middleware/cors';
import { proxyRequest } from '@/lib/proxy';
import { createRateLimitMiddleware } from '@/middleware/rate-limit';
import { createRequestIdMiddleware } from '@/middleware/request-id';
import { resolveGatewayRoute } from '@/routes/routing-table';
import { buildGatewayHealthSnapshot } from '@/lib/validation';
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

  app.use('*', createRequestIdMiddleware());
  app.use('*', createCorsMiddleware());
  app.use('*', createRateLimitMiddleware());

  app.get('/healthz', (c) => c.json({ status: 'ok', ts: Date.now() }));
  app.get('/internal/health', (c) => c.json(buildGatewayHealthSnapshot(c.env)));

  app.all('*', async (c: Context<{ Bindings: GatewayBindings; Variables: GatewayVariables }>) => {
    const requestUrl = new URL(c.req.url);
    const route = resolveGatewayRoute(requestUrl.hostname, requestUrl.pathname);
    if (route === undefined) {
      return c.json({ error: 'Not Found', requestId: c.get('requestId') }, 404);
    }

    const upstream = c.env[route.upstreamKey];
    if (typeof upstream !== 'string' || upstream.length === 0) {
      return c.json({ error: 'Upstream not configured', requestId: c.get('requestId') }, 502);
    }

    let userId: string | undefined;
    let shadowUserId: string | undefined;
    let originalUserId: string | undefined;
    let portal: 'admin' | 'user' | undefined;
    let brand: string | undefined;
    if (route.auth === true) {
      const authResult = await authenticateRequest(c.req.raw, c.env, route);
      if (authResult instanceof Response) {
        return authResult;
      }

      console.log('[GATEWAY_AUTH][CHECK]', JSON.stringify({
        requestId: c.get('requestId'),
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
      brand = authResult.requestBrand ?? authResult.payload.brand;
      c.set('user', authResult.payload);
    }

    // Normalize pathname — strip /api prefix to match route prefixes
    const normalizedPath = requestUrl.pathname.startsWith('/api/') ? requestUrl.pathname.slice(4) : requestUrl.pathname;

    return proxyRequest(c.req.raw, upstream, {
      requestId: c.get('requestId'),
      gatewaySecret: c.env.INTERNAL_GATEWAY_SECRET,
      userId,
      shadowUserId,
      originalUserId,
      portal,
      brand,
      upstreamPath: rewritePath(normalizedPath, route.prefix, route.upstreamPathPrefix),
    });
  });

  app.notFound((c) => c.json({ error: 'Not Found', requestId: c.get('requestId') }, 404));

  return app;
};

const app = createApp();

export default app;
