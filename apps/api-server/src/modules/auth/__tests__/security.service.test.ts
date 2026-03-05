import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db, users, loginAttempts, refreshTokens, exams } from '@quiz/db';
import { SecurityService } from '../security.service';
import { container } from '../../core/container';

vi.mock('@quiz/db', () => ({
    db: {
        query: {
            users: { findFirst: vi.fn() },
            loginAttempts: { findFirst: vi.fn() }
        },
        update: vi.fn().mockImplementation((_table: any) => ({
            set: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis()
        }))
    },
    loginAttempts: { tableName: 'login_attempts' },
    users: { tableName: 'users' },
    refreshTokens: { tableName: 'refresh_tokens' },
    exams: { tableName: 'exams' }
}));

describe('SecurityService (Main Suite Refactor)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        container.reset();
        container.register(SecurityService, new SecurityService(db as any));
    });

    it('trackLoginAttempt: no-op if user not found', async () => {
        vi.mocked(db.query.users.findFirst).mockResolvedValue(undefined);
        const service = container.get(SecurityService);
        await service.trackLoginAttempt('ip', 'email', false);
        expect(db.update).not.toHaveBeenCalled();
    });

    it('isAccountLocked: returns true if lock is in future', async () => {
        vi.mocked(db.query.users.findFirst).mockResolvedValue({ id: 'u1' } as any);
        vi.mocked(db.query.loginAttempts.findFirst).mockResolvedValue({ lockedUntil: new Date(Date.now() + 100000) } as any);
        const service = container.get(SecurityService);
        expect(await service.isAccountLocked('e', 'i')).toBe(true);
    });
});
