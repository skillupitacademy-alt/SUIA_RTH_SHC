import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { requireGatewaySecret } from '../verify-gateway-secret';

describe('requireGatewaySecret', () => {
  const originalSecret = process.env.INTERNAL_GATEWAY_SECRET;

  beforeEach(() => {
    process.env.INTERNAL_GATEWAY_SECRET = 'service-gateway-secret';
  });

  it('rejects requests without the gateway secret', async () => {
    const app = new Hono();
    app.use('*', requireGatewaySecret);
    app.get('/healthz', (c) => c.json({ status: 'ok' }));

    const response = await app.request('http://localhost/healthz');
    expect(response.status).toBe(403);
  });

  it('allows requests with the gateway secret', async () => {
    const app = new Hono();
    app.use('*', requireGatewaySecret);
    app.get('/healthz', (c) => c.json({ status: 'ok' }));

    const response = await app.request('http://localhost/healthz', {
      headers: { 'x-gateway-secret': 'service-gateway-secret' },
    });
    expect(response.status).toBe(200);
  });

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.INTERNAL_GATEWAY_SECRET;
      return;
    }

    process.env.INTERNAL_GATEWAY_SECRET = originalSecret;
  });
});
