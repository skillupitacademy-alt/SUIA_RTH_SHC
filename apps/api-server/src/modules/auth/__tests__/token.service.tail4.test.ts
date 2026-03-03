import { describe, it, expect, vi, beforeEach } from 'vitest';

const jwtVerifyMock = vi.fn();

vi.mock('jose', async (orig) => {
  const actual = await orig();
  return { ...actual, jwtVerify: jwtVerifyMock };
});

describe('TokenService tail guards (audience/refresh)', () => {
  beforeEach(() => jwtVerifyMock.mockReset());

  it('throws when infra audience required but token aud is user (line 133 path)', async () => {
    jwtVerifyMock.mockResolvedValue({ payload: { aud: 'user', userId: 'u', email: 'e', roles: [] } });
    const { TokenService } = await import('../token.service');
    await expect(TokenService.verifyAccessToken('tok', { audience: 'infra' })).rejects.toThrow(/Audience mismatch/);
  });
});

