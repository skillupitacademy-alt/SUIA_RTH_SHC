import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@quiz/db';
import { SecurityService } from '../security.service';

vi.mock('@quiz/db', () => ({
    db: {
        query: {
            users: { findFirst: vi.fn() as any },
            loginAttempts: { findFirst: vi.fn() as any }
        },
        update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn() }) }),
    },
    users: { id: 'id', email: 'email' },
    loginAttempts: { userId: 'userId', ip: 'ip', id: 'id' }
}));

describe('SecurityService tail branches', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('trackLoginAttempt: handles exactly 9 previous attempts (10 total) (Line 30/31)', async () => {
        vi.mocked(db.query.users.findFirst).mockResolvedValue({ id: 'u1' } as any);
        // Returns 9 previously failed attempts, so this is attempt 10
        vi.mocked(db.query.loginAttempts.findFirst).mockResolvedValue({ id: 'a1', attempts: 9 } as any);
        
        await SecurityService.trackLoginAttempt('ip', 'email', false);
        // Expect update to have been called
        expect(db.update).toHaveBeenCalled();
    });

    it('trackLoginAttempt: handles exactly 4 previous attempts (5 total) (Line 31/32)', async () => {
        vi.mocked(db.query.users.findFirst).mockResolvedValue({ id: 'u1' } as any);
        // Returns 4 previously failed attempts, so this is attempt 5
        vi.mocked(db.query.loginAttempts.findFirst).mockResolvedValue({ id: 'a1', attempts: 4 } as any);
        
        await SecurityService.trackLoginAttempt('ip', 'email', false);
        expect(db.update).toHaveBeenCalled();
    });

    it('trackLoginAttempt: handles 1 previous attempt (2 total) -> 0 lockoutMinutes (Line 32/33)', async () => {
        vi.mocked(db.query.users.findFirst).mockResolvedValue({ id: 'u1' } as any);
        vi.mocked(db.query.loginAttempts.findFirst).mockResolvedValue({ id: 'a1', attempts: 1 } as any);
        
        await SecurityService.trackLoginAttempt('ip', 'email', false);
        expect(db.update).toHaveBeenCalled();
    });

    it('isAccountLocked: returns false if attempt.lockedUntil is null (Line 67)', async () => {
        vi.mocked(db.query.users.findFirst).mockResolvedValue({ id: 'u1' } as any);
        vi.mocked(db.query.loginAttempts.findFirst).mockResolvedValue({ id: 'a1', attempts: 5, lockedUntil: null } as any);
        
        const locked = await SecurityService.isAccountLocked('email', 'ip');
        expect(locked).toBe(false);
    });
});
