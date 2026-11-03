import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * W1.2-REFRESH-05: POST /api/auth/refresh route ingress and authority tests
 *
 * Verifies:
 * 1. Missing raw x-brand/x-platform fails closed with 400 Bad Request
 * 2. Conflicting raw x-brand and x-platform fails closed with 400 Bad Request
 * 3. Invalid/shared raw brand fails closed with 400 Bad Request
 * 4. Preserved infrastructure route dispatch without tenant brand
 * 5. Valid tenant learner and admin refresh dispatches with verified brand
 */

const mocks = vi.hoisted(() => {
  class MockAuthService {}
  class MockTokenService {}

  const authService = {
    refresh: vi.fn(),
  };

  const tokenService = {
    getExpiration: vi.fn(),
  };

  return {
    MockAuthService,
    MockTokenService,
    authService,
    tokenService,
  };
});

vi.mock('@/modules/auth/auth.service', () => ({
  AuthService: mocks.MockAuthService,
}));

vi.mock('@/modules/auth/token.service', () => ({
  TokenService: mocks.MockTokenService,
}));

vi.mock('@/modules/core/container', () => ({
  container: {
    get: (key: unknown) => {
      if (key === mocks.MockAuthService) return mocks.authService;
      if (key === mocks.MockTokenService) return mocks.tokenService;
      throw new Error(`Unexpected container key: ${String(key)}`);
    },
  },
}));

vi.mock('@quiz/auth', () => ({
  setAuthCookies: vi.fn(),
}));

import { POST } from '../route';

describe('POST /api/auth/refresh Route Ingress Authority (W1.2-REFRESH-05)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.tokenService.getExpiration.mockReturnValue(new Date(Date.now() + 15 * 60 * 1000).toISOString());
  });

  it('rejects tenant refresh with 400 when both x-brand and x-platform are missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
      headers: {
        'x-portal-identity': 'user',
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.message).toMatch(/Missing required tenant brand header/i);
    expect(mocks.authService.refresh).not.toHaveBeenCalled();
  });

  it('rejects tenant refresh with 400 when x-brand and x-platform conflict', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
      headers: {
        'x-portal-identity': 'user',
        'x-brand': 'realtutorialhub',
        'x-platform': 'skillup',
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.message).toMatch(/Conflicting brand headers/i);
    expect(mocks.authService.refresh).not.toHaveBeenCalled();
  });

  it('rejects tenant refresh with 400 when x-brand is shared', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
      headers: {
        'x-portal-identity': 'user',
        'x-brand': 'shared',
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.message).toMatch(/Invalid tenant brand context/i);
    expect(mocks.authService.refresh).not.toHaveBeenCalled();
  });

  it('rejects tenant refresh with 400 when x-brand is unknown or invalid string', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
      headers: {
        'x-portal-identity': 'user',
        'x-brand': 'malicious-domain',
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.message).toMatch(/Invalid tenant brand context/i);
    expect(mocks.authService.refresh).not.toHaveBeenCalled();
  });

  it('rejects tenant refresh with 400 when refresh token cookie is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
      headers: {
        'x-portal-identity': 'user',
        'x-brand': 'skillup',
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.message).toMatch(/No refresh token for scope: user/i);
    expect(mocks.authService.refresh).not.toHaveBeenCalled();
  });

  it('preserves infrastructure dispatch without requiring tenant x-brand header', async () => {
    // Infrastructure requests are identified by x-portal-identity: infrastructure
    const request = new NextRequest('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
      headers: {
        'x-portal-identity': 'infrastructure',
      },
    });

    const response = await POST(request);
    // Should NOT fail with tenant brand header error; fails with No refresh token for scope: infrastructure
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.message).toMatch(/No refresh token for scope: infrastructure/i);
    expect(data.message).not.toMatch(/brand/i);
  });

  it('dispatches valid learner refresh with validated brand and cookies', async () => {
    mocks.authService.refresh.mockResolvedValue({
      accessToken: 'fresh-access-token',
      refreshToken: 'fresh-refresh-token',
    });

    const request = new NextRequest('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
      headers: {
        'x-portal-identity': 'user',
        'x-brand': 'skillup',
        cookie: 'refreshToken=valid-skillup-token',
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    expect(mocks.authService.refresh).toHaveBeenCalledWith(
      'valid-skillup-token',
      expect.anything(),
      undefined,
      'user',
      'skillup',
      expect.anything()
    );
  });

  it('dispatches valid admin refresh with validated brand and admin audience', async () => {
    mocks.authService.refresh.mockResolvedValue({
      accessToken: 'fresh-admin-access',
      refreshToken: 'fresh-admin-refresh',
    });

    const request = new NextRequest('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
      headers: {
        'x-portal-identity': 'admin',
        'x-brand': 'realtutorialhub',
        cookie: 'admin_refreshToken=valid-admin-token',
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    expect(mocks.authService.refresh).toHaveBeenCalledWith(
      'valid-admin-token',
      expect.anything(),
      undefined,
      'admin',
      'realtutorialhub',
      expect.anything()
    );
  });

  it('dispatches valid infrastructure refresh with infra_refreshToken cookie and sets infra cookies', async () => {
    mocks.authService.refresh.mockResolvedValue({
      accessToken: 'fresh-infra-access',
      refreshToken: 'fresh-infra-refresh',
    });

    const request = new NextRequest('http://localhost:3000/api/auth/refresh', {
      method: 'POST',
      headers: {
        'x-portal-identity': 'infrastructure',
        cookie: 'infra_refreshToken=valid-infra-token',
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    expect(mocks.authService.refresh).toHaveBeenCalledWith(
      'valid-infra-token',
      expect.anything(),
      undefined,
      'infra',
      undefined,
      expect.anything()
    );

    const setCookieHeaders = response.headers.getSetCookie();
    expect(setCookieHeaders.some((c) => c.includes('infra_accessToken='))).toBe(true);
    expect(setCookieHeaders.some((c) => c.includes('infra_refreshToken='))).toBe(true);
  });
});
