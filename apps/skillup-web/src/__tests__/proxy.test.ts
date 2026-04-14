import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

const verifyUserAccessTokenMock = vi.hoisted(() => vi.fn());

vi.mock('@quiz/auth', () => ({
  TokenService: {
    verifyUserAccessToken: verifyUserAccessTokenMock,
  },
}));

import { isPublicAuthRoute, proxy } from '../proxy';

const makeRequest = (pathname: string, cookie?: string) =>
  new NextRequest(`http://localhost${pathname}`, {
    headers: cookie !== undefined ? { cookie } : undefined,
  });

describe('skillup-web proxy', () => {
  it('allows auth api routes to pass through', async () => {
    const response = await proxy(makeRequest('/api/auth/login'));

    expect(isPublicAuthRoute('/api/auth/login')).toBe(true);
    expect(response.status).toBe(200);
  });

  it('keeps public catalogue routes accessible', async () => {
    const response = await proxy(makeRequest('/api/programs'));

    expect(response.status).toBe(200);
  });

  it('redirects dashboard to login when unauthenticated', async () => {
    const response = await proxy(makeRequest('/dashboard'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/login');
    expect(response.headers.get('location')).toContain('redirect=%2Fdashboard');
  });
});
