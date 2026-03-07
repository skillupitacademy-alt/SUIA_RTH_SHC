import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  cacheIncrement: vi.fn(),
  tokenGetAccessToken: vi.fn(),
  tokenVerifyAccessToken: vi.fn(),
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
    get: vi.fn((svc: unknown) => {
      if ((svc as any).name === 'TokenService') {
        return {
          getAccessToken: h.tokenGetAccessToken,
          verifyAccessToken: h.tokenVerifyAccessToken,
        };
      }
      return undefined;
    }),
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
  } as unknown as Request);

describe('rate-limit.middleware (unit)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when under limit', async () => {
    const { rateLimit } = await import('@/modules/auth/rate-limit.middleware');
    h.cacheIncrement.mockResolvedValueOnce({ count: 1, ttlRem: 60 });

    const res = await rateLimit(makeRequest('/api/quiz/start', { 'x-forwarded-for': '10.0.0.1' }) as any);

    expect(res).toBeNull();
  });

  it('falls back to unknown when no IP headers are present', async () => {
    const { rateLimit } = await import('@/modules/auth/rate-limit.middleware');
    h.cacheIncrement.mockResolvedValueOnce({ count: 1, ttlRem: 60 });

    const res = await rateLimit(makeRequest('/api/quiz/start') as any);

    expect(res).toBeNull();
    expect(h.cacheIncrement).toHaveBeenCalledWith('ratelimit:ip:unknown', 15 * 60 * 1000);
  });

  it('returns 429 response when IP limit is exceeded', async () => {
    const { rateLimit } = await import('@/modules/auth/rate-limit.middleware');
    h.cacheIncrement.mockResolvedValueOnce({ count: 5001, ttlRem: 30 });

    const res = await rateLimit(makeRequest('/api/quiz/start', { 'x-forwarded-for': '10.0.0.2' }) as any);

    expect(res?.status).toBe(429);
    expect(res?.headers.get('Retry-After')).toBe('30');
    expect(res?.headers.get('X-RateLimit-Count')).toBe('5001');
  });

  it('returns 429 response when user limit is exceeded', async () => {
    const { rateLimit } = await import('@/modules/auth/rate-limit.middleware');
    h.tokenGetAccessToken.mockReturnValue('token');
    h.tokenVerifyAccessToken.mockResolvedValue({ userId: 'u1' });
    h.cacheIncrement
      .mockResolvedValueOnce({ count: 1, ttlRem: 60 })
      .mockResolvedValueOnce({ count: 9000, ttlRem: 45 });

    const res = await rateLimit(makeRequest('/api/quiz/start', { 'x-forwarded-for': '10.0.0.3' }) as any);

    expect(res?.status).toBe(429);
    expect(res?.headers.get('Retry-After')).toBe('45');
  });

  it('uses x-real-ip when cf-connecting-ip is missing', async () => {
    const { rateLimit } = await import('@/modules/auth/rate-limit.middleware');
    h.cacheIncrement.mockResolvedValueOnce({ count: 1, ttlRem: 60 });

    const res = await rateLimit(makeRequest('/api/quiz/start', { 'x-real-ip': '3.3.3.3' }) as any);

    expect(res).toBeNull();
    expect(h.cacheIncrement).toHaveBeenCalledWith('ratelimit:ip:3.3.3.3', 15 * 60 * 1000);
  });

  it('uses user scope and cf-connecting-ip header', async () => {
    const { rateLimit } = await import('@/modules/auth/rate-limit.middleware');
    h.cacheIncrement.mockResolvedValueOnce({ count: 1, ttlRem: 60 });

    const res = await rateLimit(makeRequest('/api/auth/login', { 'cf-connecting-ip': '2.2.2.2' }) as any);

    expect(res).toBeNull();
    expect(h.cacheIncrement).toHaveBeenCalledWith('ratelimit:ip:2.2.2.2', 15 * 60 * 1000);
    expect(h.tokenGetAccessToken).toHaveBeenCalledWith(expect.anything(), { scope: 'user' });
  });

  it('returns user rate limit exceeded when user count crosses threshold', async () => {
    const { rateLimit } = await import('@/modules/auth/rate-limit.middleware');
    h.tokenGetAccessToken.mockReturnValue('token');
    h.tokenVerifyAccessToken.mockResolvedValue({ userId: 'u2' });
    h.cacheIncrement
      .mockResolvedValueOnce({ count: 1, ttlRem: 60 })
      .mockResolvedValueOnce({ count: 9001, ttlRem: 12 });

    const res = await rateLimit(makeRequest('/api/auth/login', { 'x-forwarded-for': '10.0.0.6' }) as any);

    expect(res?.status).toBe(429);
    expect(res?.headers.get('Retry-After')).toBe('12');
  });

  it('uses admin scope and logs slow increments', async () => {
    const { rateLimit } = await import('@/modules/auth/rate-limit.middleware');
    h.cacheIncrement.mockResolvedValueOnce({ count: 1, ttlRem: 60 });
    h.tokenGetAccessToken.mockReturnValue('admintoken');
    h.tokenVerifyAccessToken.mockResolvedValue({ userId: 'admin-user' });

    const nowSpy = vi.spyOn(Date, 'now');
    nowSpy.mockReturnValueOnce(0).mockReturnValueOnce(1000);

    const res = await rateLimit(makeRequest('/api/admin/users', { 'x-forwarded-for': '10.0.0.4' }) as any);

    expect(res).toBeNull();
    const child = h.loggerChild.mock.results[0]?.value;
    expect(child.warn).toHaveBeenCalled();
    expect(h.tokenVerifyAccessToken).toHaveBeenCalledWith('admintoken');
    nowSpy.mockRestore();
  });

  it('extracts userId from verified token', async () => {
    const { rateLimit } = await import('@/modules/auth/rate-limit.middleware');
    h.cacheIncrement
      .mockResolvedValueOnce({ count: 1, ttlRem: 60 })   // ip
      .mockResolvedValueOnce({ count: 2, ttlRem: 50 });  // user
    h.tokenGetAccessToken.mockReturnValue('token');
    h.tokenVerifyAccessToken.mockResolvedValue({ userId: 'u-token' });

    const res = await rateLimit(makeRequest('/api/quiz/start', { 'x-forwarded-for': '9.9.9.9' }) as any);

    expect(res).toBeNull();
    expect(h.cacheIncrement).toHaveBeenCalledTimes(2);
    expect(h.tokenVerifyAccessToken).toHaveBeenCalledWith('token');
  });

  it('skips token lookup when scope is undefined', async () => {
    const { rateLimit } = await import('@/modules/auth/rate-limit.middleware');
    h.cacheIncrement.mockResolvedValueOnce({ count: 1, ttlRem: 60 });

    const res = await rateLimit(makeRequest('/api/unknown', { 'x-forwarded-for': '10.0.0.7' }) as any);

    expect(res).toBeNull();
    expect(h.tokenGetAccessToken).not.toHaveBeenCalled();
  });

  it('gracefully allows when limiter throws', async () => {
    const { rateLimit } = await import('@/modules/auth/rate-limit.middleware');
    h.cacheIncrement.mockRejectedValueOnce(new Error('boom'));

    const res = await rateLimit(makeRequest('/api/quiz/start', { 'x-forwarded-for': '10.0.0.5' }) as any);

    expect(res).toBeNull();
    const child = h.loggerChild.mock.results[0]?.value;
    expect(child.error).toHaveBeenCalled();
  });

  it('logs unknown error when limiter throws non-error', async () => {
    const { rateLimit } = await import('@/modules/auth/rate-limit.middleware');
    h.cacheIncrement.mockRejectedValueOnce('boom');

    const res = await rateLimit(makeRequest('/api/quiz/start', { 'x-forwarded-for': '10.0.0.8' }) as any);

    expect(res).toBeNull();
    const child = h.loggerChild.mock.results[0]?.value;
    expect(child.error).toHaveBeenCalledWith(
      { error: 'unknown error' },
      'Rate limit processing failed',
    );
  });
});
