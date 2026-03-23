import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

const verifySkillHubCoreJWTMock = vi.hoisted(() => vi.fn());

vi.mock('@quiz/auth', () => ({
  TokenService: {
    verifySkillHubCoreJWT: verifySkillHubCoreJWTMock,
  },
}));

import { proxy } from '../proxy';

const makeRequest = (pathname: string, cookie?: string) =>
  new NextRequest(`http://localhost${pathname}`, {
    headers: cookie !== undefined ? { cookie } : undefined,
  });

describe('realtutorialhub-admin proxy', () => {
  it('redirects the root route to SkillHubCore login when unauthenticated', async () => {
    const response = await proxy(makeRequest('/'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/login');
    expect(new URL(response.headers.get('location') ?? '').searchParams.get('redirect')).toBe('/');
  });

  it('redirects protected dashboard routes to SkillHubCore login when unauthenticated', async () => {
    const response = await proxy(makeRequest('/dashboard/users'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/login');
    expect(new URL(response.headers.get('location') ?? '').searchParams.get('redirect')).toBe('/dashboard/users');
  });

  it('redirects student tokens to /unauthorized', async () => {
    verifySkillHubCoreJWTMock.mockResolvedValueOnce({
      sub: 'student-3',
      roles: ['student'],
      subscriptions: ['notes'],
      platforms: ['skillup'],
      iss: 'skillhubcore.in',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    const response = await proxy(makeRequest('/dashboard/content', 'accessToken=student-token'));

    expect(verifySkillHubCoreJWTMock).toHaveBeenCalledWith('student-token');
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/unauthorized');
  });

  it('allows admin tokens on protected routes', async () => {
    verifySkillHubCoreJWTMock.mockResolvedValueOnce({
      sub: 'admin-1',
      roles: ['admin'],
      subscriptions: ['notes'],
      platforms: ['realtutorialhub'],
      iss: 'skillhubcore.in',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    const response = await proxy(makeRequest('/dashboard/content', 'skillhubcore_accessToken=admin-token'));

    expect(verifySkillHubCoreJWTMock).toHaveBeenCalledWith('admin-token');
    expect(response.status).toBe(200);
    expect(response.headers.get('x-user-id')).toBe('admin-1');
  });

  it('allows the public health check without a token', async () => {
    const response = await proxy(makeRequest('/api/healthz'));

    expect(response.status).toBe(200);
  });
});
