import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  findFirstUser: vi.fn(),
  updateRefresh: vi.fn().mockReturnValue({ where: vi.fn() }),
}));

vi.mock('@quiz/db', () => ({
  db: {
    query: {
      users: { findFirst: (...args: any[]) => mocks.findFirstUser(...args) },
      refreshTokens: { findFirst: vi.fn() },
    },
    update: () => ({ set: () => ({ where: () => undefined }) }),
    insert: vi.fn(),
  },
  users: {},
  refreshTokens: {},
}));

vi.mock('@/modules/auth/token.service', () => ({
  TokenService: {
    hashToken: async (_t: string) => 'hash',
  },
}));

vi.mock('@/modules/auth/audit.service', () => ({
  AuditService: { log: vi.fn() },
}));

describe('AuthService edge branches', () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.findFirstUser.mockReset();
  });

  it('logout no-ops when session not found (405-406)', async () => {
    mocks.findFirstUser.mockResolvedValue(undefined);
    const { AuthService } = await import('../auth.service');

    const res = await AuthService.logout('missing', 'u1');
    expect(res).toBeUndefined();
  });
});
