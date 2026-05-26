import { serve } from '@hono/node-server';
import { Hono } from 'hono';

import { resolveBrandAnalyticsConfig } from '@quiz/marketing-site/config/analytics';
import { getAnalyticsObservabilityState, ingestAnalyticsEvent } from '@quiz/marketing-site/lib/analytics/server/pipeline';

import { logger } from './logger';

function getClientIp(headers: Headers) {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headers.get('x-real-ip') ??
    '0.0.0.0'
  );
}

function isAuthorized(headers: Headers) {
  const expectedToken = process.env.ANALYTICS_ADMIN_TOKEN;
  if (!expectedToken) {
    return false;
  }

  const header = headers.get('authorization');
  return header === `Bearer ${expectedToken}`;
}

export const createApp = () => {
  const app = new Hono();

  app.get('/healthz', (c) => c.json({ status: 'ok', service: 'analytics-collector-service', ts: Date.now() }));

  app.post('/track', async (c) => {
    try {
      const hostname = c.req.header('host') ?? undefined;
      const brandHeader = c.req.header('x-analytics-brand');
      const brandConfig = resolveBrandAnalyticsConfig({
        brandId:
          brandHeader === 'realtutorialhub' || brandHeader === 'skillupitacademy'
            ? brandHeader
            : undefined,
        hostname,
      });

      const body = await c.req.json();
      const result = await ingestAnalyticsEvent({
        body,
        ipAddress: getClientIp(c.req.raw.headers),
        brandId: brandConfig.brandId,
      });

      logger.info(
        {
          brandId: brandConfig.brandId,
          deduped: result.deduped,
          eventId: result.eventId,
        },
        'analytics event accepted',
      );

      return c.json({ ok: true, ...result }, 202);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'analytics_request_failed';
      const status =
        message === 'analytics_rate_limit_exceeded'
          ? 429
          : message.startsWith('invalid_')
            ? 400
            : 500;

      logger.error({ err: error }, 'analytics event failed');
      return c.json({ ok: false, error: message }, status as 400 | 429 | 500);
    }
  });

  app.get('/observability', async (c) => {
    if (!isAuthorized(c.req.raw.headers)) {
      return c.json({ ok: false, error: 'unauthorized' }, 401);
    }

    return c.json({
      ok: true,
      state: getAnalyticsObservabilityState(),
    });
  });

  return app;
};

export const app = createApp();

export const startServer = (port = Number(process.env.PORT ?? 8080)) => {
  logger.info({ port }, 'starting analytics-collector-service');
  serve({
    fetch: app.fetch,
    port,
  });
};

if (process.env.ANALYTICS_COLLECTOR_DISABLE_AUTOSTART !== '1' && process.env.NODE_ENV !== 'test') {
  startServer();
}
