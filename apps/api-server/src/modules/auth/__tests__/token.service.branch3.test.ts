import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  jwtVerify: vi.fn(),
  decodeJwt: vi.fn(),
}));

vi.mock('jose', () => ({
  SignJWT: class {},
  jwtVerify: (...args: any[]) => mocks.jwtVerify(...args),
  decodeJwt: (...args: any[]) => mocks.decodeJwt(...args),
}));

describe('TokenService remaining branches', () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.jwtVerify.mockReset();
    mocks.decodeJwt.mockReset();
    process.env.JWT_SECRET = 'secret';
    process.env.JWT_REFRESH_SECRET = 'secret2';
    process.env.ADMIN_JWT_SECRET = 'secret3';
  });

  it('admin audience violation branch (line 97 path)', async () => {
    mocks.jwtVerify.mockResolvedValue({ payload: { aud: 'weird', userId: 'u', email: 'e', roles: [] } });
    const { TokenService } = await import('../token.service');
    await expect(TokenService.verifyAccessToken('tok', true)).rejects.toThrow(/Audience violation/);
  });

  it('infra guard branch (line 133 path)', async () => {
    mocks.jwtVerify.mockResolvedValue({ payload: { aud: 'admin', userId: 'u', email: 'e', roles: [] } });
    const { TokenService } = await import('../token.service');
    await expect(TokenService.verifyAccessToken('tok', { audience: 'infra' })).rejects.toThrow(/expected infra/);
  });

  it('getExpiration returns null on bad token (line 177 path)', async () => {
    mocks.decodeJwt.mockImplementation(() => {
      throw new Error('bad');
    });
    const { TokenService } = await import('../token.service');
    expect(TokenService.getExpiration('bad')).toBeNull();
  });
});
