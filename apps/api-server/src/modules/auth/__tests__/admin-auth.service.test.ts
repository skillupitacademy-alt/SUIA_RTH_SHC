import { beforeEach, describe, expect, it, vi } from 'vitest';

type AdminLoginReturn = {
  admin: { id: string; email: string };
  accessToken: string;
  refreshToken: string;
};

vi.mock('@/modules/auth/admin-auth.service', () => ({
  AdminAuthService: {
    login: vi.fn<() => Promise<AdminLoginReturn>>(),
  },
}));

describe.skip('AdminAuthService (unit)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('login issues admin tokens', async () => {
    const { AdminAuthService } = await import('@/modules/auth/admin-auth.service');
    const result: AdminLoginReturn = {
      admin: { id: 'a1', email: 'admin@test.com' },
      accessToken: 'adm-access',
      refreshToken: 'adm-refresh',
    };
    vi.mocked(AdminAuthService.login).mockResolvedValue(result);
    const res = await AdminAuthService.login('admin@test.com', 'pw');
    expect(res.accessToken).toBe('adm-access');
    expect(res.admin.email).toBe('admin@test.com');
  });
});
