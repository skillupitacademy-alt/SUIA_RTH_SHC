import { serve } from '@hono/node-server';
import { Hono } from 'hono';

import {
  resolveStrictServerIngressBrandConfig,
  type ServerAnalyticsIngressConfig,
  validateAnalyticsBrandHint,
  validateAndPinIngressEventBody,
} from '@quiz/marketing-site/config/analytics';
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

function sanitizeCollectorError(error: unknown): { status: 400 | 429 | 500 | 503; code: string } {
  const rawMessage = error instanceof Error ? error.message : '';
  if (rawMessage === 'analytics_ingress_unavailable') {
    return { status: 503, code: 'analytics_ingress_unavailable' };
  }
  if (rawMessage === 'analytics_rate_limit_exceeded') {
    return { status: 429, code: 'analytics_rate_limit_exceeded' };
  }
  if (rawMessage === 'invalid_analytics_brand_context') {
    return { status: 400, code: 'invalid_analytics_brand_context' };
  }
  if (rawMessage.startsWith('invalid_')) {
    return { status: 400, code: rawMessage };
  }
  if (error instanceof Error && error.name === 'ZodError') {
    return { status: 400, code: 'invalid_analytics_event_schema' };
  }
  return { status: 500, code: 'analytics_request_failed' };
}

export const createApp = (options?: ServerAnalyticsIngressConfig) => {
  const app = new Hono();

  app.get('/healthz', (c) => c.json({ status: 'ok', service: 'analytics-collector-service', ts: Date.now() }));

  app.post('/track', async (c) => {
    try {
      const brandConfig = resolveStrictServerIngressBrandConfig({
        mode: 'collector',
        hostHeader: c.req.raw.headers.get('host'),
        requestUrl: c.req.url,
        forwardedHostHeader: c.req.raw.headers.get('x-forwarded-host'),
        originHeader: c.req.raw.headers.get('origin'),
        options,
      });

      const brandHeader = c.req.raw.headers.get('x-analytics-brand');
      validateAnalyticsBrandHint(brandHeader, brandConfig.brandId);

      let rawBody: unknown;
      try {
        rawBody = await c.req.json();
      } catch {
        throw new Error('invalid_analytics_request_body');
      }

      const body = validateAndPinIngressEventBody(rawBody, brandConfig.brandId);
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
      const { status, code } = sanitizeCollectorError(error);

      logger.error({ error: code, status }, 'analytics event failed');
      return c.json({ ok: false, error: code }, status);
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
