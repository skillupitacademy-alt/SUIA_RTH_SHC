import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';

describe('RTH normal logout BFF route (POST /api/auth/logout)', () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.GATEWAY_URL = 'http://127.0.0.1:8787';
    process.env.INTERNAL_GATEWAY_SECRET = 'test-internal-secret';
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('preserves multiple independent Set-Cookie expirations without comma folding for local host', async () => {
    // Upstream returns multiple distinct cookie-expiry headers with comma-bearing Expires values
    const upstreamCookies = [
      'accessToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=None; Domain=.realtutorialhub.localhost',
      'refreshToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=None; Domain=.realtutorialhub.localhost',
      'csrfToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure; SameSite=None',
      'onboarding_state=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=None',
    ];

    const mockHeaders = new Headers({ 'content-type': 'application/json' });
    for (const c of upstreamCookies) {
      mockHeaders.append('set-cookie', c);
    }

    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: 'Logged out' }), {
        status: 200,
        headers: mockHeaders,
      })
    );

    const request = new NextRequest('http://realtutorialhub.localhost:3003/api/auth/logout', {
      method: 'POST',
      headers: {
        host: 'realtutorialhub.localhost:3003',
        cookie: 'accessToken=dummy; refreshToken=dummy',
      },
    });

    const response = await POST(request);

    // 1. Preserves upstream 200 status
    expect(response.status).toBe(200);

    // 2. Preserves multiple independent Set-Cookie headers (no comma folding)
    const setCookies = response.headers.getSetCookie();
    expect(setCookies.length).toBe(4);

    // 3. Verifies each cookie contains matching local domain, path, and comma-bearing expires
    const accessCookie = setCookies.find((c) => c.startsWith('accessToken='));
    expect(accessCookie).toBeDefined();
    expect(accessCookie).toContain('Domain=realtutorialhub.localhost');
    expect(accessCookie).toContain('Path=/');
    expect(accessCookie).toContain('Expires=Thu, 01 Jan 1970 00:00:00 GMT');

    const refreshCookie = setCookies.find((c) => c.startsWith('refreshToken='));
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie).toContain('Domain=realtutorialhub.localhost');
    expect(refreshCookie).toContain('Path=/');
    expect(refreshCookie).toContain('Expires=Thu, 01 Jan 1970 00:00:00 GMT');

    const csrfCookie = setCookies.find((c) => c.startsWith('csrfToken='));
    expect(csrfCookie).toBeDefined();
    expect(csrfCookie).toContain('Domain=realtutorialhub.localhost');
    expect(csrfCookie).toContain('Path=/');
  });

  it('correctly rewrites cookie domains for apex production host without production network access', async () => {
    const upstreamCookies = [
      'accessToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=None; Domain=.realtutorialhub.com',
      'refreshToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=None; Domain=.realtutorialhub.com',
    ];

    const mockHeaders = new Headers({ 'content-type': 'application/json' });
    for (const c of upstreamCookies) {
      mockHeaders.append('set-cookie', c);
    }

    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: 'Logged out' }), {
        status: 200,
        headers: mockHeaders,
      })
    );

    const request = new NextRequest('https://realtutorialhub.com/api/auth/logout', {
      method: 'POST',
      headers: {
        host: 'realtutorialhub.com',
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const setCookies = response.headers.getSetCookie();
    expect(setCookies.length).toBe(2);

    for (const cookie of setCookies) {
      expect(cookie).toContain('Domain=realtutorialhub.com');
      expect(cookie).toContain('Path=/');
    }
  });

  it('correctly rewrites cookie domains for production subdomains (multi-label)', async () => {
    const upstreamCookies = [
      'accessToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=None; Domain=api.realtutorialhub.com',
    ];

    const mockHeaders = new Headers({ 'content-type': 'application/json' });
    mockHeaders.append('set-cookie', upstreamCookies[0]);

    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: 'Logged out' }), {
        status: 200,
        headers: mockHeaders,
      })
    );

    const request = new NextRequest('https://learn.realtutorialhub.com/api/auth/logout', {
      method: 'POST',
      headers: {
        host: 'learn.realtutorialhub.com',
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const setCookies = response.headers.getSetCookie();
    expect(setCookies.length).toBe(1);
    expect(setCookies[0]).toContain('Domain=.realtutorialhub.com');
  });

  it('preserves non-200 upstream response status and body without altering payload', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: 'Session expired' }), {
        status: 401,
        headers: new Headers({ 'content-type': 'application/json' }),
      })
    );

    const request = new NextRequest('http://realtutorialhub.localhost:3003/api/auth/logout', {
      method: 'POST',
      headers: { host: 'realtutorialhub.localhost:3003' },
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toEqual({ error: 'Session expired' });
  });
});
