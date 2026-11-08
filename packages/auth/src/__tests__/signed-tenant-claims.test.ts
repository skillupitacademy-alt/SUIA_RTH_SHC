import { expect, it } from 'vitest';
import { TokenService } from '../token.service';
const secret = new TextEncoder().encode('disposable-identity-test-secret-32-bytes');
it('retains independent brand and shadow claims for matching local subjects', async () => {
  const service = new TokenService(secret, secret, secret);
  const common = { userId: 'local-1', originalUserId: 'local-1', email: 'same@example.test', roles: ['student'], tokenType: 'user' as const, aud: 'user' };
  const su = await service.generateAccessToken({ ...common, brand: 'skillup', shadowUserId: 'shadow-su' });
  const rth = await service.generateAccessToken({ ...common, brand: 'realtutorialhub', shadowUserId: 'shadow-rth' });
  expect(await service.verifyUserAccessToken(su)).toMatchObject({ brand: 'skillup', originalUserId: 'local-1', shadowUserId: 'shadow-su' });
  expect(await service.verifyUserAccessToken(rth)).toMatchObject({ brand: 'realtutorialhub', originalUserId: 'local-1', shadowUserId: 'shadow-rth' });
  await expect(service.verifyAccessToken(su, { audience: 'admin' })).rejects.toThrow();
});
