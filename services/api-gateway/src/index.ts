import { Hono, type Context } from 'hono';

import { authenticateRequest, hasRequiredRole } from '@/middleware/auth';
import { createCorsMiddleware } from '@/middleware/cors';
import { proxyRequest } from '@/lib/proxy';
import { createRateLimitMiddleware } from '@/middleware/rate-limit';
import { createRequestIdMiddleware } from '@/middleware/request-id';
import { resolveGatewayRoute } from '@/routes/routing-table';
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
    if (route.auth === true) {
      const authResult = await authenticateRequest(c.req.raw, c.env);
      if (authResult instanceof Response) {
        return authResult;
      }

      if (route.requireRole === 'admin' && hasRequiredRole(authResult.payload, 'admin') === false) {
        return c.json({ error: 'Forbidden', requestId: c.get('requestId') }, 403);
      }

      userId = authResult.payload.sub;
      c.set('user', authResult.payload);
    }

    return proxyRequest(c.req.raw, upstream, {
      requestId: c.get('requestId'),
      gatewaySecret: c.env.INTERNAL_GATEWAY_SECRET,
      userId,
      upstreamPath: rewritePath(requestUrl.pathname, route.prefix, route.upstreamPathPrefix),
    });
  });

  app.notFound((c) => c.json({ error: 'Not Found', requestId: c.get('requestId') }, 404));

  return app;
};

const app = createApp();

export default app;
