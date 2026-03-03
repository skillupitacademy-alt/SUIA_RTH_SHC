import { describe, it, expect, vi, beforeEach } from 'vitest';

const jwtVerifyMock = vi.fn();

vi.mock('jose', async (orig) => {
  const actual = await orig();
  return { ...actual, jwtVerify: jwtVerifyMock };
});

describe('TokenService audience guards (133,177)', () => {
  beforeEach(() => {
    jwtVerifyMock.mockReset();
  });

  it('throws audience mismatch when required audience missing', async () => {
    // verifyAccessToken may call jwtVerify twice (user then admin secret); return a payload every time.
    jwtVerifyMock.mockImplementation(async () => ({ payload: { aud: 'weird', userId: 'u', email: 'e', roles: [] } }));
    const { TokenService } = await import('../token.service');
    await expect(TokenService.verifyAccessToken('tok', { audience: 'infra' })).rejects.toThrow(/Audience mismatch/);
  });

  it('returns null on malformed refresh token (177)', async () => {
    jwtVerifyMock.mockRejectedValueOnce(new Error('Invalid Compact JWS'));
    const { TokenService } = await import('../token.service');
    await expect(TokenService.verifyRefreshToken('bad-token')).rejects.toThrow(/Invalid Compact JWS/);
  });
});
