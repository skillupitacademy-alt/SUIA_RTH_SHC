import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { requireGatewaySecret } from '../verify-gateway-secret';

describe('requireGatewaySecret', () => {
  const originalSecret = process.env.INTERNAL_GATEWAY_SECRET;

  beforeEach(() => {
    process.env.INTERNAL_GATEWAY_SECRET = 'service-gateway-secret';
  });

  it('allows healthz without the gateway secret', async () => {
    const app = new Hono();
    app.use('*', requireGatewaySecret);
    app.get('/healthz', (c) => c.json({ status: 'ok' }));
    app.get('/healthz/', (c) => c.json({ status: 'ok' }));

    const response = await app.request('http://localhost/healthz');
    expect(response.status).toBe(200);
  });

  it('allows trailing-slash healthz without the gateway secret', async () => {
    const app = new Hono();
    app.use('*', requireGatewaySecret);
    app.get('/healthz', (c) => c.json({ status: 'ok' }));
    app.get('/healthz/', (c) => c.json({ status: 'ok' }));

    const response = await app.request('http://localhost/healthz/');
    expect(response.status).toBe(200);
  });

  it('rejects auth routes without the gateway secret', async () => {
    const app = new Hono();
    app.use('*', requireGatewaySecret);
    app.get('/auth/login', (c) => c.json({ status: 'ok' }));
    app.get('/auth/me', (c) => c.json({ status: 'ok' }));

    const loginResponse = await app.request('http://localhost/auth/login');
    const meResponse = await app.request('http://localhost/auth/me');

    expect(loginResponse.status).toBe(403);
    expect(meResponse.status).toBe(403);
  });

  it('allows auth routes with the gateway secret', async () => {
    const app = new Hono();
    app.use('*', requireGatewaySecret);
    app.get('/auth/login', (c) => c.json({ status: 'ok' }));
    app.get('/auth/me', (c) => c.json({ status: 'ok' }));

    const loginResponse = await app.request('http://localhost/auth/login', {
      headers: { 'x-gateway-secret': 'service-gateway-secret' },
    });
    const meResponse = await app.request('http://localhost/auth/me', {
      headers: { 'x-gateway-secret': 'service-gateway-secret' },
    });

    expect(loginResponse.status).toBe(200);
    expect(meResponse.status).toBe(200);
  });

  it('rejects hierarchy routes without the gateway secret', async () => {
    const app = new Hono();
    app.use('*', requireGatewaySecret);
    app.get('/api/hierarchy/domains', (c) => c.json({ status: 'ok' }));

    const response = await app.request('http://localhost/api/hierarchy/domains');
    expect(response.status).toBe(403);
  });

  it('allows hierarchy routes with the gateway secret', async () => {
    const app = new Hono();
    app.use('*', requireGatewaySecret);
    app.get('/api/hierarchy/domains', (c) => c.json({ status: 'ok' }));

    const response = await app.request('http://localhost/api/hierarchy/domains', {
      headers: { 'x-gateway-secret': 'service-gateway-secret' },
    });
    expect(response.status).toBe(200);
  });

  it('rejects protected requests without the gateway secret', async () => {
    const app = new Hono();
    app.use('*', requireGatewaySecret);
    app.get('/api/private', (c) => c.json({ status: 'ok' }));

    const response = await app.request('http://localhost/api/private');
    expect(response.status).toBe(403);
  });

  it('rejects protected requests when the gateway secret is not configured', async () => {
    delete process.env.INTERNAL_GATEWAY_SECRET;

    const app = new Hono();
    app.use('*', requireGatewaySecret);
    app.get('/api/private', (c) => c.json({ status: 'ok' }));

    const response = await app.request('http://localhost/api/private');
    expect(response.status).toBe(403);
  });

  it('allows requests with the gateway secret', async () => {
    const app = new Hono();
    app.use('*', requireGatewaySecret);
    app.get('/api/private', (c) => c.json({ status: 'ok' }));

    const response = await app.request('http://localhost/api/private', {
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
