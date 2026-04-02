import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

const verifyUserAccessTokenMock = vi.hoisted(() => vi.fn());

vi.mock('@quiz/auth', () => ({
  TokenService: {
    verifyUserAccessToken: verifyUserAccessTokenMock,
  },
}));

import { proxy } from '../proxy';

const makeRequest = (pathname: string, cookie?: string) =>
  new NextRequest(`http://localhost${pathname}`, {
    headers: cookie !== undefined ? { cookie } : undefined,
  });

describe('realtutorialhub-web proxy', () => {
  it('allows the public login route without a gateway secret', async () => {
    const response = await proxy(makeRequest('/login'));

    expect(response.status).toBe(200);
  });

  it('redirects protected routes to SkillHubCore login when unauthenticated', async () => {
    const response = await proxy(makeRequest('/learn/full-stack/js/promises'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://user.realtutorialhub.com/login?redirect=%2Flearn%2Ffull-stack%2Fjs%2Fpromises');
    expect(new URL(response.headers.get('location') ?? '').searchParams.get('redirect')).toBe('/learn/full-stack/js/promises');
  });

  it('accepts a SkillUp JWT on protected routes', async () => {
    verifyUserAccessTokenMock.mockResolvedValueOnce({
      sub: 'student-1',
      roles: ['student'],
      subscriptions: ['notes'],
      iss: 'skillhubcore.in',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    const response = await proxy(makeRequest('/api/tutorial/content/abc', 'accessToken=skillup-token'));

    expect(verifyUserAccessTokenMock).toHaveBeenCalledWith('skillup-token', { audience: 'user' });
    expect(response.status).toBe(200);
    expect(response.headers.get('x-user-id')).toBe('student-1');
  });

  it('allows public certificate verification without a token', async () => {
    const response = await proxy(makeRequest('/api/certificates/verify/code-123'));

    expect(response.status).toBe(200);
  });
});
