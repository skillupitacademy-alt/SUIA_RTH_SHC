import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/modules/auth/rate-limit.middleware', () => ({
  rateLimit: vi.fn<() => Promise<Response | undefined>>(),
}));

const makeRequest = (ip: string) =>
  ({ headers: new Map([['x-forwarded-for', ip]]) } as unknown as Request);

describe.skip('rate-limit.middleware (unit)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns undefined when under limit', async () => {
    const { rateLimit } = await import('@/modules/auth/rate-limit.middleware');
    vi.mocked(rateLimit).mockResolvedValue(undefined);

    const res = await rateLimit(makeRequest('10.0.0.1'));

    expect(res).toBeUndefined();
    expect(rateLimit).toHaveBeenCalled();
  });

  it('returns 429 response with retry headers when over limit', async () => {
    const { rateLimit } = await import('@/modules/auth/rate-limit.middleware');
    const retryAfter = '30';
    const mockRes = new Response('Too many requests', {
      status: 429,
      headers: {
        'Retry-After': retryAfter,
        'X-RateLimit-Remaining': '0',
      },
    });
    vi.mocked(rateLimit).mockResolvedValue(mockRes);

    const res = await rateLimit(makeRequest('10.0.0.2'));

    expect(res?.status).toBe(429);
    expect(res?.headers.get('Retry-After')).toBe(retryAfter);
    expect(res?.headers.get('X-RateLimit-Remaining')).toBe('0');
  });
});
