import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { proxy } from '../proxy';

describe('api-server proxy protected route handling', () => {
  const originalSecret = process.env.INTERNAL_GATEWAY_SECRET;

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.INTERNAL_GATEWAY_SECRET;
      return;
    }

    process.env.INTERNAL_GATEWAY_SECRET = originalSecret;
  });

  it('allows auth routes without the gateway secret', async () => {
    process.env.INTERNAL_GATEWAY_SECRET = 'service-gateway-secret';
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok', { status: 200 }));

    const response = await proxy(new NextRequest('http://localhost/api/auth/login'));

    expect(response.status).toBe(200);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('allows auth routes when the gateway secret is not configured', async () => {
    delete process.env.INTERNAL_GATEWAY_SECRET;
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok', { status: 200 }));

    const response = await proxy(new NextRequest('http://localhost/api/auth/login'));

    expect(response.status).toBe(200);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('allows auth routes with the gateway secret', async () => {
    process.env.INTERNAL_GATEWAY_SECRET = 'service-gateway-secret';
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok', { status: 200 }));

    const response = await proxy(new NextRequest('http://localhost/api/auth/login', {
      headers: { 'x-gateway-secret': 'service-gateway-secret' },
    }));

    expect(response.status).toBe(200);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('requires auth on protected routes instead of failing on gateway secret drift', async () => {
    const response = await proxy(new NextRequest('http://localhost/api/status'));

    expect(response.status).toBe(401);
  });

  it('allows health routes without the gateway secret', async () => {
    const response = await proxy(new NextRequest('http://localhost/api/health/live'));

    expect(response.status).toBe(200);
  });

  it('allows public search routes without the gateway secret', async () => {
    process.env.INTERNAL_GATEWAY_SECRET = 'service-gateway-secret';

    const response = await proxy(new NextRequest('http://localhost/api/search?q=react&type=all'));

    expect(response.status).toBe(200);
  });

  it('allows public telemetry routes without the gateway secret', async () => {
    process.env.INTERNAL_GATEWAY_SECRET = 'service-gateway-secret';

    const response = await proxy(new NextRequest('http://localhost/api/telemetry'));

    expect(response.status).toBe(200);
  });

  it('allows public security report routes without the gateway secret', async () => {
    process.env.INTERNAL_GATEWAY_SECRET = 'service-gateway-secret';

    const response = await proxy(new NextRequest('http://localhost/api/security/report'));

    expect(response.status).toBe(200);
  });

  it('reissues csrf cookies on the shared parent domain for api hosts', async () => {
    const response = await proxy(new NextRequest('https://api.realtutorialhub.com/api/search?q=react', {
      headers: {
        host: 'api.realtutorialhub.com',
      },
    }));

    const setCookie = response.headers.get('set-cookie');

    expect(response.status).toBe(200);
    expect(setCookie).toContain('csrfToken=');
    expect(setCookie).toContain('Domain=.realtutorialhub.com');
  });
});
