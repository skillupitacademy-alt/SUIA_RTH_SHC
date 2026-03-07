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
    update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnThis(), where: vi.fn() }),
  },
  users: { id: 'u', email: 'e' },
  loginAttempts: { id: 'la', userId: 'u', ip: 'ip', attempts: 0 },
}));

describe('SecurityService branch coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    container.reset();
    container.register(SecurityService, new SecurityService(db as any));
  });

  it('trackLoginAttempt: updates existing entry (Line 46)', async () => {
    vi.mocked(db.query.users.findFirst).mockResolvedValue({ id: 'u1' } as any);
    vi.mocked(db.query.loginAttempts.findFirst).mockResolvedValue({ id: 'la1', attempts: 1 } as any);
    
    const service = container.get(SecurityService);
    await service.trackLoginAttempt('1.1.1.1', 'a@b.com', false);
    expect(db.update).toHaveBeenCalled();
  });

  it('isAccountLocked: returns false if attempt.lockedUntil is null (Line 67)', async () => {
    vi.mocked(db.query.users.findFirst).mockResolvedValue({ id: 'u1' } as any);
    vi.mocked(db.query.loginAttempts.findFirst).mockResolvedValue({ id: 'la1', lockedUntil: null } as any);
    
    const service = container.get(SecurityService);
    const result = await service.isAccountLocked('a@b.com', '1.1.1.1');
    expect(result).toBe(false);
  });

  it('isAccountLocked: returns true if locked (Line 76)', async () => {
    vi.mocked(db.query.users.findFirst).mockResolvedValue({ id: 'u1' } as any);
    vi.mocked(db.query.loginAttempts.findFirst).mockResolvedValue({ id: 'la1', lockedUntil: new Date(Date.now() + 10000) } as any);
    
    const service = container.get(SecurityService);
    const result = await service.isAccountLocked('a@b.com', '1.1.1.1');
    expect(result).toBe(true);
  });
});


