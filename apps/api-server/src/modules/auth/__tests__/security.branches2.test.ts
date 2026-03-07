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
            loginAttempts: { findFirst: vi.fn() }
        },
        update: vi.fn().mockImplementation(() => ({
            set: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis()
        }))
    },
    loginAttempts: { id: 'la', attempts: 5, lockedUntil: null },
    users: { id: 'u', email: 'e' }
}));

describe('SecurityService tail branches', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        container.reset();
        container.register(SecurityService, new SecurityService(db as any));
    });

    it('isAccountLocked: returns false if attempt.lockedUntil is null (Line 67)', async () => {
        vi.mocked(db.query.users.findFirst).mockResolvedValue({ id: 'u1' } as any);
        vi.mocked(db.query.loginAttempts.findFirst).mockResolvedValue({ id: 'a1', attempts: 5, lockedUntil: null } as any);
        
        const service = container.get(SecurityService);
        const locked = await service.isAccountLocked('email', 'ip');
        expect(locked).toBe(false);
    });

    it('trackLoginAttempt: no-op if user not found (Line 14)', async () => {
        vi.mocked(db.query.users.findFirst).mockResolvedValue(undefined);
        const service = container.get(SecurityService);
        await service.trackLoginAttempt('ip', 'email', false);
        expect(db.update).not.toHaveBeenCalled();
    });
});


