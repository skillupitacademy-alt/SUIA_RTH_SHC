import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { TokenService } from '@/modules/auth/token.service';

const { logout } = vi.hoisted(() => ({ logout: vi.fn() }));
vi.mock('@/modules/auth/shc-auth.service', async () => ({
  ...await vi.importActual<typeof import('@/modules/auth/shc-auth.service')>('@/modules/auth/shc-auth.service'),
  SHCAuthService: class { logout = logout; },
}));
import { POST } from '../route';

describe('SHC logout authoritative result', () => {
  beforeEach(() => { vi.clearAllMocks(); logout.mockResolvedValue(undefined); });
  async function request() {
    const token = await new TokenService().generateAccessToken({
      userId: 'admin-1', originalUserId: 'admin-1', shadowUserId: 'admin-1',
      email: 'admin@example.invalid', roles: ['admin'], isAdmin: true,
      tokenType: 'admin', brand: 'skillhubcore', aud: 'shc-admin', sessionBinding: 'a'.repeat(64),
    });
    return new NextRequest('http://localhost/api/shc/auth/logout', {
      method: 'POST', headers: { cookie: `admin_accessToken=${token}` },
    });
  }
  it('verifies the SHC audience and passes the signed session to revocation', async () => {
    const response = await POST(await request());
    expect(response.status).toBe(200);
    expect(logout).toHaveBeenCalledWith(expect.objectContaining({ userId: 'admin-1', sessionBinding: 'a'.repeat(64) }), expect.anything());
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  });
  it('rejects invalid credentials before revocation', async () => {
    const response = await POST(new NextRequest('http://localhost/api/shc/auth/logout', {
      method: 'POST', headers: { authorization: 'Bearer invalid' },
    }));
    expect(response.status).toBe(401);
    expect(logout).not.toHaveBeenCalled();
  });
  it('returns a sanitized non-success when revocation fails', async () => {
    logout.mockRejectedValueOnce(new Error('private database diagnostic'));
    const response = await POST(await request());
    expect(response.status).toBe(503);
    expect(JSON.stringify(await response.json())).not.toContain('private database diagnostic');
  });
});
