import { describe, it, expect, vi } from 'vitest';
import { SignJWT } from 'jose';

const loadService = async () => {
  vi.resetModules();
  process.env.JWT_SECRET = 'secret-key';
  process.env.JWT_REFRESH_SECRET = 'refresh-secret-key';
  process.env.ADMIN_JWT_SECRET = 'admin-secret-key';
  const mod = await import('../token.service');
  return mod.TokenService;
};

describe('TokenService branch coverage', () => {
  it('falls back from user secret to admin secret when isAdmin not specified', async () => {
    const TokenService = await loadService();
    const adminSigned = await new SignJWT({ userId: 'u1', email: 'a@b.com', roles: [], isAdmin: true, aud: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(new TextEncoder().encode(process.env.ADMIN_JWT_SECRET!));

    const payload = await TokenService.verifyAccessToken(adminSigned);
    expect(payload.isAdmin).toBe(true);
  });

  it('rejects admin scope when audience is unexpected', async () => {
    const TokenService = await loadService();
    const badAud = await new SignJWT({ userId: 'u1', email: 'x@y.com', roles: [], isAdmin: true, aud: 'weird' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(new TextEncoder().encode(process.env.ADMIN_JWT_SECRET!));

    await expect(TokenService.verifyAccessToken(badAud, { isAdmin: true })).rejects.toThrow(/unexpected aud/i);
  });

  it('enforces audience when provided explicitly', async () => {
    const TokenService = await loadService();
    const token = await TokenService.generateAccessToken(
      { userId: 'u1', email: 'u@u.com', roles: [], aud: 'admin' } as any,
      '5m'
    );

    await expect(TokenService.verifyAccessToken(token, { audience: 'user' })).rejects.toThrow();
  });

  it('accepts a normal user token when no audience is enforced (legacy default)', async () => {
    const TokenService = await loadService();
    const token = await TokenService.generateAccessToken(
      { userId: 'u1', email: 'u@u.com', roles: [], aud: 'user' } as any,
      '5m'
    );
    await expect(TokenService.verifyAccessToken(token)).resolves.toMatchObject({ aud: 'user' });
  });

  it('verifies refresh token happy path and derives expiration helpers', async () => {
    const TokenService = await loadService();
    const refresh = await TokenService.generateRefreshToken('u123', false, 'user');
    const payload = await TokenService.verifyRefreshToken(refresh, { isAdmin: false, audience: 'user' });
    expect(payload.userId).toBe('u123');

    const expIso = TokenService.getExpiration(refresh);
    expect(expIso).toMatch(/T/);

    // bad token -> null
    expect(TokenService.getExpiration('not-a-token')).toBeNull();
  });

  it('falls back to Authorization header when no cookies exist', async () => {
    const TokenService = await loadService();
    const req: any = {
      cookies: { get: () => undefined },
      headers: { get: () => 'Bearer hdr-token' },
    };
    expect(TokenService.getAccessToken(req as any)).toBe('hdr-token');
  });
});
