import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { requireCurrentLearnerSession } from '../../../../../src/share-branding/auth/currentLearnerSession';

const fetchMock = vi.fn<typeof fetch>();
const principal = { originalUserId: 'learner-a', roles: ['student'] };
const request = () => new NextRequest('http://skillup.localhost:3009/api/profile', {
  headers: { host: 'skillup.localhost:3009', cookie: 'accessToken=signed-access; refreshToken=issued-session',
    'x-original-host': 'evil.example', 'x-user-id': 'forged', 'x-internal-secret': 'forged' },
});
beforeEach(() => {
  vi.stubEnv('GATEWAY_URL', 'http://127.0.0.1:8787');
  vi.stubEnv('INTERNAL_GATEWAY_SECRET', 'server-only-fixture');
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.resetAllMocks(); });

describe('current learner session admission', () => {
  it('uses the existing gateway identity route and actual Host with private cookies', async () => {
    fetchMock.mockResolvedValue(Response.json({ data: { user: { id: 'learner-a', roles: ['student'] } } }));
    expect(await requireCurrentLearnerSession(request(), principal)).toBeNull();
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('http://127.0.0.1:8787/api/auth/me');
    expect(options?.cache).toBe('no-store');
    expect(options?.headers).toEqual({ accept: 'application/json', cookie: 'accessToken=signed-access; refreshToken=issued-session',
      'x-original-host': 'skillup.localhost', 'x-internal-secret': 'server-only-fixture' });
  });
  it.each([[401,401],[404,401],[403,403],[500,503],[503,503]])('maps upstream %i to HTTP %i', async (upstream, expected) => {
    fetchMock.mockResolvedValue(new Response(null, {status:upstream}));
    const response = await requireCurrentLearnerSession(request(), principal);
    expect(response?.status).toBe(expected);
    expect(response?.headers.get('cache-control')).toBe('private, no-store');
  });
  it.each([
    { id:'other-user', roles:['student'] },
    { id:'learner-a', roles:null },
  ])('rejects malformed or different identity %j', async user => {
    fetchMock.mockResolvedValue(Response.json({data:{user}}));
    expect((await requireCurrentLearnerSession(request(),principal))?.status).toBe(401);
  });
  it('rejects stale permissions after role removal', async () => {
    fetchMock.mockResolvedValue(Response.json({data:{user:{id:'learner-a',roles:[]}}}));
    expect((await requireCurrentLearnerSession(request(),principal))?.status).toBe(403);
  });
  it('fails closed for network and response failures', async () => {
    fetchMock.mockRejectedValue(new Error('private upstream failure'));
    const response = await requireCurrentLearnerSession(request(),principal);
    expect(response?.status).toBe(503);
    expect(await response?.text()).not.toContain('private upstream');
  });
  it('fails closed before transport when configuration is absent', async () => {
    vi.stubEnv('GATEWAY_URL','');
    expect((await requireCurrentLearnerSession(request(),principal))?.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
