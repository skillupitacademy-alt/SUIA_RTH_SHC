import { describe, it, expect, vi, beforeEach } from 'vitest';

const jwtVerifyMock = vi.fn();

vi.mock('jose', async (orig) => {
  const actual = await orig();
  return { ...actual, jwtVerify: jwtVerifyMock };
});

describe('TokenService audience guard (line 133)', () => {
  beforeEach(() => jwtVerifyMock.mockReset());

  it('throws infra guard error when audience missing and required', async () => {
    jwtVerifyMock.mockResolvedValue({ payload: { userId: 'u', email: 'e', roles: [] } });
    const { TokenService } = await import('../token.service');
    await expect(TokenService.verifyAccessToken('tok', { audience: 'infra' })).rejects.toThrow(/Audience mismatch/);
  });
});
