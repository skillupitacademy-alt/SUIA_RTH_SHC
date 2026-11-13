import { NextRequest } from 'next/server';
import { afterEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ verify: vi.fn(), session: vi.fn() }));
vi.mock('@quiz/auth', () => ({ TokenService: { verifyUserAccessToken: state.verify } }));
vi.mock('../../auth/currentLearnerSession', () => ({ requireCurrentLearnerSession: state.session }));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
  vi.clearAllMocks();
});
const id = '11111111-1111-4111-8111-111111111111';
async function invoke(method: string, {
  anonymous = false,
  deniedSession = false,
  path = `/api/tutorial/sessions/${id}`,
  origin = 'http://realtutorialhub.localhost:3003',
} = {}) {
  vi.resetModules();
  vi.stubEnv('INTERNAL_GATEWAY_SECRET', 'configured-secret');
  state.verify.mockResolvedValue({
    userId: 'a', originalUserId: 'a', shadowUserId: 'shadow-a',
    brand: 'realtutorialhub', roles: ['student'],
  });
  state.session.mockResolvedValue(deniedSession ? new Response(null, { status: 401 }) : null);
  const { createAuthProxy } = await import('../authProxy');
  const headers: Record<string, string> = { host: 'realtutorialhub.localhost:3003', origin };
  if (!anonymous) headers.cookie = 'accessToken=fixture; refreshToken=device-fixture';
  return (await createAuthProxy())(new NextRequest(
    `http://realtutorialhub.localhost:3003${path}`, { method, headers },
  ));
}
it('lets an active learner reach the existing owner-checked cancellation handler', async () => {
  expect((await invoke('DELETE')).status).toBe(200);
  expect(state.session).toHaveBeenCalledOnce();
});
it('denies anonymous cancellation', async () => {
  expect((await invoke('DELETE', { anonymous: true })).status).toBe(401);
});
it('denies a revoked device before the cancellation handler', async () => {
  expect((await invoke('DELETE', { deniedSession: true })).status).toBe(401);
});
it('denies hostile-origin cancellation', async () => {
  expect((await invoke('DELETE', { origin: 'https://evil.example' })).status).toBe(403);
});
it.each(['GET', 'POST', 'PATCH', 'PUT', 'HEAD'])('does not expose %s through this browser exception', async method => {
  expect((await invoke(method)).status).toBe(403);
});
it('does not expose malformed or extra path segments', async () => {
  expect((await invoke('DELETE', { path: `/api/tutorial/sessions/${id}/extra` })).status).toBe(403);
});
