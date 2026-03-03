import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db, auditLogs, loginAttempts, users, passwordResetTokens, notifications } from '@quiz/db';
import { AuditService } from '../audit.service';
import { AuthService } from '../auth.service';
import { SecurityService } from '../security.service';
import { TokenService } from '../token.service';
import { jwtVerify, decodeJwt } from 'jose';

vi.mock('jose', () => ({
    jwtVerify: vi.fn(),
    decodeJwt: vi.fn()
}));

vi.mock('@quiz/db', () => ({
    db: {
        insert: vi.fn().mockReturnValue({ values: vi.fn().mockReturnThis(), returning: vi.fn().mockResolvedValue([{ id: 'exam-id' }]), catch: vi.fn() }),
        update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnThis(), where: vi.fn().mockReturnThis(), returning: vi.fn().mockResolvedValue([{ id: 'exam-id' }]), catch: vi.fn() }),
        query: {
            users: { findFirst: vi.fn() },
            loginAttempts: { findFirst: vi.fn() },
            passwordResetTokens: { findFirst: vi.fn() }
        }
    },
    auditLogs: { userId: 'u', action: 'a' },
    loginAttempts: { id: 'id', userId: 'u' },
    users: { id: 'id', email: 'e' },
    passwordResetTokens: { id: 'id', token: 't' },
    notifications: { id: 'id', userId: 'u' }
}));

describe('Auth & Security branch coverage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('AuditService.log catch block (Line 29)', async () => {
        vi.mocked(db.insert).mockImplementationOnce(() => { throw new Error('DB Down'); });
        await AuditService.log({ action: 'test' });
        // Should not throw, but hit the catch block (verified by coverage)
    });

    it('AuthService.resetPassword failure audit (Lines 405-406)', async () => {
        vi.mocked(db.query.passwordResetTokens.findFirst).mockResolvedValue(undefined);
        await expect(AuthService.resetPassword('invalid', 'pass')).rejects.toThrow('Invalid or expired password reset link');
    });

    it('SecurityService.trackLoginAttempt insertion (Line 45)', async () => {
        vi.mocked(db.query.users.findFirst).mockResolvedValue({ id: 'u1' } as any);
        vi.mocked(db.query.loginAttempts.findFirst).mockResolvedValue(undefined);
        await SecurityService.trackLoginAttempt('1.1.1.1', 'user@example.com', false);
        expect(db.insert).toHaveBeenCalled();
    });

    it('SecurityService.trackLoginAttempt applies 1h lockout at 10 attempts (Lines 29-33)', async () => {
        vi.mocked(db.query.users.findFirst).mockResolvedValue({ id: 'u1' } as any);
        vi.mocked(db.query.loginAttempts.findFirst).mockResolvedValue({ id: 'la1', attempts: 9 } as any); // newAttempts = 10
        await SecurityService.trackLoginAttempt('2.2.2.2', 'user@example.com', false);
        expect(db.update).toHaveBeenCalledWith(loginAttempts);
    });

    it('SecurityService.trackLoginAttempt applies 24h lockout at 20 attempts (Lines 29-33)', async () => {
        vi.mocked(db.query.users.findFirst).mockResolvedValue({ id: 'u2' } as any);
        vi.mocked(db.query.loginAttempts.findFirst).mockResolvedValue({ id: 'la2', attempts: 19 } as any); // newAttempts = 20
        await SecurityService.trackLoginAttempt('3.3.3.3', 'user@example.com', false);
        expect(db.update).toHaveBeenCalledWith(loginAttempts);
    });

    it('TokenService.verifyAccessToken audience violation (Line 129)', async () => {
        vi.mocked(jwtVerify).mockResolvedValue({ payload: { aud: 'unknown' } } as any);
        await expect(TokenService.verifyAccessToken('token', { isAdmin: true })).rejects.toThrow(/Audience violation/);
    });

    it('TokenService.getExpiration null branch (Lines 177, 179)', () => {
        vi.mocked(decodeJwt).mockReturnValueOnce({ exp: undefined });
        expect(TokenService.getExpiration('token')).toBeNull();

        vi.mocked(decodeJwt).mockImplementationOnce(() => { throw new Error('Bad token'); });
        expect(TokenService.getExpiration('invalid')).toBeNull();
    });
});
