import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';
import { TokenService } from '@quiz/auth';

import { createSsoRoutes } from '../sso.routes';

const createSsoService = () => ({
  getUserPlatforms: vi.fn(async () => ['realtutorialhub']),
  grantPlatformAccess: vi.fn(async () => ['realtutorialhub', 'skillup']),
  revokePlatformAccess: vi.fn(async () => ['realtutorialhub']),
});

describe('sso routes', () => {
  it('lists and mutates platform access for admins', async () => {
    const ssoService = createSsoService();
    const app = new Hono().route('/admin/users', createSsoRoutes(ssoService as any));
    const tokenService = new TokenService();
    const accessToken = await tokenService.signSkillHubCoreAccessToken('admin-1', ['admin'], ['tutorial.preview_only'], ['realtutorialhub']);

    const listResponse = await app.request('/admin/users/user-1/platforms', {
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(listResponse.status).toBe(200);

    const grantResponse = await app.request('/admin/users/user-1/platforms', {
      method: 'POST',
      body: JSON.stringify({ platform: 'skillup', action: 'grant' }),
      headers: { authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' },
    });
    expect(grantResponse.status).toBe(200);

    const revokeResponse = await app.request('/admin/users/user-1/platforms', {
      method: 'POST',
      body: JSON.stringify({ platform: 'skillup', action: 'revoke' }),
      headers: { authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' },
    });
    expect(revokeResponse.status).toBe(200);

    expect(ssoService.getUserPlatforms).toHaveBeenCalledWith('user-1');
    expect(ssoService.grantPlatformAccess).toHaveBeenCalledWith('user-1', 'skillup');
    expect(ssoService.revokePlatformAccess).toHaveBeenCalledWith('user-1', 'skillup');
  });
});
