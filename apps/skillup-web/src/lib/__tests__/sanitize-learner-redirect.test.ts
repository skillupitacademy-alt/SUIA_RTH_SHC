import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { sanitizeLearnerRedirect } from '@/share-branding/auth/sanitizeLearnerRedirect';
import { mapLoginError, mapLoginResponse } from '@/share-branding/auth/authMapper';
import { fetchCurrentUserState } from '@/share-branding/auth/authLoader';
import { validateAuthState } from '@/share-branding/auth/validateAuthState';

const nextHeadersMock = vi.hoisted(() => ({
  headers: vi.fn(),
  cookies: vi.fn(),
}));

vi.mock('next/headers', () => nextHeadersMock);

describe('sanitizeLearnerRedirect', () => {
  it.each([
    [null, '/dashboard'],
    [undefined, '/dashboard'],
    ['', '/dashboard'],
    ['   ', '/dashboard'],
    ['https://evil.example/steal', '/dashboard'],
    ['http://evil.example/steal', '/dashboard'],
    ['//evil.example/steal', '/dashboard'],
    ['/\\evil.example', '/dashboard'],
    ['javascript:alert(1)', '/dashboard'],
    ['data:text/html,<script>alert(1)</script>', '/dashboard'],
    ['/login', '/dashboard'],
    ['/login?redirect=/dashboard', '/dashboard'],
    ['/signup', '/dashboard'],
    ['/register', '/dashboard'],
    ['/forgot-password', '/dashboard'],
    ['/reset-password', '/dashboard'],
    ['/%2f/evil.example', '/dashboard'],
    ['/%5c/evil.example', '/dashboard'],
    ['/%0a/evil.example', '/dashboard'],
    ['/%0d/evil.example', '/dashboard'],
    ['/dashboard\u0000evil', '/dashboard'],
    ['/dashboard\r\nevil', '/dashboard'],
  ])('rejects unsafe or loop redirect %j -> %s', (input, expected) => {
    expect(sanitizeLearnerRedirect(input)).toBe(expected);
  });

  it.each([
    ['/dashboard', '/dashboard'],
    ['/dashboard?tab=active#today', '/dashboard?tab=active#today'],
    ['/learn/python', '/learn/python'],
    ['/tutorial-v2/programming/python/basics/variables/intro?mode=practice', '/tutorial-v2/programming/python/basics/variables/intro?mode=practice'],
    ['/student/attendance', '/student/attendance'],
  ])('allows safe internal learner path %s', (input, expected) => {
    expect(sanitizeLearnerRedirect(input)).toBe(expected);
  });
});

describe('mapLoginError & mapLoginResponse public error boundary', () => {
  it.each([
    [401, 'Invalid email or password.'],
    [403, 'Access denied.'],
    [429, 'Too many attempts. Try again later.'],
    [400, 'Please check your details.'],
    [422, 'Please check your details.'],
    [409, 'Account cannot be created with those details.'],
    [500, 'Authentication service is temporarily unavailable.'],
    [503, 'Authentication service is temporarily unavailable.'],
  ])('maps HTTP %i to fixed public message without echoing backend diagnostics', (status, expectedMessage) => {
    const err = mapLoginError(
      {
        error: 'private-sql-diagnostic-canary',
        message: 'stack-trace-secret-canary',
        _error: 'internal-gateway-canary',
      },
      status,
    );
    expect(err.message).toBe(expectedMessage);
    expect(err.message).not.toContain('canary');
  });

  it('preserves user summary in mapLoginResponse', () => {
    const mapped = mapLoginResponse({
      user: {
        id: 'learner-1',
        email: 'learner@example.invalid',
        onboardingCompleted: true,
        roles: ['student'],
      },
      expiresAt: null,
    });
    expect(mapped.success).toBe(true);
    expect(mapped.user?.onboardingCompleted).toBe(true);
  });
});

describe('validateAuthState & fetchCurrentUserState (browser vs SSR)', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('uses relative /api/profile with credentials:include and cache:no-store in browser mode without server secrets or console leaks', async () => {
    vi.stubGlobal('window', {});
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    fetchMock.mockResolvedValueOnce(
      Response.json({
        id: 'learner-browser-1',
        email: 'browser-canary@example.invalid',
        onboardingCompleted: true,
        roles: ['student'],
      }),
    );

    const state = await fetchCurrentUserState();
    expect(state).toEqual({ onboardingCompleted: true });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/profile',
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      }),
    );
    const loggedText = JSON.stringify([...logSpy.mock.calls, ...warnSpy.mock.calls]);
    expect(loggedText).not.toContain('browser-canary@example.invalid');
    expect(loggedText).not.toContain('learner-browser-1');
  });

  it('returns onboardingCompleted: false when browser /api/profile returns 401 or 404', async () => {
    vi.stubGlobal('window', {});
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));
    expect(await fetchCurrentUserState()).toEqual({ onboardingCompleted: false });

    fetchMock.mockResolvedValueOnce(new Response(null, { status: 404 }));
    expect(await fetchCurrentUserState()).toEqual({ onboardingCompleted: false });
  });

  it('uses SSR gateway validation with cache:no-store when window is undefined and redacts user identity from console logs', async () => {
    vi.stubEnv('GATEWAY_URL', 'http://127.0.0.1:8787');
    vi.stubEnv('INTERNAL_GATEWAY_SECRET', 'test-gateway-secret');
    nextHeadersMock.headers.mockResolvedValue(new Headers({ host: 'skillup.localhost:3009' }));
    nextHeadersMock.cookies.mockResolvedValue({
      getAll: () => [{ name: 'accessToken', value: 'ssr-token' }],
    });

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    fetchMock.mockResolvedValueOnce(
      Response.json({
        user: {
          id: 'ssr-learner-1',
          email: 'ssr-canary@example.invalid',
          onboardingCompleted: true,
          roles: ['student'],
        },
      }),
    );

    const auth = await validateAuthState();
    expect(auth).toEqual({
      id: 'ssr-learner-1',
      email: 'ssr-canary@example.invalid',
      onboardingCompleted: true,
      roles: ['student'],
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8787/auth/me',
      expect.objectContaining({
        method: 'GET',
        cache: 'no-store',
        headers: expect.objectContaining({
          cookie: 'accessToken=ssr-token',
          'x-original-host': 'skillup.localhost',
          'x-internal-secret': 'test-gateway-secret',
        }),
      }),
    );
    expect(JSON.stringify(logSpy.mock.calls)).not.toContain('ssr-canary@example.invalid');
  });
});

