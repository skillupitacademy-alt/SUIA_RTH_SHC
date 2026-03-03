import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@quiz/db';
import { AuthService } from '../auth.service';

vi.mock('@quiz/db', () => ({
    db: {
        query: {
            users: { findFirst: vi.fn() as any },
            roles: { findFirst: vi.fn() as any },
            refreshTokens: { findFirst: vi.fn() as any },
            exams: { findFirst: vi.fn() as any },
        },
        select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnThis(),
            leftJoin: vi.fn().mockReturnThis(),
            where: vi.fn().mockResolvedValue([{ id: 'u1', email: 'e', roleName: 'USER', isBlocked: false }]),
        }),
        update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn() }) }),
        insert: vi.fn().mockReturnValue({ values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: 'u1' }]) }) }),
    },
    users: { id: 'users.id', email: 'users.email', passwordHash: 'passwordHash', isBlocked: 'isBlocked', lastActiveAt: 'lastActiveAt' },
    roles: { id: 'roles.id', name: 'roles.name' },
    refreshTokens: { id: 'rt.id', token: 'token', revoked: 'revoked', userId: 'userId' },
    userRoles: {},
    exams: { id: 'exams.id', userId: 'exams.userId', status: 'exams.status' }
}));

vi.mock('../token.service', () => ({
    TokenService: {
        generateAccessToken: vi.fn().mockResolvedValue('access'),
        generateRefreshToken: vi.fn().mockResolvedValue('refresh'),
        hashToken: vi.fn().mockResolvedValue('hash'),
        verifyRefreshToken: vi.fn().mockResolvedValue({ userId: 'u1' })
    }
}));

vi.mock('jose', () => ({
    decodeJwt: vi.fn().mockReturnValue({ isAdmin: false, userId: 'u1' })
}));

describe('AuthService missing false-branches', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('AuthService.refresh: examId is undefined (Line 180 skip)', async () => {
        vi.mocked(db.query.refreshTokens.findFirst).mockResolvedValue({ id: 'rt1', expiresAt: new Date(Date.now() + 100000) } as any);
        (db as any).where = vi.fn().mockResolvedValue([{ id: 'u1', email: 'e', roleName: 'USER', isBlocked: false }]);
        
        await AuthService.refresh('token', '1.1.1.1', undefined, 'user');
        // db.query.exams.findFirst should not be called
        expect(db.query.exams.findFirst).not.toHaveBeenCalled();
    });

    it('AuthService.refresh: activeExam is undefined (Line 188 skip)', async () => {
        vi.mocked(db.query.refreshTokens.findFirst).mockResolvedValue({ id: 'rt1', expiresAt: new Date(Date.now() + 100000) } as any);
        (db as any).where = vi.fn().mockResolvedValue([{ id: 'u1', email: 'e', roleName: 'USER', isBlocked: false }]);
        vi.mocked(db.query.exams.findFirst).mockResolvedValue(undefined as any);
        
        await AuthService.refresh('token', '1.1.1.1', 'exam-id', 'user');
    });

    it('AuthService.refresh: activeExam duration is 0 (Line 188 skip)', async () => {
        vi.mocked(db.query.refreshTokens.findFirst).mockResolvedValue({ id: 'rt1', expiresAt: new Date(Date.now() + 100000) } as any);
        (db as any).where = vi.fn().mockResolvedValue([{ id: 'u1', email: 'e', roleName: 'USER', isBlocked: false }]);
        vi.mocked(db.query.exams.findFirst).mockResolvedValue({ durationSeconds: 0 } as any);
        
        await AuthService.refresh('token', '1.1.1.1', 'exam-id', 'user');
    });

    it('AuthService.refresh: activeExam remaining time is negative (Line 194 skip)', async () => {
        vi.mocked(db.query.refreshTokens.findFirst).mockResolvedValue({ id: 'rt1', expiresAt: new Date(Date.now() + 100000) } as any);
        (db as any).where = vi.fn().mockResolvedValue([{ id: 'u1', email: 'e', roleName: 'USER', isBlocked: false }]);
        const oldDate = new Date(Date.now() - 10000000);
        vi.mocked(db.query.exams.findFirst).mockResolvedValue({ durationSeconds: 60, startedAt: oldDate } as any);
        
        await AuthService.refresh('token', '1.1.1.1', 'exam-id', 'user');
    });

    it('AuthService.logout: userId is undefined (Line 243 skip)', async () => {
        await AuthService.logout('token', undefined);
        expect(db.update).toHaveBeenCalledTimes(1); // Only for refreshTokens, not users
    });
});
