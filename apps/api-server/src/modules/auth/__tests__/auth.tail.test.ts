import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db, userRoles } from '@quiz/db';
import { AuthService } from '../auth.service';
import { AuditService } from '../audit.service';
import { SecurityService } from '../security.service';
import { PasswordService } from '../password.service';
import { TokenService } from '../token.service';

vi.mock('@quiz/db', () => ({
    db: {
        query: {
            users: { findFirst: vi.fn() as any },
            roles: { findFirst: vi.fn() as any },
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
    userRoles: { userId: 'userRoles.userId', roleId: 'userRoles.roleId' },
    refreshTokens: { id: 'rt.id', token: 'token', revoked: 'revoked', userId: 'userId' },
    userProfiles: {},
    auditLogs: {},
    exams: { id: 'exams.id', userId: 'exams.userId', status: 'exams.status' }
}));

vi.mock('../security.service', () => ({
    SecurityService: {
        isAccountLocked: vi.fn().mockResolvedValue(false),
        trackLoginAttempt: vi.fn().mockResolvedValue(undefined)
    }
}));

vi.mock('../password.service', () => ({
    PasswordService: {
        hash: vi.fn().mockResolvedValue('hashed'),
        compare: vi.fn().mockResolvedValue(true)
    }
}));

vi.mock('../token.service', () => ({
    TokenService: {
        generateAccessToken: vi.fn().mockResolvedValue('access'),
        generateRefreshToken: vi.fn().mockResolvedValue('refresh'),
        hashToken: vi.fn().mockResolvedValue('hash'),
        verifyRefreshToken: vi.fn().mockResolvedValue({ userId: 'u1' })
    }
}));

// Mock logger to avoid noisy output during catch block tests
vi.mock('@/lib/logger', () => ({
    logger: {
        child: () => ({
            error: vi.fn(),
            info: vi.fn(),
            debug: vi.fn()
        })
    }
}));

vi.mock('jose', () => ({
    decodeJwt: vi.fn().mockReturnValue({ isAdmin: true, userId: 'u1' })
}));

describe('Auth / Audit Tail Coverage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('AuditService: log catches non-Error objects (Line 29)', async () => {
        // Force db.insert to throw a primitive string
        vi.mocked(db.insert).mockImplementationOnce(() => { throw 'String Error'; });
        await expect(AuditService.log({ action: 'test' })).resolves.not.toThrow();
    });

    it('AuthService.signup: skips inserting userRole if undefined (Line 42)', async () => {
        vi.mocked(db.query.roles.findFirst).mockResolvedValue(undefined);
        const user = await AuthService.signup('test@test.com', 'pwd', 'Name');
        expect(user.id).toBe('u1');
        // The mock for db.insert should not be called with the userRoles table object
        expect(db.insert).not.toHaveBeenCalledWith(userRoles); 
    });

    it('AuthService.login: evaluates SUPER_ADMIN and INFRASTRUCTURE for isAdmin (Line 89)', async () => {
        vi.mocked(db.query.users.findFirst).mockResolvedValue({
            id: 'u1',
            email: 'admin@test.com',
            passwordHash: 'hashed',
            isBlocked: false,
            userRoles: [
                { role: { name: 'SUPER_ADMIN' } },
                { role: { name: 'INFRASTRUCTURE' } }
            ]
        } as any);

        const result = await AuthService.login('admin@test.com', 'pwd');
        expect(result.isAdmin).toBe(true);
        expect(TokenService.generateAccessToken).toHaveBeenCalledWith(
            expect.objectContaining({ isAdmin: true })
        );
    });

    it('AuthService.refresh: throws if _usersWithRoles length is 0 (Line 159)', async () => {
        vi.mocked(db.query.refreshTokens.findFirst).mockResolvedValue({ id: 'rt1', expiresAt: new Date(Date.now() + 100000) } as any);
        (db as any).where.mockResolvedValue([]); // Returns empty array via the mock chain
        await expect(AuthService.refresh('token')).rejects.toThrow('User not found');
    });

    it('AuthService.refresh: handles exam grace window logic (Lines 179-207)', async () => {
        vi.mocked(db.query.refreshTokens.findFirst).mockResolvedValue({ id: 'rt1', expiresAt: new Date(Date.now() + 100000) } as any);
        (db as any).where.mockResolvedValue([{ id: 'u1', email: 'e', roleName: 'USER', isBlocked: false }]);
        
        // Mock an active exam
        const startedAt = new Date(Date.now() - 10000); // started 10 seconds ago
        vi.mocked(db.query.exams.findFirst).mockResolvedValue({
            durationSeconds: 3600,
            startedAt
        } as any);

        const result = await AuthService.refresh('token', '1.1.1.1', 'exam-id', 'user');
        expect(result.accessToken).toBe('access');
        
        // Check customExpiration was passed
        expect(TokenService.generateAccessToken).toHaveBeenCalledWith(
            expect.objectContaining({ userId: 'u1' }),
            expect.any(Number) // customExpiration
        );
    });

    it('AuthService.refresh: avoids setting customExpiration if remaining duration is negative (Lines ~194)', async () => {
        vi.mocked(db.query.refreshTokens.findFirst).mockResolvedValue({ id: 'rt1', expiresAt: new Date(Date.now() + 100000) } as any);
        (db as any).where.mockResolvedValue([{ id: 'u1', email: 'e', roleName: 'USER', isBlocked: false }]);
        
        // Mock an exam that ended long ago
        const startedAt = new Date(Date.now() - 10 * 3600 * 1000); 
        vi.mocked(db.query.exams.findFirst).mockResolvedValue({
            durationSeconds: 3600,
            startedAt
        } as any);

        await AuthService.refresh('token', '1.1.1.1', 'exam-id', 'user');
        
        // Should use standard expiration (undefined custom expiration)
        expect(TokenService.generateAccessToken).toHaveBeenCalledWith(
            expect.objectContaining({ userId: 'u1' }),
            undefined
        );
    });

    it('AuthService.logout: forces offline status if userId is provided (Lines 243-247)', async () => {
        await AuthService.logout('token', 'u1');
        expect(db.update).toHaveBeenCalledTimes(2); // once for refreshTokens, once for users.lastActiveAt
    });
});
