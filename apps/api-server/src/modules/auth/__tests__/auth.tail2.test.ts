import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@quiz/db';
import { AuthService } from '../auth.service';

vi.mock('@quiz/db', () => ({
    db: {
        query: {
            users: { findFirst: vi.fn() as any },
            refreshTokens: { findFirst: vi.fn() as any },
            exams: { findFirst: vi.fn() as any },
        },
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn(),
        update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn() }) }),
        insert: vi.fn().mockReturnValue({ values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: 'u1' }]) }) }),
    },
    users: { id: 'users.id', email: 'users.email', passwordHash: 'passwordHash', isBlocked: 'isBlocked', lastActiveAt: 'lastActiveAt' },
    roles: { id: 'roles.id', name: 'roles.name' },
    userRoles: { userId: 'userId', roleId: 'roleId' },
    refreshTokens: { id: 'rt.id', token: 'token', revoked: 'revoked', userId: 'userId' },
    exams: { id: 'exams.id', userId: 'exams.userId', status: 'exams.status' }
}));

vi.mock('../security.service', () => ({
    SecurityService: { 
        trackLoginAttempt: vi.fn(),
        isAccountLocked: vi.fn().mockResolvedValue(false)
    }
}));

vi.mock('../audit.service', () => ({
    AuditService: { log: vi.fn() }
}));

vi.mock('../token.service', () => ({
    TokenService: {
        generateAccessToken: vi.fn().mockResolvedValue('access'),
        generateRefreshToken: vi.fn().mockResolvedValue('refresh'),
        hashToken: vi.fn().mockResolvedValue('hash'),
        verifyRefreshToken: vi.fn().mockResolvedValue({ userId: 'u1' })
    }
}));

vi.mock('../password.service', () => ({
    PasswordService: { compare: vi.fn().mockResolvedValue(true) }
}));

vi.mock('jose', () => ({
    decodeJwt: vi.fn().mockReturnValue({ isAdmin: false, userId: 'u1' })
}));

describe('AuthService extreme tail 2', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('login: evaluates ADMIN explicitly for isAdmin (Line 89)', async () => {
        vi.mocked(db.query.users.findFirst).mockResolvedValue({
            id: 'u1', email: 'admin@test.com', passwordHash: 'hashed', isBlocked: false,
            userRoles: [{ role: { name: 'ADMIN' } }]
        } as any);

        const result = await AuthService.login('e', 'p');
        expect(result.isAdmin).toBe(true);
    });

    it('login: evaluates SUPER_ADMIN explicitly for isAdmin (Line 89)', async () => {
        vi.mocked(db.query.users.findFirst).mockResolvedValue({
            id: 'u1', email: 'admin@test.com', passwordHash: 'hashed', isBlocked: false,
            userRoles: [{ role: { name: 'SUPER_ADMIN' } }]
        } as any);

        const result = await AuthService.login('e', 'p');
        expect(result.isAdmin).toBe(true);
    });

    it('login: evaluates INFRASTRUCTURE explicitly for isAdmin (Line 89)', async () => {
        vi.mocked(db.query.users.findFirst).mockResolvedValue({
            id: 'u1', email: 'admin@test.com', passwordHash: 'hashed', isBlocked: false,
            userRoles: [{ role: { name: 'INFRASTRUCTURE' } }]
        } as any);

        const result = await AuthService.login('e', 'p');
        expect(result.isAdmin).toBe(true);
    });

    it('refresh: customExpiration < standardExpireS && we are inside the grace period (Line 201)', async () => {
        // Condition A True, Condition B False
        vi.mocked(db.query.refreshTokens.findFirst).mockResolvedValue({ id: 'rt1', expiresAt: new Date(Date.now() + 100000) } as any);
        (db as any).where = vi.fn().mockResolvedValue([{ id: 'u1', email: 'e', roleName: 'USER', isBlocked: false }]);
        
        const startedAt = new Date(Date.now() - (3600 * 1000) - 10000); 
        vi.mocked(db.query.exams.findFirst).mockResolvedValue({ durationSeconds: 3600, startedAt } as any);
        
        await AuthService.refresh('token', '1.1.1.1', 'exam-id', 'user');
        expect(db.query.exams.findFirst).toHaveBeenCalled();
    });

    it('refresh: customExpiration < standardExpireS && we are inside exam time (Line 201)', async () => {
        // Condition A True, Condition B True
        vi.mocked(db.query.refreshTokens.findFirst).mockResolvedValue({ id: 'rt1', expiresAt: new Date(Date.now() + 100000) } as any);
        (db as any).where = vi.fn().mockResolvedValue([{ id: 'u1', email: 'e', roleName: 'USER', isBlocked: false }]);
        
        // Duration 10 mins (600s). Started 1 minute ago.
        // remaining = (60s + 600s + 300s) = wait, started 60s ago. 
        // total duration with grace = 600 + 300 = 900s.
        // remaining time = 900s - 60s = 840s.
        // 840s < 900s (standard 15m), so A is True.
        // startedAt + duration = (now - 60) + 600 = now + 540 > now. so B is True.
        const startedAt = new Date(Date.now() - (60 * 1000)); 
        vi.mocked(db.query.exams.findFirst).mockResolvedValue({ durationSeconds: 600, startedAt } as any);
        
        await AuthService.refresh('token', '1.1.1.1', 'exam-id', 'user');
        expect(db.query.exams.findFirst).toHaveBeenCalled();
    });

    it('refresh: customExpiration >= standardExpireS (Line 201)', async () => {
        // Condition A False
        vi.mocked(db.query.refreshTokens.findFirst).mockResolvedValue({ id: 'rt1', expiresAt: new Date(Date.now() + 100000) } as any);
        (db as any).where = vi.fn().mockResolvedValue([{ id: 'u1', email: 'e', roleName: 'USER', isBlocked: false }]);
        
        // Duration 2 hours (7200s). Started 1 minute ago.
        // remaining time = 7200 + 300 - 60 = 7440s.
        // 7440 >= 900s. A is False. B is skipped.
        const startedAt = new Date(Date.now() - (60 * 1000)); 
        vi.mocked(db.query.exams.findFirst).mockResolvedValue({ durationSeconds: 7200, startedAt } as any);
        
        await AuthService.refresh('token', '1.1.1.1', 'exam-id', 'user');
        expect(db.query.exams.findFirst).toHaveBeenCalled();
    });
});
