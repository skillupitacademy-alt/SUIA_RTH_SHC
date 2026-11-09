import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from './route';

describe('RTH Admin Logout BFF route (POST /api/auth/logout)', () => {
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

  it('successfully proxies logout request to upstream and expires admin cookies', async () => {
    const upstreamCookies = [
      'admin_accessToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=None; Domain=.realtutorialhub.com',
      'admin_refreshToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=None; Domain=.realtutorialhub.com',
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

    const request = new NextRequest('http://localhost:3002/api/auth/logout', {
      method: 'POST',
      headers: {
        host: 'localhost:3002',
        cookie: 'admin_accessToken=dummyToken; admin_refreshToken=dummyRefresh',
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const setCookies = response.headers.getSetCookie();
    expect(setCookies.length).toBeGreaterThanOrEqual(2);

    const hasAdminAccessExpiry = setCookies.some((c) => c.includes('admin_accessToken='));
    expect(hasAdminAccessExpiry).toBe(true);

    const hasAdminRefreshExpiry = setCookies.some((c) => c.includes('admin_refreshToken='));
    expect(hasAdminRefreshExpiry).toBe(true);
  });

  it('guarantees admin cookie clearance even if upstream throws', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Gateway unreachable'));

    const request = new NextRequest('http://localhost:3002/api/auth/logout', {
      method: 'POST',
      headers: { host: 'localhost:3002' },
    });

    const response = await POST(request);
    // Returns 503 from catch block
    expect(response.status).toBe(503);

    // But cookies MUST still be cleared (fail closed)
    const setCookies = response.headers.getSetCookie();
    expect(setCookies.length).toBeGreaterThan(0);

    const hasAdminAccessExpiry = setCookies.some((c) => c.includes('admin_accessToken='));
    expect(hasAdminAccessExpiry).toBe(true);
  });
});

