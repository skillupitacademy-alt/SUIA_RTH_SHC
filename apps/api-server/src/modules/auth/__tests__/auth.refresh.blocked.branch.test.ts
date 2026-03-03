import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  findFirstToken: vi.fn(),
  selectUser: vi.fn(),
  update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn() }) }),
  insert: vi.fn().mockReturnValue({ values: vi.fn() }),
}));

vi.mock('@quiz/db', () => ({
  db: {
    query: {
      refreshTokens: { findFirst: (...args: any[]) => mocks.findFirstToken(...args) },
    },
    select: (...args: any[]) => ({
      from: () => ({
        leftJoin: () => ({
          leftJoin: () => ({
            where: () => mocks.selectUser(...args),
          }),
        }),
      }),
    }),
    update: () => mocks.update(),
    insert: () => mocks.insert(),
  },
  users: {},
  roles: {},
  userRoles: {},
  refreshTokens: {},
  exams: {},
}));

vi.mock('@/modules/auth/token.service', () => ({
  TokenService: {
    verifyRefreshToken: vi.fn().mockResolvedValue({ userId: 'u1', isAdmin: false }),
    hashToken: vi.fn().mockResolvedValue('hash'),
    generateAccessToken: vi.fn().mockResolvedValue('newAccess'),
    generateRefreshToken: vi.fn().mockResolvedValue('newRefresh'),
  },
}));

vi.mock('@/modules/auth/audit.service', () => ({
  AuditService: { log: vi.fn() },
}));

// Ensure decodeJwt does not parse real JWT; return minimal payload so refresh path executes
vi.mock('jose', () => ({
  decodeJwt: () => ({ isAdmin: false, exp: Date.now() / 1000 + 3600 }),
}));

describe('AuthService refresh blocked user branch (~162)', () => {
  beforeEach(() => {
    mocks.findFirstToken.mockReset();
    mocks.selectUser.mockReset();
  });

  it('throws access_denied:user_blocked when user is blocked', async () => {
    mocks.findFirstToken.mockResolvedValue({ id: 't1', expiresAt: new Date(Date.now() + 3600 * 1000), revoked: false, userId: 'u1' });
    mocks.selectUser.mockResolvedValue([{ isBlocked: true, roleName: 'USER' }]);

    const { AuthService } = await import('../auth.service');

    await expect(AuthService.refresh('tok')).rejects.toThrow('access_denied:user_blocked');
  });
});
