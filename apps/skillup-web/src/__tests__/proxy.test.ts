import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const verifyUserAccessTokenMock = vi.hoisted(() => vi.fn());

vi.mock('@quiz/auth', () => ({
  TokenService: {
    verifyUserAccessToken: verifyUserAccessTokenMock,
  },
}));

import { isPublicAuthRoute, proxy } from '../proxy';

const makeRequest = (pathname: string, cookie?: string, baseUrl = 'http://localhost') =>
  new NextRequest(`${baseUrl}${pathname}`, {
    headers: cookie !== undefined ? { cookie } : undefined,
  });

describe('skillup-web proxy', () => {
  beforeEach(() => {
    verifyUserAccessTokenMock.mockReset();
  });

  it('allows auth api routes to pass through', async () => {
    const response = await proxy(makeRequest('/api/auth/login'));

    expect(isPublicAuthRoute('/api/auth/login')).toBe(true);
    expect(response.status).toBe(200);
  });

  it('keeps public catalogue routes accessible', async () => {
    const response = await proxy(makeRequest('/api/programs'));

    expect(response.status).toBe(200);
  });

  it('redirects dashboard to login on same origin when unauthenticated (local)', async () => {
    const response = await proxy(makeRequest('/dashboard', undefined, 'http://skillup.localhost:3009'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://skillup.localhost:3009/login?redirect=%2Fdashboard');
  });

  it('redirects to production login origin when requested from production-shaped host', async () => {
    const response = await proxy(makeRequest('/dashboard', undefined, 'https://user.skillupitacademy.com'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://user.skillupitacademy.com/login?redirect=%2Fdashboard');
  });

  it('requires auth interception for protected RSC requests', async () => {
    const response = await proxy(makeRequest('/dashboard?_rsc=test', undefined, 'http://skillup.localhost:3009'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://skillup.localhost:3009/login?redirect=%2Fdashboard%3F_rsc%3Dtest');
  });
});
