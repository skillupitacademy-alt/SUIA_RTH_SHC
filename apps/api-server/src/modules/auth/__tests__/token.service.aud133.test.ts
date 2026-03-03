import { describe, it, expect, vi } from 'vitest';

const jwtVerifyMock = vi.fn();

vi.mock('jose', async (orig) => {
  const actual = await orig();
  return { ...actual, jwtVerify: jwtVerifyMock };
});

describe('TokenService enforce audience (line 133)', () => {
  it('throws mismatch when required audience not present', async () => {
    jwtVerifyMock.mockResolvedValue({ payload: { aud: 'user', userId: 'u', email: 'e' } });
    const { TokenService } = await import('../token.service');
    await expect(TokenService.verifyAccessToken('tok', { audience: 'infra' })).rejects.toThrow(/Audience mismatch/);
  });
});
