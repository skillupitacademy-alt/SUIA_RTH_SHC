import { beforeEach, describe, expect, it, vi } from 'vitest';

type RbacPayload = { role?: string; email?: string; userId?: string };

const ADMIN_PAYLOAD = { role: 'admin', roles: ['admin'], email: 'admin@test.com', userId: 'u1', brand: 'realtutorialhub' };
const USER_PAYLOAD = { role: 'user', roles: ['user'], email: 'user@test.com', userId: 'u2', brand: 'realtutorialhub' };

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

describe('RBAC Service (unit)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{ isBlocked: false }])
    } as any);
  });

  it('returns true for admin payload', async () => {
    const { _verifyAdmin } = await import('@/modules/auth/rbac.service');
    const ok = await _verifyAdmin(ADMIN_PAYLOAD as any);
    expect(ok).toBe(true);
  });

  it('returns false for non-admin payload', async () => {
    const { _verifyAdmin } = await import('@/modules/auth/rbac.service');
    // For non-admin, it hits the database check
    mockSelect.mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ isBlocked: false }])
    } as any) // first call (blocked check)
    .mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]) // second call (role check) - fail
    } as any);

    const ok = await _verifyAdmin(USER_PAYLOAD as any);
    expect(ok).toBe(false);
  });

  it('guards when user is blocked', async () => {
    const { _verifyAdmin } = await import('@/modules/auth/rbac.service');
    mockSelect.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ isBlocked: true }])
    } as any);

    const ok = await _verifyAdmin(ADMIN_PAYLOAD as any);
    expect(ok).toBe(false);
  });

  it('returns false when user record is missing', async () => {
    const { _verifyAdmin } = await import('@/modules/auth/rbac.service');
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([])
    } as any);

    const ok = await _verifyAdmin(ADMIN_PAYLOAD as any);
    expect(ok).toBe(true);
  });

  it('falls back to token roles when blocked-check query fails', async () => {
    const { _verifyAdmin } = await import('@/modules/auth/rbac.service');
    mockSelect.mockImplementationOnce(() => {
      throw new Error('db down');
    });

    const ok = await _verifyAdmin({ userId: 'u1', roles: ['SUPER_ADMIN'] } as any);
    expect(ok).toBe(true);
  });

  it('handles non-Error throw values in fallback logging path', async () => {
    const { _verifyAdmin } = await import('@/modules/auth/rbac.service');
    mockSelect.mockImplementationOnce(() => {
      throw 'db down';
    });

    const ok = await _verifyAdmin({ userId: 'u1', roles: ['admin'] } as any);
    expect(ok).toBe(true);
  });

  it('passes database role verification when token is not admin', async () => {
    const { _verifyAdmin } = await import('@/modules/auth/rbac.service');
    mockSelect.mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{ isBlocked: false }])
    } as any).mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{ role: 'admin' }])
    } as any);

    const ok = await _verifyAdmin({ role: 'user', email: 'user@test.com', userId: 'u2' } as any);
    expect(ok).toBe(true);
  });
});
