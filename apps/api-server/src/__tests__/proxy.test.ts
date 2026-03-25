import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it } from 'vitest';

import { proxy } from '../proxy';

describe('api-server proxy gateway secret enforcement', () => {
  const originalSecret = process.env.INTERNAL_GATEWAY_SECRET;

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.INTERNAL_GATEWAY_SECRET;
      return;
    }

    process.env.INTERNAL_GATEWAY_SECRET = originalSecret;
  });

  it('rejects auth routes without the gateway secret', async () => {
    process.env.INTERNAL_GATEWAY_SECRET = 'service-gateway-secret';

    const response = await proxy(new NextRequest('http://localhost/api/auth/login'));

    expect(response.status).toBe(403);
  });

  it('rejects auth routes when the gateway secret is not configured', async () => {
    delete process.env.INTERNAL_GATEWAY_SECRET;

    const response = await proxy(new NextRequest('http://localhost/api/auth/login'));

    expect(response.status).toBe(403);
  });

  it('allows auth routes with the gateway secret', async () => {
    process.env.INTERNAL_GATEWAY_SECRET = 'service-gateway-secret';

    const response = await proxy(new NextRequest('http://localhost/api/auth/login', {
      headers: { 'x-gateway-secret': 'service-gateway-secret' },
    }));

    expect(response.status).toBe(200);
  });

  it('rejects status routes without the gateway secret', async () => {
    process.env.INTERNAL_GATEWAY_SECRET = 'service-gateway-secret';

    const response = await proxy(new NextRequest('http://localhost/api/status'));

    expect(response.status).toBe(403);
  });

  it('allows health routes without the gateway secret', async () => {
    const response = await proxy(new NextRequest('http://localhost/api/health/live'));

    expect(response.status).toBe(200);
  });
});
