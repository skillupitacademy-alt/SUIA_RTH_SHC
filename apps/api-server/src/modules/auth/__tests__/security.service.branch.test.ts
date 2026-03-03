import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  findUser: vi.fn(),
  findAttempt: vi.fn(),
}));

vi.mock('@quiz/db', () => ({
  db: {
    query: {
      users: { findFirst: (...args: any[]) => mocks.findUser(...args) },
      loginAttempts: { findFirst: (...args: any[]) => mocks.findAttempt(...args) },
    },
    delete: vi.fn().mockReturnValue({ where: vi.fn() }),
    insert: vi.fn().mockReturnValue({ values: vi.fn() }),
    update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn() }) }),
  },
  loginAttempts: {},
  users: {},
}));

describe('SecurityService branches', () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.findUser.mockReset();
    mocks.findAttempt.mockReset();
  });

  it('trackLoginAttempt returns early when user not found', async () => {
    mocks.findUser.mockResolvedValue(undefined);
    const { SecurityService } = await import('../security.service');
    const res = await SecurityService.trackLoginAttempt('1.1.1.1', 'none', false);
    expect(res).toBeUndefined();
  });

  it('isAccountLocked returns false when lock expired', async () => {
    mocks.findUser.mockResolvedValue({ id: 'u1' });
    mocks.findAttempt.mockResolvedValue({ lockedUntil: new Date(Date.now() - 1000) });
    const { SecurityService } = await import('../security.service');
    const locked = await SecurityService.isAccountLocked('e@example.com', '1.1.1.1');
    expect(locked).toBe(false);
  });
});
