import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db, users, loginAttempts, refreshTokens, exams } from '@quiz/db';
import { AuthService } from '../auth.service';
import { AuditService } from '../audit.service';
import { SecurityService } from '../security.service';
import { TokenService } from '../token.service';
import { UserRepository } from '../repositories/user.repository';
import { TokenRepository } from '../repositories/token.repository';
import { ExamRepository } from '../../exam-engine/repositories/exam.repository';
import { container } from '../../core/container';

vi.mock('@quiz/db', () => ({
  STANDARD_QUERY_TIMEOUT: 15000,
  QUICK_QUERY_TIMEOUT: 5000,
  REPORT_QUERY_TIMEOUT: 30000,
  MIGRATION_TIMEOUT: 120000,
  withTimeout: vi.fn(async (promise: Promise<any>) => promise),
    db: {
        update: vi.fn().mockImplementation(() => ({
            set: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            returning: vi.fn().mockResolvedValue([{ id: 'id' }])
        })),
        query: {
            refreshTokens: { findFirst: vi.fn() },
            users: { findFirst: vi.fn() }
        }
    },
    loginAttempts: { tableName: 'login_attempts' },
    refreshTokens: { tableName: 'refresh_tokens' },
    exams: { tableName: 'exams' },
    users: { tableName: 'users' }
}));

describe('AuthService edge branches', () => {
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

    it('logout no-ops when session not found (405-406)', async () => {
        const service = container.get(AuthService);
        await expect(service.logout('token', 'u1')).resolves.not.toThrow();
    });
});


