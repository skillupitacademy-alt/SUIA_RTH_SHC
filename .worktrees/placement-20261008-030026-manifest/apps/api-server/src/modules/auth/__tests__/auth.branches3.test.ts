import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../auth.service';
import { TokenService } from '../token.service';
import { AuditService } from '../audit.service';
import { SecurityService } from '../security.service';
import { PasswordService } from '../password.service';
import { UserRepository } from '../repositories/user.repository';
import { TokenRepository } from '../repositories/token.repository';
import { ExamRepository } from '../../exam-engine/repositories/exam.repository';

// Standard mock instances
const mockTokenService = {
    generateAccessToken: vi.fn(),
    generateRefreshToken: vi.fn(),
    hashToken: vi.fn(),
    verifyRefreshToken: vi.fn(),
    verifyAccessToken: vi.fn(),
    getExpiration: vi.fn(),
};

const mockAuditService = { log: vi.fn() };
const mockSecurityService = { isAccountLocked: vi.fn(), trackLoginAttempt: vi.fn() };
const mockPasswordService = { compare: vi.fn(), hash: vi.fn() };
const mockUserRepo = { findByIdWithDetails: vi.fn(), updateLastActive: vi.fn(), findWithDetails: vi.fn() };
const mockTokenRepo = { findByHash: vi.fn(), revokeAll: vi.fn(), revokeById: vi.fn(), createRefreshToken: vi.fn(), revokeToken: vi.fn(), touchSession: vi.fn() };
const mockExamRepo = { findActiveExam: vi.fn() };

vi.mock('../token.service', () => ({ TokenService: vi.fn().mockImplementation(() => mockTokenService) }));
vi.mock('../audit.service', () => ({ AuditService: vi.fn().mockImplementation(() => mockAuditService) }));
vi.mock('../security.service', () => ({ SecurityService: vi.fn().mockImplementation(() => mockSecurityService) }));
vi.mock('../password.service', () => ({ PasswordService: vi.fn().mockImplementation(() => mockPasswordService) }));
vi.mock('../repositories/user.repository', () => ({ UserRepository: vi.fn().mockImplementation(() => mockUserRepo) }));
vi.mock('../repositories/token.repository', () => ({ TokenRepository: vi.fn().mockImplementation(() => mockTokenRepo) }));
vi.mock('../../exam-engine/repositories/exam.repository', () => ({ ExamRepository: vi.fn().mockImplementation(() => mockExamRepo) }));

vi.mock('jose', () => ({
    decodeJwt: vi.fn().mockReturnValue({ isAdmin: false, userId: 'u1' })
}));

describe('AuthService missing false-branches', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        const { container } = await import('../../core/container');
        container.reset();
        
        container.register(TokenService, mockTokenService as any);
        container.register(AuditService, mockAuditService as any);
        container.register(SecurityService, mockSecurityService as any);
        container.register(PasswordService, mockPasswordService as any);
        container.register(UserRepository, mockUserRepo as any);
        container.register(TokenRepository, mockTokenRepo as any);
        container.register(ExamRepository, mockExamRepo as any);

        mockTokenService.generateAccessToken.mockResolvedValue('access');
        mockTokenService.generateRefreshToken.mockResolvedValue('refresh');
        mockTokenService.hashToken.mockResolvedValue('hash');
        mockTokenService.verifyRefreshToken.mockResolvedValue({ userId: 'u1', isAdmin: false });
        mockTokenRepo.findByHash.mockResolvedValue({ id: 'rt1', expiresAt: new Date(Date.now() + 100000) } as any);
        mockUserRepo.findByIdWithDetails.mockResolvedValue({ id: 'u1', email: 'e', userRoles: [], isBlocked: false } as any);
    });

    it('AuthService.refresh: examId is undefined (Line 180 skip)', async () => {
        const { container } = await import('../../core/container');
        await container.get(AuthService).refresh('token', '1.1.1.1', undefined, 'user');
        expect(mockTokenService.verifyRefreshToken).toHaveBeenCalled();
        expect(mockExamRepo.findActiveExam).not.toHaveBeenCalled();
    });

    it('AuthService.refresh: activeExam is undefined (Line 188 skip)', async () => {
        mockExamRepo.findActiveExam.mockResolvedValue(undefined as any);
        const { container } = await import('../../core/container');
        await container.get(AuthService).refresh('token', '1.1.1.1', 'exam-id', 'user');
    });

    it('AuthService.refresh: activeExam duration is 0 (Line 188 skip)', async () => {
        mockExamRepo.findActiveExam.mockResolvedValue({ durationSeconds: 0 } as any);
        const { container } = await import('../../core/container');
        await container.get(AuthService).refresh('token', '1.1.1.1', 'exam-id', 'user');
    });

    it('AuthService.refresh: activeExam remaining time is negative (Line 194 skip)', async () => {
        const oldDate = new Date(Date.now() - 10000000);
        mockExamRepo.findActiveExam.mockResolvedValue({ durationSeconds: 60, startedAt: oldDate } as any);
        const { container } = await import('../../core/container');
        await container.get(AuthService).refresh('token', '1.1.1.1', 'exam-id', 'user');
    });

    it('AuthService.logout: userId is undefined (Line 243 skip)', async () => {
        const { container } = await import('../../core/container');
        await container.get(AuthService).logout('token', undefined);
        expect(mockTokenRepo.revokeToken).toHaveBeenCalled();
        expect(mockUserRepo.updateLastActive).not.toHaveBeenCalled();
    });
});
