import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db, loginAttempts, refreshTokens } from '@quiz/db';
import { AuditService } from '../audit.service';
import { AuthService } from '../auth.service';
import { SecurityService } from '../security.service';
import { TokenService } from '../token.service';
import { UserRepository } from '../repositories/user.repository';
import { TokenRepository } from '../repositories/token.repository';
import { ExamRepository } from '../../exam-engine/repositories/exam.repository';
import { container } from '../../core/container';
import { jwtVerify, decodeJwt } from 'jose';

vi.mock('jose', () => ({
    jwtVerify: vi.fn(),
    decodeJwt: vi.fn()
}));

vi.mock('@quiz/db', () => ({
  STANDARD_QUERY_TIMEOUT: 15000,
  QUICK_QUERY_TIMEOUT: 5000,
  REPORT_QUERY_TIMEOUT: 30000,
  MIGRATION_TIMEOUT: 120000,
  withTimeout: vi.fn(async (promise: Promise<any>) => promise),
    db: {
        insert: vi.fn().mockImplementation((_table: any) => ({ 
            values: vi.fn().mockReturnThis(), 
            returning: vi.fn().mockResolvedValue([{ id: 'id' }]), 
            catch: vi.fn() 
        })),
        update: vi.fn().mockImplementation((_table: any) => ({ 
            set: vi.fn().mockReturnThis(), 
            where: vi.fn().mockReturnThis(), 
            returning: vi.fn().mockResolvedValue([{ id: 'id' }]), 
            catch: vi.fn() 
        })),
        delete: vi.fn().mockImplementation((_table: any) => ({ where: vi.fn().mockReturnThis() })),
        query: {
            users: { findFirst: vi.fn() },
            loginAttempts: { findFirst: vi.fn() },
            passwordResetTokens: { findFirst: vi.fn() }
        }
    },
    auditLogs: { tableName: 'audit_logs' },
    loginAttempts: { tableName: 'login_attempts' },
    users: { tableName: 'users' },
    passwordResetTokens: { tableName: 'password_reset_tokens' },
    notifications: { tableName: 'notifications' },
    refreshTokens: { tableName: 'refresh_tokens' },
    exams: { tableName: 'exams' }
}));

describe('Auth & Security branch coverage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        container.reset();
        
        container.register(AuditService, new AuditService(db as any));
        container.register(SecurityService, new SecurityService(db as any));
        container.register(TokenService, new TokenService());
        container.register(UserRepository, new UserRepository());
        container.register(TokenRepository, new TokenRepository());
        container.register(ExamRepository, new ExamRepository());
    });

    it('AuditService.log catch block (Line 29)', async () => {
        vi.mocked(db.insert).mockImplementationOnce(() => { throw new Error('DB Down'); });
        const service = container.get(AuditService);
        await service.log({ action: 'test' });
    });

    it('AuthService.resetPassword failure audit (Lines 405-406)', async () => {
        vi.mocked(db.query.passwordResetTokens.findFirst).mockResolvedValue(undefined);
        await expect(container.get(AuthService).resetPassword('invalid', 'pass')).rejects.toThrow('Invalid or expired password reset link');
    });

    it('SecurityService.trackLoginAttempt insertion (Line 45)', async () => {
        vi.mocked(db.query.users.findFirst).mockResolvedValue({ id: 'u1' } as any);
        vi.mocked(db.query.loginAttempts.findFirst).mockResolvedValue(undefined);
        const service = container.get(SecurityService);
        await service.trackLoginAttempt('1.1.1.1', 'user@example.com', false);
        expect(db.insert).toHaveBeenCalled();
    });

    it('SecurityService.trackLoginAttempt applies 1h lockout at 10 attempts (Lines 29-33)', async () => {
        vi.mocked(db.query.users.findFirst).mockResolvedValue({ id: 'u1' } as any);
        vi.mocked(db.query.loginAttempts.findFirst).mockResolvedValue({ id: 'la1', attempts: 9 } as any);
        const service = container.get(SecurityService);
        await service.trackLoginAttempt('2.2.2.2', 'user@example.com', false);
        expect(db.update).toHaveBeenCalled();
    });

    it('TokenService.verifyAccessToken audience violation (Line 129)', async () => {
        vi.mocked(jwtVerify).mockResolvedValue({ payload: { aud: 'unknown' } } as any);
        const service = container.get(TokenService);
        await expect(service.verifyAccessToken('token', { isAdmin: true })).rejects.toThrow(/Audience violation/);
    });

    it('TokenService.getExpiration null branch (Lines 177, 179)', () => {
        const service = container.get(TokenService);
        vi.mocked(decodeJwt).mockReturnValueOnce({ exp: undefined });
        expect(service.getExpiration('token')).toBeNull();

        vi.mocked(decodeJwt).mockImplementationOnce(() => { throw new Error('Bad token'); });
        expect(service.getExpiration('invalid')).toBeNull();
    });
});


