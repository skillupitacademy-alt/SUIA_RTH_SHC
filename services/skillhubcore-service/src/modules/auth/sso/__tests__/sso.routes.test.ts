import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TokenService } from '@quiz/auth';
import type { IUserRepository, PeopleUserRecord, PeoplePlatform } from '@quiz/types';
import { createSsoRoutes } from '../sso.routes';
import { SsoService } from '../sso.service';
import { PlatformAccessRevokedError } from '../../../user/user.repository';

const actorId = '11111111-1111-4111-8111-111111111111';
const targetId = '22222222-2222-4222-8222-222222222222';
const foreignId = '33333333-3333-4333-8333-333333333333';
function fixture() {
  const people = new Map<string, PeopleUserRecord>();
  const person = (id: string, platform: PeoplePlatform, role: PeopleUserRecord['role']) => ({ id, platform, role, email: 'same@example.test', passwordHash: 'synthetic', isActive: true, deletedAt: null, version: 1, createdAt: new Date(), updatedAt: new Date() });
  people.set(actorId, person(actorId, 'skillup', 'admin'));
  people.set(targetId, person(targetId, 'skillup', 'student'));
  people.set(foreignId, person(foreignId, 'realtutorialhub', 'student'));
  const grants = new Map([[actorId, ['skillup'] as PeoplePlatform[]], [targetId, [] as PeoplePlatform[]], [foreignId, ['realtutorialhub'] as PeoplePlatform[]]]);
  const repo = {
    transaction: vi.fn(async (callback: (r: unknown) => Promise<unknown>) => callback(repo)),
    lockUsers: vi.fn(async () => undefined),
    findById: vi.fn(async (id: string) => people.get(id)),
    listPlatforms: vi.fn(async (id: string) => grants.get(id) ?? []),
    grantPlatformAccess: vi.fn(async (id: string, platform: PeoplePlatform) => { grants.set(id, [platform]); }),
    revokePlatformAccess: vi.fn(async (id: string) => { grants.set(id, []); }),
    createAuditLog: vi.fn(async () => undefined),
  };
  const service = new SsoService(repo as unknown as IUserRepository);
  repo.transaction.mockImplementation(async callback => {
    const snapshot = new Map([...grants].map(([id, values]) => [id, [...values]]));
    try { return await callback(repo); }
    catch (error) {
      grants.clear();
      snapshot.forEach((values, id) => grants.set(id, values));
      throw error;
    }
  });
  const app = new Hono().route('/admin/users', createSsoRoutes(service));
  const tokenService = new TokenService();
  const request = async (body?: unknown, id = targetId, roles = ['admin'], extraHeaders: Record<string, string> = {}) => {
    const token = await tokenService.signSkillHubCoreAccessToken(actorId, roles, [], ['skillup']);
    return app.request(`/admin/users/${id}/platforms`, { method: body === undefined ? 'GET' : 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', ...extraHeaders }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  };
  return { people, grants, repo, service, request };
}

describe('SSO current actor/action/target boundary', () => {
  it('permits same-platform management with current user.manage permission and audits the action', async () => {
    const f = fixture();
    expect((await f.request({ platform: 'skillup', action: 'grant' })).status).toBe(200);
    expect(f.grants.get(targetId)).toEqual(['skillup']);
    const read = await f.request();
    expect(read.status).toBe(200);
    expect(read.headers.get('cache-control')).toBe('private, no-store');
    expect((await f.request({ platform: 'skillup', action: 'revoke' })).status).toBe(200);
    expect(f.grants.get(targetId)).toEqual([]);
    expect(f.repo.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ actorId, action: 'platform_access_revoke', success: true }));
    expect(f.repo.lockUsers).toHaveBeenCalledWith([actorId, targetId]);
  });

  it.each(['grant', 'revoke'])('denies cross-platform %s despite admin or super-admin roles and matching emails', async action => {
    for (const role of ['admin', 'super_admin'] as const) {
      const f = fixture(); f.people.get(actorId)!.role = role;
      expect((await f.request({ platform: 'realtutorialhub', action }, foreignId, [role])).status).toBe(403);
      expect((await f.request({ platform: 'realtutorialhub', action }, targetId, [role])).status).toBe(403);
      expect(f.repo.grantPlatformAccess).not.toHaveBeenCalled();
      expect(f.repo.revokePlatformAccess).not.toHaveBeenCalled();
    }
  });

  it('rejects missing current permission and stale signed administrative roles', async () => {
    const f = fixture(); f.people.get(actorId)!.role = 'faculty';
    expect((await f.request({ platform: 'skillup' })).status).toBe(403);
    f.people.get(actorId)!.role = 'super_admin';
    expect((await f.request({ platform: 'skillup' })).status).toBe(403);
    expect(f.repo.grantPlatformAccess).not.toHaveBeenCalled();
  });

  it('enforces the existing explicit user.manage permission at the service boundary', async () => {
    const f = fixture(); f.people.get(actorId)!.role = 'faculty';
    await expect(f.service.administerAccess({ shadowUserId: actorId, roles: ['faculty'], platforms: ['skillup'] }, targetId, 'grant', 'skillup')).rejects.toMatchObject({ status: 403 });
    expect(f.repo.grantPlatformAccess).not.toHaveBeenCalled();
  });

  it.each(['disabled', 'deleted', 'revoked'])('denies %s administrator', async state => {
    const f = fixture();
    if (state === 'disabled') f.people.get(actorId)!.isActive = false;
    if (state === 'deleted') f.people.get(actorId)!.deletedAt = new Date();
    if (state === 'revoked') f.grants.set(actorId, []);
    expect((await f.request({ platform: 'skillup' })).status).toBe(403);
    expect(f.repo.grantPlatformAccess).not.toHaveBeenCalled();
  });

  it('denies restoration through ordinary grant and unsupported restore action', async () => {
    const f = fixture(); f.repo.grantPlatformAccess.mockRejectedValueOnce(new PlatformAccessRevokedError());
    expect((await f.request({ platform: 'skillup', action: 'grant' })).status).toBe(403);
    expect((await f.request({ platform: 'skillup', action: 'restore' })).status).toBe(400);
  });

  it('rejects forged target, platform and privilege headers without creating a grant', async () => {
    const f = fixture();
    expect((await f.request({ platform: 'skillup' }, foreignId, ['admin'], { 'x-role': 'super_admin', 'x-platform': 'realtutorialhub', 'x-user-id': foreignId })).status).toBe(403);
    expect((await f.request({ platform: 'skillup' }, 'invalid-uuid')).status).toBe(400);
    expect((await f.request({ platform: 'skillhubcore' })).status).toBe(400);
    expect((await f.request({ platform: 'skillup' }, targetId, ['student'])).status).toBe(403);
    expect(f.repo.grantPlatformAccess).not.toHaveBeenCalled();
  });

  it('fails closed with sanitized errors when authority or audit persistence is unavailable', async () => {
    const f = fixture(); f.repo.findById.mockRejectedValueOnce(new Error('private database detail'));
    const response = await f.request({ platform: 'skillup' });
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('private database detail');
    expect(f.repo.grantPlatformAccess).not.toHaveBeenCalled();
  });

  it('rolls back a grant when its success audit cannot be persisted', async () => {
    const f = fixture();
    f.repo.createAuditLog.mockRejectedValueOnce(new Error('controlled audit outage'));
    expect((await f.request({ platform: 'skillup', action: 'grant' })).status).toBe(503);
    expect(f.grants.get(targetId)).toEqual([]);
  });
});
