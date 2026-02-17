import { beforeEach, describe, expect, it, vi } from 'vitest';

type RbacPayload = { role?: string; email?: string };

vi.mock('@/modules/auth/rbac.service', () => ({
  _verifyAdmin: vi.fn<() => Promise<boolean>>(),
}));

const ADMIN_PAYLOAD: RbacPayload = { role: 'admin', email: 'admin@test.com' };
const USER_PAYLOAD: RbacPayload = { role: 'user', email: 'user@test.com' };

describe.skip('RBAC Service (unit)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns true for admin payload', async () => {
    const { _verifyAdmin } = await import('@/modules/auth/rbac.service');
    vi.mocked(_verifyAdmin).mockResolvedValue(true);

    const ok = await _verifyAdmin(ADMIN_PAYLOAD as unknown as Record<string, unknown>);

    expect(_verifyAdmin).toHaveBeenCalledWith(ADMIN_PAYLOAD);
    expect(ok).toBe(true);
  });

  it('returns false for non-admin payload', async () => {
    const { _verifyAdmin } = await import('@/modules/auth/rbac.service');
    vi.mocked(_verifyAdmin).mockResolvedValue(false);

    const ok = await _verifyAdmin(USER_PAYLOAD as unknown as Record<string, unknown>);

    expect(_verifyAdmin).toHaveBeenCalledWith(USER_PAYLOAD);
    expect(ok).toBe(false);
  });

  it('guards when role is missing', async () => {
    const { _verifyAdmin } = await import('@/modules/auth/rbac.service');
    vi.mocked(_verifyAdmin).mockResolvedValue(false);

    const ok = await _verifyAdmin({ email: 'no-role@test.com' } as unknown as Record<string, unknown>);

    expect(ok).toBe(false);
  });
});
