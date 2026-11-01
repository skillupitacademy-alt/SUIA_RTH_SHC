import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const mocks = vi.hoisted(() => ({ upstream: vi.fn(), authenticate: vi.fn() }));
vi.mock('@/share-branding/auth', () => ({
  proxyUpstreamRequest: mocks.upstream, FALLBACK_API_BASE_SKILLHUBCORE: 'fixed-fallback',
}));
vi.mock('../auth-helpers', () => ({
  authenticateRequest: mocks.authenticate,
  requireAdminRole: (user: { roles: string[] }) => user.roles.includes('admin') ? null : { type: 'FORBIDDEN' },
  createAuthErrorResponse: () => NextResponse.json({ error: 'unauthorized' }, { status: 401 }),
}));
import { proxyUpstreamRequest } from '../upstream-proxy';

const user = { userId: 'verified-id', originalUserId: 'original-id', shadowUserId: 'shadow-id', roles: ['admin'], email: 'verified@example.test' };
function request(method = 'GET') {
  return new NextRequest('https://attacker.example/api/admin/questions?limit=2', {
    method,
    headers: {
      host: 'attacker.example', cookie: 'accessToken=verified-token; admin_accessToken=different-token; unrelated=secret',
      authorization: 'Bearer forged', 'x-user-id': 'forged', 'x-user-roles': 'super_admin',
      'x-brand': 'skillup', 'x-internal-secret': 'forged', 'x-gateway-secret': 'forged',
      'x-forwarded-host': 'attacker.example', 'x-forwarded-proto': 'http',
      'content-type': 'application/json',
    },
    ...(method === 'POST' ? { body: '{"hello":"world"}' } : {}),
  });
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.authenticate.mockResolvedValue({ user });
  mocks.upstream.mockResolvedValue(NextResponse.json({ ok: true }));
});
describe('SHC upstream trust boundary', () => {
  it('replaces caller identity and destination context with the verified SHC principal', async () => {
    await proxyUpstreamRequest(request(), { fallbackApiBase: 'fixed-fallback', upstreamPath: 'api/admin/questions' });
    const [forwarded, options] = mocks.upstream.mock.calls[0];
    expect(forwarded.url).toBe('https://admin.skillhubcore.in/api/admin/questions?limit=2');
    expect(options.upstreamPath).toBe('api/admin/questions');
    expect(forwarded.headers.get('host')).toBe('admin.skillhubcore.in');
    expect(forwarded.headers.get('x-brand')).toBe('skillhubcore');
    expect(forwarded.headers.get('x-user-id')).toBe(user.userId);
    expect(forwarded.headers.get('x-user-roles')).toBe('admin');
    expect(forwarded.headers.get('authorization')).toBe('Bearer verified-token');
    expect(forwarded.headers.get('cookie')).toBe('accessToken=verified-token; admin_accessToken=verified-token');
    for (const header of ['x-internal-secret', 'x-gateway-secret', 'x-forwarded-host']) {
      expect(forwarded.headers.has(header)).toBe(false);
    }
  });
  it('rejects an unauthenticated private proxy call before forwarding', async () => {
    mocks.authenticate.mockResolvedValue({ type: 'INVALID_TOKEN' });
    expect((await proxyUpstreamRequest(request(), { fallbackApiBase: 'fixed', upstreamPath: 'api/admin/questions' })).status).toBe(401);
    expect(mocks.upstream).not.toHaveBeenCalled();
  });
  it.each(['login', 'logout'])('keeps public %s usable without trusting stale cookies', async action => {
    mocks.authenticate.mockResolvedValue({ type: 'INVALID_TOKEN' });
    await proxyUpstreamRequest(request('POST'), { fallbackApiBase: 'fixed', upstreamPath: `api/shc/auth/${action}` });
    const [forwarded, options] = mocks.upstream.mock.calls[0];
    for (const name of ['cookie', 'authorization', 'x-user-id', 'x-user-roles', 'x-internal-secret']) {
      expect(forwarded.headers.has(name)).toBe(false);
    }
    expect(new TextDecoder().decode(options.body)).toBe('{"hello":"world"}');
    if (action === 'login') expect(mocks.authenticate).not.toHaveBeenCalled();
  });
  it('preserves explicit server method/body options', async () => {
    await proxyUpstreamRequest(request(), { fallbackApiBase: 'fixed', upstreamPath: 'api/admin/questions', method: 'POST', body: 'server-body' });
    const [forwarded, options] = mocks.upstream.mock.calls[0];
    expect(forwarded.method).toBe('POST');
    expect(options.body).toBe('server-body');
  });
});
