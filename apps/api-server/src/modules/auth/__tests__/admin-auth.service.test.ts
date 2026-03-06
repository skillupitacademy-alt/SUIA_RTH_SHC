import { beforeEach, describe, expect, it, vi } from 'vitest';

const FIXTURE_EMAIL = 'admin@test.com';
const FIXTURE_ID = 'admin-001';

const h = vi.hoisted(() => ({
  selectWhereQueue: [] as unknown[],
  insertValues: vi.fn(),
  insert: vi.fn(),
  security: {
    isAccountLocked: vi.fn(),
    trackLoginAttempt: vi.fn(),
  },
  audit: {
    log: vi.fn(),
  },
  password: {
    compare: vi.fn(),
  },
  token: {
    generateAccessToken: vi.fn(),
    generateRefreshToken: vi.fn(),
    hashToken: vi.fn(),
  },
}));

vi.mock('@quiz/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        leftJoin: vi.fn(() => ({
          leftJoin: vi.fn(() => ({
            leftJoin: vi.fn(() => ({
              where: vi.fn(() => (h.selectWhereQueue.length > 0 ? h.selectWhereQueue.shift() : [])),
            })),
          })),
        })),
      })),
    })),
    insert: h.insert,
  },
  refreshTokens: { userId: 'userId', token: 'token', expiresAt: 'expiresAt' },
  users: { id: 'id', email: 'email', passwordHash: 'passwordHash' },
  userProfiles: { userId: 'userId', name: 'name' },
  userRoles: { userId: 'userId', roleId: 'roleId' },
  roles: { id: 'id', name: 'name' },
}));

vi.mock('@/modules/core/container', () => ({
  container: {
    get: vi.fn((svc: unknown) => {
      if ((svc as any).name === 'SecurityService') return h.security;
      if ((svc as any).name === 'AuditService') return h.audit;
      if ((svc as any).name === 'PasswordService') return h.password;
      if ((svc as any).name === 'TokenService') return h.token;
      return undefined;
    }),
  },
}));

describe('AdminAuthService (unit)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.selectWhereQueue.length = 0;
    h.insertValues.mockResolvedValue(undefined);
    h.insert.mockReturnValue({ values: h.insertValues });
  });

  it('issues tokens and returns admin identity for valid admin', async () => {
    const { AdminAuthService } = await import('@/modules/auth/admin-auth.service');
    h.security.isAccountLocked.mockResolvedValue(false);
    h.password.compare.mockResolvedValue(true);
    h.token.generateAccessToken.mockResolvedValue('adm-access-token');
    h.token.generateRefreshToken.mockResolvedValue('adm-refresh-token');
    h.token.hashToken.mockResolvedValue('adm-refresh-token-hash');
    h.selectWhereQueue.push([
      {
        id: FIXTURE_ID,
        email: FIXTURE_EMAIL,
        passwordHash: 'hash',
        name: null,
        roleName: 'ADMIN',
      },
    ]);

    const response = await AdminAuthService.login(FIXTURE_EMAIL, 'pw', '1.1.1.1');

    expect(response.user.id).toBe(FIXTURE_ID);
    expect(response.user.name).toBe('Admin');
    expect(response.accessToken).toBe('adm-access-token');
    expect(response.refreshToken).toBe('adm-refresh-token');
    expect(h.security.trackLoginAttempt).toHaveBeenCalledWith('1.1.1.1', FIXTURE_EMAIL, true);
  });

  it('defaults primary role to admin when first role is undefined', async () => {
    const { AdminAuthService } = await import('@/modules/auth/admin-auth.service');
    h.security.isAccountLocked.mockResolvedValue(false);
    h.password.compare.mockResolvedValue(true);
    h.token.generateAccessToken.mockResolvedValue('adm-access-token');
    h.token.generateRefreshToken.mockResolvedValue('adm-refresh-token');
    h.token.hashToken.mockResolvedValue('adm-refresh-token-hash');
    h.selectWhereQueue.push([
      {
        id: FIXTURE_ID,
        email: FIXTURE_EMAIL,
        passwordHash: 'hash',
        name: 'Admin',
        roleName: undefined,
      },
      {
        id: FIXTURE_ID,
        email: FIXTURE_EMAIL,
        passwordHash: 'hash',
        name: 'Admin',
        roleName: 'ADMIN',
      },
    ]);

    const response = await AdminAuthService.login(FIXTURE_EMAIL, 'pw', '1.1.1.1');

    expect(response.user.role).toBe('admin');
  });

  it('denies access when account is locked', async () => {
    const { AdminAuthService } = await import('@/modules/auth/admin-auth.service');
    h.security.isAccountLocked.mockResolvedValue(true);

    await expect(AdminAuthService.login(FIXTURE_EMAIL, 'pw', '1.1.1.1')).rejects.toThrow(
      'Account access restricted. Contact Governance.'
    );
    expect(h.audit.log).toHaveBeenCalled();
  });

  it('denies access when user is not found', async () => {
    const { AdminAuthService } = await import('@/modules/auth/admin-auth.service');
    h.security.isAccountLocked.mockResolvedValue(false);
    h.selectWhereQueue.push([]);

    await expect(AdminAuthService.login(FIXTURE_EMAIL, 'pw', '1.1.1.1')).rejects.toThrow('Access Denied');
    expect(h.security.trackLoginAttempt).toHaveBeenCalledWith('1.1.1.1', FIXTURE_EMAIL, false);
  });

  it('denies access when password does not match', async () => {
    const { AdminAuthService } = await import('@/modules/auth/admin-auth.service');
    h.security.isAccountLocked.mockResolvedValue(false);
    h.password.compare.mockResolvedValue(false);
    h.selectWhereQueue.push([
      {
        id: FIXTURE_ID,
        email: FIXTURE_EMAIL,
        passwordHash: 'hash',
        name: 'Admin',
        roleName: 'ADMIN',
      },
    ]);

    await expect(AdminAuthService.login(FIXTURE_EMAIL, 'pw', '1.1.1.1')).rejects.toThrow('Access Denied');
    expect(h.audit.log).toHaveBeenCalled();
  });

  it('denies access when user lacks admin roles', async () => {
    const { AdminAuthService } = await import('@/modules/auth/admin-auth.service');
    h.security.isAccountLocked.mockResolvedValue(false);
    h.password.compare.mockResolvedValue(true);
    h.selectWhereQueue.push([
      {
        id: FIXTURE_ID,
        email: FIXTURE_EMAIL,
        passwordHash: 'hash',
        name: 'Admin',
        roleName: 'STUDENT',
      },
    ]);

    await expect(AdminAuthService.login(FIXTURE_EMAIL, 'pw', '1.1.1.1')).rejects.toThrow(
      'Unauthorized: Governance Privileges Required'
    );
    expect(h.audit.log).toHaveBeenCalled();
  });

  it('denies infra audience when user lacks infrastructure role', async () => {
    const { AdminAuthService } = await import('@/modules/auth/admin-auth.service');
    h.security.isAccountLocked.mockResolvedValue(false);
    h.password.compare.mockResolvedValue(true);
    h.selectWhereQueue.push([
      {
        id: FIXTURE_ID,
        email: FIXTURE_EMAIL,
        passwordHash: 'hash',
        name: 'Admin',
        roleName: 'ADMIN',
      },
    ]);

    await expect(AdminAuthService.login(FIXTURE_EMAIL, 'pw', '1.1.1.1', 'infra')).rejects.toThrow(
      'Access Denied: Infrastructure privileges required for this portal'
    );
    expect(h.audit.log).toHaveBeenCalled();
  });
});
