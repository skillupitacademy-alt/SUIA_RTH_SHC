import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { RBACService, PERMISSIONS } from '@quiz/auth/rbac';

const mocks = vi.hoisted(() => ({ verify: vi.fn(), getDb: vi.fn(), upstream: vi.fn() }));
vi.mock('@quiz/auth', () => ({ TokenService: { verifyAdminAccessToken: mocks.verify } }));
vi.mock('@quiz/db', () => ({ getDb: mocks.getDb, domains: {}, subjects: {}, topics: {}, subtopics: {}, skills: {}, withTimeout: async (p: Promise<unknown>) => p }));
vi.mock('@/share-branding/auth', () => ({ proxyUpstreamRequest: mocks.upstream, FALLBACK_API_BASE_SKILLHUBCORE: 'https://api.skillhubcore.in/api' }));

import { requireAdminRequest } from '../admin-route-guard';
import { hasAdminRole } from '../auth-helpers';
import * as domains from '@/app/api/admin/domains/route';
import * as subjects from '@/app/api/admin/subjects/route';
import * as topics from '@/app/api/admin/topics/route';
import * as subtopics from '@/app/api/admin/subtopics/route';
import * as skills from '@/app/api/admin/skills/route';
import { GET as observability } from '@/app/api/marketing/collector/observability/route';
import { POST as login } from '@/app/api/auth/login/route';
import { POST as logout } from '@/app/api/auth/logout/route';
import { proxy } from '@/proxy';

const principal = { userId: 'admin-1', originalUserId: 'admin-1', shadowUserId: 'admin-1', brand: 'skillhubcore', roles: ['admin'] };
function request(path = '/api/admin/domains', method = 'GET', authenticated = true, origin: string | null = 'https://admin.skillhubcore.in') {
  const headers = new Headers();
  if (authenticated) headers.set('cookie', 'accessToken=signed-token');
  if (origin) headers.set('origin', origin);
  return new NextRequest(`https://admin.skillhubcore.in${path}`, { method, headers });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.verify.mockResolvedValue(principal);
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

describe('SHC admin trust boundary', () => {
  it('requires authentication even when identity headers are supplied', async () => {
    const req = request(undefined, 'GET', false);
    req.headers.set('x-user-id', 'admin-1');
    req.headers.set('x-user-roles', 'super_admin');
    expect((await requireAdminRequest(req))?.status).toBe(401);
    expect(mocks.verify).not.toHaveBeenCalled();
  });
  it.each([undefined, 'skillup', 'realtutorialhub'])('rejects brand %s', async brand => {
    mocks.verify.mockResolvedValue({ ...principal, brand });
    expect((await requireAdminRequest(request()))?.status).toBe(401);
  });
  it('uses only the shc-admin audience and does not retry a generic admin token', async () => {
    mocks.verify.mockRejectedValue(new Error('audience mismatch'));
    expect((await requireAdminRequest(request()))?.status).toBe(401);
    expect(mocks.verify).toHaveBeenCalledExactlyOnceWith('signed-token', { audience: 'shc-admin' });
  });
  it.each([[], ['student'], ['faculty']])('denies roles %j even with isAdmin=true', async (...roles) => {
    mocks.verify.mockResolvedValue({ ...principal, roles: roles.flat(), isAdmin: true });
    expect((await requireAdminRequest(request()))?.status).toBe(403);
  });
  it('does not elevate a principal using the legacy isAdmin flag', () => {
    expect(hasAdminRole({ ...principal, roles: ['student'], isAdmin: true })).toBe(false);
  });
  it('allows a verified admin and normalizes role casing', async () => {
    mocks.verify.mockResolvedValue({ ...principal, roles: [' ADMIN '] });
    expect(await requireAdminRequest(request())).toBeNull();
  });
  it.each([
    { roles: ['student', 'admin'] },
    { roles: ['admin', 'student'] },
    { roles: ['student', 'super_admin'] },
  ])('preserves elevated permissions in mixed roles $roles', async ({ roles }) => {
    mocks.verify.mockResolvedValue({ ...principal, roles });
    expect(await requireAdminRequest(request('/api/tutorial-composer/sections/id/publish', 'POST'))).toBeNull();
  });
  it.each([null, 'null', 'https://evil.example', 'https://admin.skillhubcore.in.evil.example'])('denies mutation origin %s', async origin => {
    const req = request(undefined, 'POST', true, origin);
    req.headers.set('authorization', 'Bearer attacker-value');
    req.headers.set('x-forwarded-host', 'evil.example');
    expect((await requireAdminRequest(req))?.status).toBe(403);
  });
  it('allows a same-origin authenticated mutation', async () => {
    expect(await requireAdminRequest(request(undefined, 'POST'))).toBeNull();
  });
  it.each([
    ['/api/tutorial-composer/sections/id/publish', 'POST', PERMISSIONS.TUTORIAL_AUTHOR_PUBLISH],
    ['/api/tutorial-composer/sections/id', 'DELETE', PERMISSIONS.TUTORIAL_AUTHOR_DELETE],
    ['/api/tutorial-left-sidebar', 'POST', PERMISSIONS.TUTORIAL_AUTHOR_PUBLISH],
    ['/api/admin/domains/batch-delete', 'POST', PERMISSIONS.COURSE_DELETE],
    ['/api/tutorial-composer/sections/id/publish/', 'POST', PERMISSIONS.TUTORIAL_AUTHOR_PUBLISH],
    ['/api/tutorial-left-sidebar/', 'POST', PERMISSIONS.TUTORIAL_AUTHOR_PUBLISH],
    ['/api/tutorial-composer/sections/', 'POST', PERMISSIONS.TUTORIAL_AUTHOR_CREATE],
    ['/api/admin/domains/batch-delete/', 'POST', PERMISSIONS.COURSE_DELETE],
  ])('checks the operation permission for %s', async (path, method, permission) => {
    const check = vi.spyOn(RBACService, 'hasPermission').mockReturnValue(false);
    expect((await requireAdminRequest(request(path, method)))?.status).toBe(403);
    expect(check).toHaveBeenCalledWith(['admin'], permission, 'admin-1');
  });
  it('protects newly added API paths by default in the proxy', async () => {
    expect((await proxy(request('/api/future-tool', 'GET', false))).status).toBe(401);
    expect((await proxy(request('/api/health', 'GET', false))).status).toBe(200);
  });
  it('does not permit the removed development bypass', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('TUTORIAL_COMPOSER_DEV_AUTH_BYPASS', 'true');
    const req = request('/api/tutorial-composer/import', 'POST', false);
    req.headers.set('x-tutorial-dev-bypass', 'true');
    expect((await proxy(req)).status).toBe(401);
  });
});

describe('direct CRUD handlers deny access before storage', () => {
  for (const [name, routes] of Object.entries({ domains, subjects, topics, subtopics, skills })) {
    for (const method of ['GET', 'POST', 'PUT', 'DELETE'] as const) {
      it(`${name} ${method} rejects anonymous requests without touching the DB`, async () => {
        expect((await routes[method](request(`/api/admin/${name}`, method, false))).status).toBe(401);
        expect(mocks.getDb).not.toHaveBeenCalled();
      });
    }
  }
  it('does not use the analytics service credential for anonymous callers', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    expect((await observability(request('/api/marketing/collector/observability', 'GET', false))).status).toBe(401);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('admin session cookies', () => {
  it('keeps tokens out of login JSON and sets HttpOnly host cookies', async () => {
    mocks.upstream.mockResolvedValue(Response.json({ accessToken: 'secret-access', refreshToken: 'secret-refresh', user: { id: 'admin-1' } }));
    const response = await login(request('/api/auth/login', 'POST', false));
    expect(await response.json()).toEqual({ user: { id: 'admin-1' } });
    for (const name of ['accessToken', 'admin_accessToken', 'refreshToken', 'admin_refreshToken']) {
      expect(response.cookies.get(name)).toMatchObject({ httpOnly: true, sameSite: 'lax', path: '/' });
      expect(response.cookies.get(name)?.domain).toBeUndefined();
      expect(response.headers.getSetCookie()).toContain(
        `${name}=; Path=/; Domain=.skillhubcore.in; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
      );
    }
  });
  it('blocks cross-origin login before forwarding credentials', async () => {
    expect((await login(request('/api/auth/login', 'POST', false, 'https://evil.example'))).status).toBe(403);
    expect(mocks.upstream).not.toHaveBeenCalled();
  });
  it('clears all four aliases even when upstream logout is unavailable', async () => {
    mocks.upstream.mockRejectedValue(new Error('offline'));
    const response = await logout(request('/api/auth/logout', 'POST'));
    expect(response.status).toBe(502);
    const cookies = response.headers.getSetCookie();
    expect(cookies).toHaveLength(8);
    for (const name of ['accessToken', 'admin_accessToken', 'refreshToken', 'admin_refreshToken']) {
      expect(cookies.filter(cookie => cookie.startsWith(`${name}=`))).toHaveLength(2);
    }
    expect(cookies.every(cookie => cookie.includes('Max-Age=0'))).toBe(true);
  });
});
