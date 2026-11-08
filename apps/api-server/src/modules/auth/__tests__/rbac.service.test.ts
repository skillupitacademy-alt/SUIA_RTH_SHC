import { beforeEach, describe, expect, it, vi } from 'vitest';

const ADMIN_PAYLOAD = {
  role: 'admin',
  roles: ['admin'],
  email: 'admin@test.com',
  userId: 'u1',
  brand: 'realtutorialhub',
  isAdmin: true,
  tokenType: 'admin' as const,
  aud: 'admin',
};

const USER_PAYLOAD = {
  role: 'user',
  roles: ['user'],
  email: 'user@test.com',
  userId: 'u2',
  brand: 'realtutorialhub',
  isAdmin: false,
  tokenType: 'user' as const,
  aud: 'user',
};

const mockSelect = vi.fn();

vi.mock('@/modules/auth/brand-db', () => ({
  getAuthBrandContext: vi.fn(() => ({
    db: { select: mockSelect },
    tables: {
      users: { id: 'id', isBlocked: 'isBlocked' },
      userRoles: { userId: 'userId', roleId: 'roleId' },
      roles: { id: 'id', name: 'name' },
    },
  })),
  shouldUseBrandBinding: vi.fn(() => true),
}));

describe('RBAC Service - Strict Tenant Admin & Account Eligibility (ADMIN-01)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{ isBlocked: false }]),
    } as any);
  });

  describe('_verifyAdmin', () => {
    it('returns true for valid admin payload with active DB account', async () => {
      const { _verifyAdmin } = await import('@/modules/auth/rbac.service');
      const ok = await _verifyAdmin(ADMIN_PAYLOAD as any);
      expect(ok).toBe(true);
    });

    it('returns false for non-admin payload without querying DB', async () => {
      const { _verifyAdmin } = await import('@/modules/auth/rbac.service');
      const ok = await _verifyAdmin(USER_PAYLOAD as any);
      expect(ok).toBe(false);
      expect(mockSelect).not.toHaveBeenCalled();
    });

    it('guards when user is blocked in DB (fail closed)', async () => {
      const { _verifyAdmin } = await import('@/modules/auth/rbac.service');
      mockSelect.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ isBlocked: true }]),
      } as any);

      const ok = await _verifyAdmin(ADMIN_PAYLOAD as any);
      expect(ok).toBe(false);
    });

    it('returns false when user record is missing in DB', async () => {
      const { _verifyAdmin } = await import('@/modules/auth/rbac.service');
      mockSelect.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      } as any);

      const ok = await _verifyAdmin(ADMIN_PAYLOAD as any);
      expect(ok).toBe(false);
    });

    it('denies when DB query fails (fail-closed, no role fallback)', async () => {
      const { _verifyAdmin } = await import('@/modules/auth/rbac.service');
      mockSelect.mockImplementationOnce(() => {
        throw new Error('db down');
      });

      const ok = await _verifyAdmin(ADMIN_PAYLOAD as any);
      expect(ok).toBe(false);
    });

    it('denies when brand is non-canonical or foreign', async () => {
      const { _verifyAdmin } = await import('@/modules/auth/rbac.service');
      const shcPayload = { ...ADMIN_PAYLOAD, brand: 'skillhubcore' };
      const ok = await _verifyAdmin(shcPayload as any);
      expect(ok).toBe(false);
      expect(mockSelect).not.toHaveBeenCalled();
    });

    it('denies when subject is empty or missing', async () => {
      const { _verifyAdmin } = await import('@/modules/auth/rbac.service');
      const emptySubject = { ...ADMIN_PAYLOAD, userId: '   ' };
      const ok = await _verifyAdmin(emptySubject as any);
      expect(ok).toBe(false);
      expect(mockSelect).not.toHaveBeenCalled();
    });

    it('accepts array audience when it contains admin and internal', async () => {
      const { _verifyAdmin } = await import('@/modules/auth/rbac.service');
      const arrayAudiencePayload = { ...ADMIN_PAYLOAD, aud: ['admin', 'internal'] };
      const ok = await _verifyAdmin(arrayAudiencePayload as any);
      expect(ok).toBe(true);
    });

    it('denies array audience when internal alone without admin', async () => {
      const { _verifyAdmin } = await import('@/modules/auth/rbac.service');
      const internalOnlyPayload = { ...ADMIN_PAYLOAD, aud: ['internal'] };
      const ok = await _verifyAdmin(internalOnlyPayload as any);
      expect(ok).toBe(false);
      expect(mockSelect).not.toHaveBeenCalled();
    });

    it('denies array audience containing unauthorized values like user or infra', async () => {
      const { _verifyAdmin } = await import('@/modules/auth/rbac.service');
      const mixedPayload = { ...ADMIN_PAYLOAD, aud: ['admin', 'user'] };
      const ok = await _verifyAdmin(mixedPayload as any);
      expect(ok).toBe(false);
      expect(mockSelect).not.toHaveBeenCalled();
    });

    it('does not elevate non-admin tokens via database role fallback', async () => {
      const { _verifyAdmin } = await import('@/modules/auth/rbac.service');
      // Even if DB has an admin role for this user, token class failure is final
      const nonAdminToken = { role: 'user', email: 'user@test.com', userId: 'u2', brand: 'realtutorialhub' };
      const ok = await _verifyAdmin(nonAdminToken as any);
      expect(ok).toBe(false);
      expect(mockSelect).not.toHaveBeenCalled();
    });
  });

  describe('_verifyActiveAccount', () => {
    it('returns true when user exists and is not blocked', async () => {
      const { _verifyActiveAccount } = await import('@/modules/auth/rbac.service');
      const ok = await _verifyActiveAccount('u1', 'skillup');
      expect(ok).toBe(true);
    });

    it('returns false when user is blocked', async () => {
      const { _verifyActiveAccount } = await import('@/modules/auth/rbac.service');
      mockSelect.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ isBlocked: true }]),
      } as any);

      const ok = await _verifyActiveAccount('u1', 'skillup');
      expect(ok).toBe(false);
    });

    it('returns false when user is not found', async () => {
      const { _verifyActiveAccount } = await import('@/modules/auth/rbac.service');
      mockSelect.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      } as any);

      const ok = await _verifyActiveAccount('missing-u', 'skillup');
      expect(ok).toBe(false);
    });

    it('returns false on invalid brand without DB query', async () => {
      const { _verifyActiveAccount } = await import('@/modules/auth/rbac.service');
      const ok = await _verifyActiveAccount('u1', 'skillhubcore');
      expect(ok).toBe(false);
      expect(mockSelect).not.toHaveBeenCalled();
    });

    it('returns false on empty userId without DB query', async () => {
      const { _verifyActiveAccount } = await import('@/modules/auth/rbac.service');
      const ok = await _verifyActiveAccount('', 'skillup');
      expect(ok).toBe(false);
      expect(mockSelect).not.toHaveBeenCalled();
    });
  });
});
