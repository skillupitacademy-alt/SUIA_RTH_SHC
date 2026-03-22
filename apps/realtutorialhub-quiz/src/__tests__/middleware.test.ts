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

describe('realtutorialhub-quiz proxy', () => {
  it('redirects protected dashboard routes to SkillHubCore login when unauthenticated', async () => {
    const response = await proxy(makeRequest('/dashboard'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('skillhubcore');
    expect(new URL(response.headers.get('location') ?? '').searchParams.get('redirect')).toBe('/dashboard');
  });

  it('allows public health checks without a token', async () => {
    const response = await proxy(makeRequest('/api/healthz'));

    expect(response.status).toBe(200);
  });

  it('accepts a cross-platform JWT on exam routes', async () => {
    verifySkillHubCoreJWTMock.mockResolvedValueOnce({
      sub: 'student-2',
      roles: ['student'],
      subscriptions: ['notes'],
      platforms: ['skillup'],
      iss: 'skillhubcore.in',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    const response = await proxy(makeRequest('/exam/abc', 'skillhubcore_accessToken=skillup-token'));

    expect(verifySkillHubCoreJWTMock).toHaveBeenCalledWith('skillup-token');
    expect(response.status).toBe(200);
    expect(response.headers.get('x-user-id')).toBe('student-2');
  });
});
