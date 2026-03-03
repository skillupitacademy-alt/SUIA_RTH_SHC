import { describe, it, expect, vi } from 'vitest';

vi.mock('@quiz/db', () => ({
  db: {
    query: { users: { findFirst: vi.fn().mockResolvedValue(undefined) } },
  },
  loginAttempts: {},
  users: {},
}));

describe('SecurityService early return (no user)', () => {
  it('returns false when user not found (line ~45)', async () => {
    const { SecurityService } = await import('../security.service');
    const locked = await SecurityService.isAccountLocked('missing@example.com', '1.1.1.1');
    expect(locked).toBe(false);
  });
});
