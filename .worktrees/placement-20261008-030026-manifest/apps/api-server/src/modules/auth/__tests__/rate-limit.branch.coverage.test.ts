import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Covers branches in rate-limit.middleware.ts lines 51-54:
 * When the resolved verifyFn is undefined (tokenService has no verify methods).
 */
const h = vi.hoisted(() => ({
  cacheIncrement: vi.fn(),
  tokenGetAccessToken: vi.fn(),
  loggerChild: vi.fn(() => ({ warn: vi.fn(), error: vi.fn() })),
}));

vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((body: unknown, init?: ResponseInit) => new Response(JSON.stringify(body), init)),
  },
}));

vi.mock('@/modules/core/cache.service', () => ({
  cacheService: {
    increment: h.cacheIncrement,
  },
}));

vi.mock('@/modules/core/container', () => ({
  container: {
    get: vi.fn(() => ({
      // Return a token service that has getAccessToken but NO verify methods at all
      getAccessToken: h.tokenGetAccessToken,
      // deliberately omit verifyAccessToken, verifyUserAccessToken, verifyAdminAccessToken
    })),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    child: h.loggerChild,
  },
}));

const makeRequest = (path: string, headers?: Record<string, string>) =>
  ({
    headers: new Headers(headers ?? {}),
    nextUrl: new URL(`https://example.com${path}`),
    method: 'POST',
    cookies: { get: () => undefined },
  } as unknown as Request);

describe('rate-limit branch: undefined verifyFn (L51-54)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('skips user-based limiting when verifyFn resolves to undefined', async () => {
    const { rateLimit } = await import('@/modules/auth/rate-limit.middleware');
    h.tokenGetAccessToken.mockReturnValue('some-token');
    h.cacheIncrement.mockResolvedValue({ count: 1, ttlRem: 60 });

    const res = await rateLimit(makeRequest('/api/quiz/start', { 'x-forwarded-for': '99.1.1.1' }) as any);

    // Should NOT throw and should return null (allowed through)
    expect(res).toBeNull();
    // Should only have 1 increment call (IP-based), not 2 (no user key increment)
    expect(h.cacheIncrement).toHaveBeenCalledTimes(1);
  });

  it('handles userId being null from payload when verifyFn returns payload without userId', async () => {
    // Re-mock container to provide a verify function that returns no userId
    vi.doMock('@/modules/core/container', () => ({
      container: {
        get: vi.fn(() => ({
          getAccessToken: h.tokenGetAccessToken,
          verifyAccessToken: vi.fn().mockResolvedValue({}), // payload with no userId
        })),
      },
    }));

    vi.resetModules();
    const { rateLimit } = await import('@/modules/auth/rate-limit.middleware');
    h.tokenGetAccessToken.mockReturnValue('some-token');
    h.cacheIncrement.mockResolvedValue({ count: 1, ttlRem: 60 });

    const res = await rateLimit(makeRequest('/api/admin/something', { 'x-forwarded-for': '99.2.2.2' }) as any);

    expect(res).toBeNull();
  });
});
