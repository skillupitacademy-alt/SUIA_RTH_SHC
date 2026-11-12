import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const verifyUserAccessTokenMock = vi.hoisted(() => vi.fn());

vi.mock('@quiz/auth', () => ({
  TokenService: {
    verifyUserAccessToken: verifyUserAccessTokenMock,
  },
}));

import { isPublicAuthRoute, proxy } from '../proxy';

const makeRequest = (pathname: string, cookie?: string, baseUrl = 'http://realtutorialhub.localhost:3003') => {
  const url = new URL(`${baseUrl}${pathname}`);
  return new NextRequest(url.toString(), {
    headers: {
      host: url.host,
      ...(cookie !== undefined ? { cookie } : {}),
    },
  });
};

describe('realtutorialhub-web proxy', () => {
  beforeEach(() => {
    verifyUserAccessTokenMock.mockReset();
  });

  it('allows the public login route without a gateway secret', async () => {
    const response = await proxy(makeRequest('/login'));

    expect(response.status).toBe(200);
  });

  it('allows auth api routes without a gateway secret', async () => {
    const response = await proxy(makeRequest('/api/auth/login'));

    expect(isPublicAuthRoute('/api/auth/login')).toBe(true);
    expect(response.status).toBe(200);
  });

  it('redirects dashboard to login on same origin when unauthenticated (local)', async () => {
    const response = await proxy(makeRequest('/dashboard', undefined, 'http://realtutorialhub.localhost:3003'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://realtutorialhub.localhost:3003/login?redirect=%2Fdashboard');
  });

  it('redirects dashboard to login on production origin when requested from production-shaped host', async () => {
    const response = await proxy(makeRequest('/dashboard', undefined, 'https://user.realtutorialhub.com'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://user.realtutorialhub.com/login?redirect=%2Fdashboard');
  });

  it('requires auth interception for protected RSC requests', async () => {
    const response = await proxy(makeRequest('/dashboard?_rsc=test', undefined, 'http://realtutorialhub.localhost:3003'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://realtutorialhub.localhost:3003/login?redirect=%2Fdashboard%3F_rsc%3Dtest');
  });

  it('redirects protected routes to login on same origin when unauthenticated', async () => {
    const response = await proxy(makeRequest('/tutorial-v2/full-stack/js/async/promises/notes', undefined, 'http://realtutorialhub.localhost:3003'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://realtutorialhub.localhost:3003/login?redirect=%2Ftutorial-v2%2Ffull-stack%2Fjs%2Fasync%2Fpromises%2Fnotes');
    expect(new URL(response.headers.get('location') ?? '').searchParams.get('redirect')).toBe('/tutorial-v2/full-stack/js/async/promises/notes');
  });

  it('accepts a valid brand JWT on public routes and adds user headers', async () => {
    verifyUserAccessTokenMock.mockResolvedValueOnce({
      sub: 'student-1',
      shadowUserId: 'shadow-student-1',
      originalUserId: 'brand-student-1',
      roles: ['student'],
      brand: 'realtutorialhub',
      subscriptions: ['notes'],
      iss: 'skillhubcore.in',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    const response = await proxy(makeRequest('/api/certificates/verify/code-123', 'accessToken=rth-token', 'http://realtutorialhub.localhost:3003'));

    expect(verifyUserAccessTokenMock).toHaveBeenCalledWith('rth-token', { audience: 'user' });
    expect(response.status).toBe(200);
    expect(response.headers.get('x-user-id')).toBe('shadow-student-1');
    expect(response.headers.get('x-shadow-user-id')).toBe('shadow-student-1');
    expect(response.headers.get('x-original-user-id')).toBe('brand-student-1');
  });

  it('allows public certificate verification without a token', async () => {
    const response = await proxy(makeRequest('/api/certificates/verify/code-123'));

    expect(response.status).toBe(200);
  });
});
