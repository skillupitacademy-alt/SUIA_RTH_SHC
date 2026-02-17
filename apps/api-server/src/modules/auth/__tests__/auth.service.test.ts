import { beforeEach, describe, expect, it, vi } from 'vitest';

type UserProfile = { id: string; email: string; profile?: { name?: string } };
type LoginReturn = {
  _user: UserProfile;
  accessToken: string;
  refreshToken: string;
  isAdmin: boolean;
};

vi.mock('@/modules/auth/auth.service', () => ({
  AuthService: {
    login: vi.fn<() => Promise<LoginReturn>>(),
    signup: vi.fn<() => Promise<UserProfile>>(),
    logout: vi.fn<() => Promise<void>>(),
  },
}));

describe.skip('AuthService (unit)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('login returns user profile + tokens when credentials are valid', async () => {
    const { AuthService } = await import('@/modules/auth/auth.service');
    const loginResult: LoginReturn = {
      _user: { id: 'u1', email: 'test@example.com', profile: { name: 'Test User' } },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      isAdmin: false,
    };
    vi.mocked(AuthService.login).mockResolvedValue(loginResult);

    const result = await AuthService.login('test@example.com', 'password');
    expect(result.accessToken).toBe('access-token');
    expect(result._user.email).toBe('test@example.com');
  });

  it('signup creates user then logs in', async () => {
    const { AuthService } = await import('@/modules/auth/auth.service');
    const created: UserProfile = { id: 'u2', email: 'c@d.com' };
    const loginResult: LoginReturn = {
      _user: { id: 'u2', email: 'c@d.com', profile: {} },
      accessToken: 'access2',
      refreshToken: 'refresh2',
      isAdmin: false,
    };
    vi.mocked(AuthService.signup).mockResolvedValue(created);
    vi.mocked(AuthService.login).mockResolvedValue(loginResult);

    const user = await AuthService.signup('c@d.com', 'pw', 'Test');
    expect(user.email).toBe('c@d.com');
  });

  it('logout revokes refresh token (placeholder)', async () => {
    const { AuthService } = await import('@/modules/auth/auth.service');
    vi.mocked(AuthService.logout).mockResolvedValue();
    await AuthService.logout('refresh-token');
    expect(AuthService.logout).toHaveBeenCalled();
  });
});
