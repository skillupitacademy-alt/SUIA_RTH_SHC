import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const verify = vi.hoisted(() => vi.fn());
vi.mock('@quiz/auth', () => ({ TokenService: { verifyUserAccessToken: verify } }));
vi.mock('../../auth/currentLearnerSession', () => ({ requireCurrentLearnerSession: vi.fn().mockResolvedValue(null) }));

beforeEach(() => {
  verify.mockResolvedValue({ userId: 'local', originalUserId: 'local', shadowUserId: 'local', brand: 'skillup', roles: ['student'] });
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); vi.resetModules(); });

describe('learner browser mutation boundary', () => {
  async function proxy() {
    vi.resetModules();
    vi.stubEnv('INTERNAL_GATEWAY_SECRET', 'configured-gateway-secret');
    return (await import('../authProxy')).createAuthProxy();
  }
  function request(origin?: string, path = '/api/tutorial/progress', extra: Record<string, string> = {}) {
    return new NextRequest(`http://skillup.localhost:3009${path}`, {
      method: 'POST', headers: {
        host: 'skillup.localhost:3009', cookie: 'accessToken=fixture',
        ...(origin ? { origin } : {}), ...extra,
      }, body: '{}',
    });
  }
  it.each(['http://evil.example', 'http://skillup.localhost.evil.example:3009', 'null'])('rejects cross-origin %s', async origin => {
    const handler = await proxy();
    expect((await handler(request(origin))).status).toBe(403);
  });
  it('rejects missing browser origin/referrer despite a Bearer header', async () => {
    const handler = await proxy();
    expect((await handler(request(undefined, undefined, { authorization: 'Bearer forged' }))).status).toBe(403);
  });
  it('allows exact same-origin browser requests', async () => {
    const handler = await proxy();
    expect((await handler(request('http://skillup.localhost:3009'))).status).toBe(200);
  });
  it('allows an exact same-origin referrer when Origin is absent', async () => {
    const handler = await proxy();
    expect((await handler(request(undefined, undefined, { referer: 'http://skillup.localhost:3009/learn' }))).status).toBe(200);
  });
  it('uses the actual brand Host when Next normalizes the internal URL to localhost', async () => {
    const handler = await proxy();
    const response = await handler(new NextRequest('http://localhost:3009/api/tutorial/progress', {
      method: 'POST', headers: { host: 'skillup.localhost:3009', origin: 'http://skillup.localhost:3009', cookie: 'accessToken=fixture' },
      body: '{}',
    }));
    expect(response.status).toBe(200);
  });
  it('does not use a forged forwarded host to approve a foreign origin', async () => {
    const handler = await proxy();
    expect((await handler(request('https://evil.example', undefined, { 'x-forwarded-host': 'evil.example' }))).status).toBe(403);
  });
  it('preserves configured gateway authentication for server-originless requests', async () => {
    const handler = await proxy();
    expect((await handler(request(undefined, undefined, { 'x-gateway-secret': 'configured-gateway-secret' }))).status).toBe(200);
  });
  it('rejects login CSRF before the public auth-route shortcut', async () => {
    const handler = await proxy();
    expect((await handler(request('http://evil.example', '/api/auth/login'))).status).toBe(403);
  });
  it('allows signed-worker requests to reach their handler guard without learner cookies', async () => {
    const handler = await proxy();
    const response = await handler(new NextRequest('http://realtutorialhub.localhost:3003/api/workers/notify-session-requested', {
      method: 'POST', body: '{}',
    }));
    expect(response.status).toBe(200);
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });
});
