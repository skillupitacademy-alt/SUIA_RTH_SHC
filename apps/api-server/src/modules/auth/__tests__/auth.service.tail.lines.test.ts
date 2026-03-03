import { describe, it, expect, beforeEach, vi } from 'vitest';

const auditLog = vi.fn();
const securityLocked = vi.fn();
const securityTrack = vi.fn();
const passwordCompare = vi.fn();
const tokenVerify = vi.fn();
const tokenHash = vi.fn();
const tokenAccess = vi.fn();
const tokenRefresh = vi.fn();

// Minimal db mock with chained helpers
const updateWhere = vi.fn().mockResolvedValue(undefined);
const updateSet = vi.fn().mockReturnValue({ where: updateWhere });
const selectWhere = vi.fn();
const leftJoin2 = vi.fn().mockReturnValue({ where: selectWhere });
const leftJoin1 = vi.fn().mockReturnValue({ leftJoin: leftJoin2 });
const fromSel = vi.fn().mockReturnValue({ leftJoin: leftJoin1 });
const select = vi.fn().mockReturnValue({ from: fromSel });

const insertReturning = vi.fn().mockResolvedValue([{ id: 'rt1' }]);
const insertValues = vi.fn().mockReturnValue({ returning: insertReturning });
const insert = vi.fn().mockReturnValue({ values: insertValues });

const refreshFindFirst = vi.fn();
const usersFindFirst = vi.fn();

vi.mock('@quiz/db', () => ({
  db: {
    query: {
      refreshTokens: { findFirst: refreshFindFirst },
      users: { findFirst: usersFindFirst },
    },
    update: vi.fn().mockReturnValue({ set: updateSet }),
    select,
    insert,
  },
  users: { id: 'uid', email: 'em', isBlocked: 'blk' },
  roles: { id: 'rid', name: 'rname' },
  userRoles: { userId: 'ur.uid', roleId: 'ur.rid' },
  refreshTokens: { id: 'rtid', token: 'rtok', revoked: 'rev', userId: 'u', expiresAt: 'exp' },
  exams: {},
}));

vi.mock('@/modules/auth/audit.service', () => ({
  AuditService: { log: auditLog },
}));

vi.mock('@/modules/auth/password.service', () => ({
  PasswordService: {
    compare: passwordCompare,
  },
}));

vi.mock('@/modules/auth/security.service', () => ({
  SecurityService: {
    isAccountLocked: securityLocked,
    trackLoginAttempt: securityTrack,
  },
}));

vi.mock('@/modules/auth/token.service', () => ({
  TokenService: {
    generateAccessToken: tokenAccess,
    generateRefreshToken: tokenRefresh,
    hashToken: tokenHash,
    verifyRefreshToken: tokenVerify,
  },
}));

vi.mock('jose', () => ({
  decodeJwt: vi.fn().mockReturnValue({ isAdmin: false }),
}));

describe('AuthService uncovered lines 89 & 201', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    securityLocked.mockResolvedValue(false);
    passwordCompare.mockResolvedValue(true);
    tokenAccess.mockResolvedValue('access');
    tokenRefresh.mockResolvedValue('refresh');
    tokenHash.mockResolvedValue('hash');
  });

  it('login throws when user is blocked (line ~89)', async () => {
    const { AuthService } = await import('../auth.service');
    usersFindFirst.mockResolvedValue({
      id: 'u1',
      email: 'e@test.com',
      passwordHash: 'ph',
      isBlocked: true,
      userRoles: [{ role: { name: 'USER' } }],
    });

    await expect(AuthService.login('e@test.com', 'pw', '1.1.1.1')).rejects.toThrow('Account has been blocked');
    expect(securityTrack).not.toHaveBeenCalledWith('1.1.1.1', 'e@test.com', true);
  });

  it('refresh throws when user not found (line ~201)', async () => {
    const { AuthService } = await import('../auth.service');
    const { decodeJwt } = await import('jose');
    vi.mocked(decodeJwt).mockReturnValue({ isAdmin: false } as any);
    tokenVerify.mockResolvedValue({ userId: 'u1' });
    refreshFindFirst.mockResolvedValue({
      id: 'rt1',
      userId: 'u1',
      revoked: false,
      expiresAt: new Date(Date.now() + 60_000),
    });
    selectWhere.mockResolvedValue([]); // no users

    await expect(AuthService.refresh('token', '1.1.1.1', undefined, 'user')).rejects.toThrow('User not found');
  });
});
