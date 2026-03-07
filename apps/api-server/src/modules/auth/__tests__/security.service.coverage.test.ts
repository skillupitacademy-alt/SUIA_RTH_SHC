import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db, loginAttempts, users } from '@quiz/db';
import { SecurityService } from '../security.service';
import { container } from '../../core/container';

vi.mock('@quiz/db', () => ({
  STANDARD_QUERY_TIMEOUT: 15000,
  QUICK_QUERY_TIMEOUT: 5000,
  REPORT_QUERY_TIMEOUT: 30000,
  MIGRATION_TIMEOUT: 120000,
  withTimeout: vi.fn(async (promise: Promise<any>) => promise),
  db: {
    query: {
      users: { findFirst: vi.fn() },
      loginAttempts: { findFirst: vi.fn() },
    },
    insert: vi.fn().mockReturnValue({ values: vi.fn() }),
    update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnThis(), where: vi.fn() }),
    delete: vi.fn().mockReturnValue({ where: vi.fn() }),
  },
  loginAttempts: { id: 'la', userId: 'u', ip: 'ip' },
  users: { id: 'u', email: 'e' },
}));

describe('SecurityService Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    container.reset();
  });

  it('trackLoginAttempt: success deletes attempts', async () => {
    vi.mocked(db.query.users.findFirst).mockResolvedValue({ id: 'u1' } as any);
    const service = container.get(SecurityService);
    await service.trackLoginAttempt('1.1.1.1', 'a@b.com', true);
    expect(db.delete).toHaveBeenCalled();
  });

  it('trackLoginAttempt: failure increments attempts and locks', async () => {
    vi.mocked(db.query.users.findFirst).mockResolvedValue({ id: 'u1' } as any);
    vi.mocked(db.query.loginAttempts.findFirst).mockResolvedValue({ id: 'la1', attempts: 9 } as any);
    const service = container.get(SecurityService);
    await service.trackLoginAttempt('1.1.1.1', 'a@b.com', false); // 10 attempts -> lock
    expect(db.update).toHaveBeenCalled();
  });

  it('isAccountLocked: returns true if lockedUntil is in future', async () => {
    vi.mocked(db.query.users.findFirst).mockResolvedValue({ id: 'u1' } as any);
    vi.mocked(db.query.loginAttempts.findFirst).mockResolvedValue({ id: 'la1', lockedUntil: new Date(Date.now() + 100000) } as any);
    const service = container.get(SecurityService);
    const locked = await service.isAccountLocked('a@b.com', '1.1.1.1');
    expect(locked).toBe(true);
  });

  it('isAccountLocked: returns false if user not found', async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue(undefined);
      const service = container.get(SecurityService);
      const result = await service.isAccountLocked('none@b.com', '1.1.1.1');
      expect(result).toBe(false);
  });
});


