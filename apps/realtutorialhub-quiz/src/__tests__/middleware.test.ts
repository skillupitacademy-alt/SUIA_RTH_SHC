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

describe('realtutorialhub-quiz proxy', () => {
  it('redirects protected dashboard routes to the local login route when unauthenticated', async () => {
    const response = await proxy(makeRequest('/dashboard'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/login');
    expect(new URL(response.headers.get('location') ?? '').searchParams.get('redirect')).toBe('/dashboard');
  });

  it('allows public health checks without a token', async () => {
    const response = await proxy(makeRequest('/api/healthz'));

    expect(response.status).toBe(200);
  });

  it('accepts a user JWT on exam routes', async () => {
    verifyUserAccessTokenMock.mockResolvedValueOnce({
      sub: 'student-2',
      roles: ['student'],
      email: 'student@example.com',
      aud: 'user',
    });

    const response = await proxy(makeRequest('/exam/abc', 'accessToken=user-token'));

    expect(verifyUserAccessTokenMock).toHaveBeenCalledWith('user-token', { audience: 'user' });
    expect(response.status).toBe(200);
    expect(response.headers.get('x-user-id')).toBe('student-2');
  });
});
