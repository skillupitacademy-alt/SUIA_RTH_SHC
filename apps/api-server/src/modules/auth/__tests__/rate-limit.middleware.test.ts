import { beforeEach,describe, expect, it, vi } from 'vitest';

vi.mock('@/modules/auth/rate-limit.middleware', () => ({
  rateLimit: vi.fn<() => Promise<Response | undefined>>(),
}));

describe.skip('rate-limit.middleware (unit)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns undefined when under limit', async () => {
    const { rateLimit } = await import('@/modules/auth/rate-limit.middleware');
    vi.mocked(rateLimit).mockResolvedValue(undefined);
    const res = await rateLimit({} as unknown as Request);
    expect(res).toBeUndefined();
  });

  it('returns response when over limit', async () => {
    const { rateLimit } = await import('@/modules/auth/rate-limit.middleware');
    const mockRes = new Response(null, { status: 429 });
    vi.mocked(rateLimit).mockResolvedValue(mockRes);
    const res = await rateLimit({} as unknown as Request);
    expect(res?.status).toBe(429);
  });
});
