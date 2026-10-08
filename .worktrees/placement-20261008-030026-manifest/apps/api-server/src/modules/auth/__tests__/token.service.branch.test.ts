import { describe, it, expect, vi } from 'vitest';
import { SignJWT } from 'jose';

const loadService = async () => {
  vi.resetModules();
  process.env.JWT_SECRET = 'secret-key';
  process.env.JWT_REFRESH_SECRET = 'refresh-secret-key';
  process.env.ADMIN_JWT_SECRET = 'admin-secret-key';
  const mod = await import('../token.service');
  return new mod.TokenService();
};

describe('TokenService branch coverage', () => {
  it('falls back from user secret to admin secret when isAdmin not specified', async () => {
    const tokenService = await loadService();
    const adminSigned = await new SignJWT({
      userId: 'u1',
      originalUserId: 'u1',
      shadowUserId: 'shadow-u1',
      email: 'a@b.com',
      roles: [],
      isAdmin: true,
      tokenType: 'admin',
      aud: 'admin',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(new TextEncoder().encode(process.env.ADMIN_JWT_SECRET!));

    const payload = await tokenService.verifyAccessToken(adminSigned);
    expect(payload.isAdmin).toBe(true);
  });

  it('rejects admin scope when audience is unexpected', async () => {
    const tokenService = await loadService();
    const badAud = await new SignJWT({
      userId: 'u1',
      originalUserId: 'u1',
      shadowUserId: 'shadow-u1',
      email: 'x@y.com',
      roles: [],
      isAdmin: true,
      tokenType: 'admin',
      aud: 'weird',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(new TextEncoder().encode(process.env.ADMIN_JWT_SECRET!));

    await expect(tokenService.verifyAdminAccessToken(badAud)).rejects.toThrow(/unexpected aud/i);
  });

  it('enforces audience when provided explicitly', async () => {
    const tokenService = await loadService();
    const token = await tokenService.generateAccessToken(
      { userId: 'u1', originalUserId: 'u1', shadowUserId: 'shadow-u1', email: 'u@u.com', roles: [], aud: 'admin', tokenType: 'user' } as any,
      '5m'
    );

    await expect(tokenService.verifyUserAccessToken(token)).rejects.toThrow();
  });

  it('accepts a normal user token when no audience is enforced (legacy default)', async () => {
    const tokenService = await loadService();
    const token = await tokenService.generateAccessToken(
      { userId: 'u1', originalUserId: 'u1', shadowUserId: 'shadow-u1', email: 'u@u.com', roles: [], aud: 'user', tokenType: 'user' } as any,
      '5m'
    );
    await expect(tokenService.verifyAccessToken(token)).resolves.toMatchObject({ aud: 'user' });
  });

  it('verifies refresh token happy path and derives expiration helpers', async () => {
    const tokenService = await loadService();
    const refresh = await tokenService.generateRefreshToken('u123', false, 'user');
    const payload = await tokenService.verifyUserRefreshToken(refresh);
    expect(payload.userId).toBe('u123');

    const expIso = tokenService.getExpiration(refresh);
    expect(expIso).toMatch(/T/);

    // bad token -> null
    expect(tokenService.getExpiration('not-a-token')).toBeNull();
  });

  it('falls back to Authorization header when no cookies exist', async () => {
    const tokenService = await loadService();
    const req: any = {
      cookies: { get: () => undefined },
      headers: { get: () => 'Bearer hdr-token' },
    };
    expect(tokenService.getAccessToken(req as any)).toBe('hdr-token');
  });
});
