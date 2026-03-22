import { SignJWT } from 'jose';
import { describe, expect, it } from 'vitest';

import { TokenExpiredError, TokenInvalidError, TokenService } from '../token.service';

describe('TokenService', () => {
  it('signs and verifies access tokens', async () => {
    const service = new TokenService(new TextEncoder().encode('access-secret-1234567890'), new TextEncoder().encode('refresh-secret-1234567890'));
    const token = await service.signAccessToken('user-1', ['student'], ['notes'], ['realtutorialhub']);
    const payload = await service.verifyAccessToken(token);

    expect(payload.sub).toBe('user-1');
    expect(payload.roles).toEqual(['student']);
    expect(payload.subscriptions).toEqual(['notes']);
  });

  it('signs and verifies refresh tokens', async () => {
    const service = new TokenService(new TextEncoder().encode('access-secret-1234567890'), new TextEncoder().encode('refresh-secret-1234567890'));
    const token = await service.signRefreshToken('user-1', 'family-1');
    const payload = await service.verifyRefreshToken(token);

    expect(payload.sub).toBe('user-1');
    expect(payload.family).toBe('family-1');
  });

  it('throws when token is expired', async () => {
    const service = new TokenService(new TextEncoder().encode('access-secret-1234567890'), new TextEncoder().encode('refresh-secret-1234567890'));
    const expiredToken = await new SignJWT({
      sub: 'user-1',
      roles: ['student'],
      subscriptions: ['notes'],
      platforms: ['realtutorialhub'],
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuer('skillhubcore.in')
      .setIssuedAt()
      .setExpirationTime('-1s')
      .sign(new TextEncoder().encode('access-secret-1234567890'));

    await expect(service.verifyAccessToken(expiredToken)).rejects.toBeInstanceOf(TokenExpiredError);
  });

  it('rejects tokens signed with the wrong secret', async () => {
    const serviceA = new TokenService(new TextEncoder().encode('access-secret-1234567890'), new TextEncoder().encode('refresh-secret-1234567890'));
    const serviceB = new TokenService(new TextEncoder().encode('other-access-secret-12345'), new TextEncoder().encode('other-refresh-secret-12345'));

    const token = await serviceA.signAccessToken('user-1', ['student'], ['notes']);
    await expect(serviceB.verifyAccessToken(token)).rejects.toBeInstanceOf(TokenInvalidError);
  });
});
