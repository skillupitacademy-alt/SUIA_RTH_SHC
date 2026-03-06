import { afterEach, describe, expect, it, vi } from 'vitest';

describe('TokenService remaining branch tails', () => {
  const oldEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...oldEnv };
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('uses JWT_SECRET fallback for ADMIN_SECRET when admin secret is absent', async () => {
    process.env.JWT_SECRET = 'jwt-fallback-secret';
    delete process.env.ADMIN_JWT_SECRET;

    const { TokenService } = await import('../token.service');
    const secret = new TextDecoder().decode(TokenService.ADMIN_SECRET);
    expect(secret).toBe('jwt-fallback-secret');
  });

  it('falls back to Authorization header when scoped cookie is empty', async () => {
    const { TokenService } = await import('../token.service');
    const service = new TokenService();

    const req = {
      cookies: {
        get: vi.fn((name: string) => {
          if (name === 'admin_accessToken' || name === 'accessToken' || name === 'infra_accessToken') {
            return { value: '' };
          }
          return undefined;
        }),
      },
      headers: {
        get: vi.fn(() => 'Bearer header-token'),
      },
    } as any;

    expect(service.getAccessToken(req, { scope: 'admin' })).toBe('header-token');
    expect(service.getAccessToken(req, { scope: 'user' })).toBe('header-token');
    expect(service.getAccessToken(req, { scope: 'infrastructure' })).toBe('header-token');
    expect(service.getAccessToken(req)).toBe('header-token');
  });

  it('throws audience violation for admin scope with unexpected aud', async () => {
    const { TokenService } = await import('../token.service');
    const service = new TokenService();

    const token = await service.generateAccessToken({
      userId: 'u1',
      email: 'u@example.com',
      roles: ['ADMIN'],
      isAdmin: true,
      aud: 'other',
    });

    await expect(service.verifyAccessToken(token, { isAdmin: true })).rejects.toThrow('Audience violation');
  });

  it('accepts required audience when token audience is a matching array', async () => {
    const { SignJWT } = await import('jose');
    const { TokenService } = await import('../token.service');
    const service = new TokenService();

    const token = await new SignJWT({
      userId: 'u2',
      email: 'u2@example.com',
      roles: ['ADMIN'],
      isAdmin: true,
    } as any)
      .setProtectedHeader({ alg: 'HS256' })
      .setAudience(['admin', 'infra'])
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign((TokenService as any).ADMIN_SECRET);

    await expect(service.verifyAccessToken(token, { audience: 'admin', isAdmin: true })).resolves.toMatchObject({
      userId: 'u2',
    });
  });

  it('returns undefined when no scoped cookie and empty authorization header', async () => {
    const { TokenService } = await import('../token.service');
    const service = new TokenService();

    const req = {
      cookies: { get: vi.fn(() => undefined) },
      headers: { get: vi.fn(() => '') },
    } as any;

    expect(service.getAccessToken(req)).toBeUndefined();
  });

});
