import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from './route';

describe('SHC Admin Logout BFF Route (POST /api/auth/logout)', () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.ADMIN_JWT_SECRET = 'test-admin-secret-at-least-32-chars-long';
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('rejects logout requests from untrusted mutation origin (403 Forbidden)', async () => {
    const request = new NextRequest('http://skillhubcore.localhost:3007/api/auth/logout', {
      method: 'POST',
      headers: {
        host: 'skillhubcore.localhost:3007',
        origin: 'https://attacker.example.com',
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe('Untrusted request origin');
  });

  it('proxies logout to upstream on valid origin and expires all admin session cookies', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );

    const request = new NextRequest('http://skillhubcore.localhost:3007/api/auth/logout', {
      method: 'POST',
      headers: {
        host: 'skillhubcore.localhost:3007',
        origin: 'http://skillhubcore.localhost:3007',
        cookie: 'accessToken=mockToken; admin_accessToken=mockAdminToken',
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const setCookies = response.headers.getSetCookie();
    expect(setCookies.length).toBeGreaterThanOrEqual(4);

    const hasAccessTokenClearance = setCookies.some((c) => c.includes('accessToken=') && c.includes('Max-Age=0'));
    expect(hasAccessTokenClearance).toBe(true);

    const hasAdminAccessTokenClearance = setCookies.some((c) => c.includes('admin_accessToken=') && c.includes('Max-Age=0'));
    expect(hasAdminAccessTokenClearance).toBe(true);

    const hasDomainClearance = setCookies.some((c) => c.includes('Domain=.skillhubcore.in'));
    expect(hasDomainClearance).toBe(true);
  });

  it('guarantees admin session cookie clearance even if upstream proxy throws (fail-closed)', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Upstream unreachable'));

    const request = new NextRequest('http://skillhubcore.localhost:3007/api/auth/logout', {
      method: 'POST',
      headers: {
        host: 'skillhubcore.localhost:3007',
        origin: 'http://skillhubcore.localhost:3007',
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(502);

    const setCookies = response.headers.getSetCookie();
    expect(setCookies.length).toBeGreaterThanOrEqual(4);

    const hasAccessTokenClearance = setCookies.some((c) => c.includes('accessToken=') && c.includes('Max-Age=0'));
    expect(hasAccessTokenClearance).toBe(true);
  });
});
