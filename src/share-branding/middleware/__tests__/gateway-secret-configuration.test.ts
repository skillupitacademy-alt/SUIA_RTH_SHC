import { NextRequest } from 'next/server';
import { afterEach, expect, it, vi } from 'vitest';
const verify = vi.hoisted(() => vi.fn());
vi.mock('@quiz/auth', () => ({ TokenService: { verifyUserAccessToken: verify } }));
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); vi.resetModules(); });
async function proxyWithSecret(secret: string) {
  vi.resetModules(); vi.stubEnv('INTERNAL_GATEWAY_SECRET', secret);
  const module = await import('../authProxy');
  return module.createAuthProxy();
}
const request = (secret?: string) => new NextRequest('https://user.skillupitacademy.com/api/private-fixture', { headers: { host: 'user.skillupitacademy.com', cookie: 'accessToken=fixture', ...(secret ? { 'x-gateway-secret': secret } : {}) } });
const principal = { userId: 'local', originalUserId: 'local', shadowUserId: 'shadow', brand: 'skillup', roles: ['student'] };
it('accepts a configured matching gateway credential for an authenticated user', async () => {
  vi.spyOn(console, 'log').mockImplementation(() => undefined); verify.mockResolvedValue(principal);
  const proxy = await proxyWithSecret('fixture-secret');
  expect((await proxy(request('fixture-secret'))).status).toBe(200);
});
it('does not treat absent gateway configuration as valid', async () => {
  vi.spyOn(console, 'log').mockImplementation(() => undefined); verify.mockResolvedValue(principal);
  const proxy = await proxyWithSecret('');
  expect((await proxy(request())).status).toBe(403);
});
