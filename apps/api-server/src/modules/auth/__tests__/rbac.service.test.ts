import { db } from '@quiz/db';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type RbacPayload = { role?: string; email?: string; userId?: string };

const ADMIN_PAYLOAD = { role: 'admin', email: 'admin@test.com', userId: 'u1' };
const USER_PAYLOAD = { role: 'user', email: 'user@test.com', userId: 'u2' };

describe('RBAC Service (unit)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.select).mockReturnValue({
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
    vi.mocked(db.select).mockReturnValueOnce({
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
    vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ isBlocked: true }])
    } as any);

    const ok = await _verifyAdmin(ADMIN_PAYLOAD as any);
    expect(ok).toBe(false);
  });
});
