import { SignJWT } from 'jose';
import { describe, expect, it } from 'vitest';
import { TokenExpiredError, TokenInvalidError, TokenService } from '@quiz/auth';

describe('TokenService', () => {
  it('signs and verifies access tokens', async () => {
    const service = new TokenService();
    const token = await service.signSkillHubCoreAccessToken('user-1', ['student'], ['notes'], ['realtutorialhub'], {
      originalUserId: 'brand-user-1',
      shadowUserId: 'shadow-user-1',
      brand: 'realtutorialhub',
    });
    const payload = await service.verifySkillHubCoreJWT(token);

    expect(payload.sub).toBe('shadow-user-1');
    expect(payload.shadowUserId).toBe('shadow-user-1');
    expect(payload.originalUserId).toBe('brand-user-1');
    expect(payload.brand).toBe('realtutorialhub');
    expect(payload.roles).toEqual(['student']);
    expect(payload.subscriptions).toEqual(['notes']);
  });

  it('signs and verifies refresh tokens', async () => {
    const service = new TokenService();
    const token = await service.signSkillHubCoreRefreshToken('user-1', 'family-1');
    const payload = await service.verifySkillHubCoreRefreshToken(token);

    expect(payload.sub).toBe('user-1');
    expect(payload.family).toBe('family-1');
  });

  it('throws when token is expired', async () => {
    const service = new TokenService();
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
      .sign(TokenService.ACCESS_SECRET);

    await expect(service.verifySkillHubCoreJWT(expiredToken)).rejects.toBeInstanceOf(TokenExpiredError);
  });

  it('rejects tokens signed with the wrong secret', async () => {
    const serviceA = new TokenService();

    const token = await serviceA.signSkillHubCoreAccessToken('user-1', ['student'], ['notes']);
    const tamperedToken = await new SignJWT({
      sub: 'user-1',
      roles: ['student'],
      subscriptions: ['notes'],
      platforms: ['realtutorialhub'],
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuer('skillhubcore.in')
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(new TextEncoder().encode('other-access-secret-12345'));

    await expect(serviceA.verifySkillHubCoreJWT(tamperedToken)).rejects.toBeInstanceOf(TokenInvalidError);
    await expect(serviceA.verifySkillHubCoreJWT(token)).resolves.toMatchObject({ shadowUserId: 'user-1' });
  });
});
