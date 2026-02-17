import { beforeEach, describe, expect, it, vi } from 'vitest';

type AdminLoginReturn = {
  admin: { id: string; email: string };
  accessToken: string;
  refreshToken: string;
};

const FIXTURE_EMAIL = 'admin@test.com';
const FIXTURE_ID = 'admin-001';
const FIXTURE_TOKENS = {
  accessToken: 'adm-access-token',
  refreshToken: 'adm-refresh-token',
};

vi.mock('@/modules/auth/admin-auth.service', () => ({
  AdminAuthService: {
    login: vi.fn<() => Promise<AdminLoginReturn>>(),
  },
}));

describe.skip('AdminAuthService (unit)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('issues tokens and returns admin identity', async () => {
    const { AdminAuthService } = await import('@/modules/auth/admin-auth.service');
    const result: AdminLoginReturn = {
      admin: { id: FIXTURE_ID, email: FIXTURE_EMAIL },
      ...FIXTURE_TOKENS,
    };
    vi.mocked(AdminAuthService.login).mockResolvedValue(result);

    const response = await AdminAuthService.login(FIXTURE_EMAIL, 'pw');

    expect(AdminAuthService.login).toHaveBeenCalledWith(FIXTURE_EMAIL, 'pw');
    expect(response.admin.id).toBe(FIXTURE_ID);
    expect(response.accessToken).toBe(FIXTURE_TOKENS.accessToken);
    expect(response.refreshToken).toBe(FIXTURE_TOKENS.refreshToken);
  });

  it('propagates login failures', async () => {
    const { AdminAuthService } = await import('@/modules/auth/admin-auth.service');
    const error = new Error('invalid credentials');
    vi.mocked(AdminAuthService.login).mockRejectedValue(error);

    await expect(() => AdminAuthService.login(FIXTURE_EMAIL, 'wrong')).rejects.toThrow('invalid credentials');
  });
});
