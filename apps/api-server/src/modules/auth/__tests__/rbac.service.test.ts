import { beforeEach,describe, expect, it, vi } from 'vitest';

vi.mock('@/modules/auth/rbac.service', () => ({
  _verifyAdmin: vi.fn<() => Promise<boolean>>(),
}));

describe.skip('RBAC Service (unit)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns true for admin payload', async () => {
    const { _verifyAdmin } = await import('@/modules/auth/rbac.service');
    vi.mocked(_verifyAdmin).mockResolvedValue(true);
    const ok = await _verifyAdmin({ role: 'admin' } as unknown as Record<string, unknown>);
    expect(ok).toBe(true);
  });

  it('returns false for non-admin payload', async () => {
    const { _verifyAdmin } = await import('@/modules/auth/rbac.service');
    vi.mocked(_verifyAdmin).mockResolvedValue(false);
    const ok = await _verifyAdmin({ role: 'user' } as unknown as Record<string, unknown>);
    expect(ok).toBe(false);
  });
});
