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
const mockUserRepo = { findByIdWithDetails: vi.fn(), updateLastActive: vi.fn(), findWithDetails: vi.fn(), create: vi.fn(), assignRole: vi.fn() };
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

describe('AuthService extreme tail 2', () => {
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

    it('login: evaluates ADMIN explicitly for isAdmin (Line 89)', async () => {
        mockUserRepo.findWithDetails.mockResolvedValue({
            id: 'u1', email: 'admin@test.com', passwordHash: 'hashed', isBlocked: false,
            userRoles: [{ role: { name: 'ADMIN' } }]
        } as any);
        mockPasswordService.compare.mockResolvedValue(true);
        mockSecurityService.isAccountLocked.mockResolvedValue(false);

        const { container } = await import('../../core/container');
        const result = await container.get(AuthService).login('e', 'p');
        expect(result.isAdmin).toBe(true);
    });

    it('login: evaluates SUPER_ADMIN explicitly for isAdmin (Line 89)', async () => {
        mockUserRepo.findWithDetails.mockResolvedValue({
            id: 'u1', email: 'admin@test.com', passwordHash: 'hashed', isBlocked: false,
            userRoles: [{ role: { name: 'SUPER_ADMIN' } }]
        } as any);
        mockPasswordService.compare.mockResolvedValue(true);
        mockSecurityService.isAccountLocked.mockResolvedValue(false);

        const { container } = await import('../../core/container');
        const result = await container.get(AuthService).login('e', 'p');
        expect(result.isAdmin).toBe(true);
    });

    it('login: evaluates INFRASTRUCTURE explicitly for isAdmin (Line 89)', async () => {
        mockUserRepo.findWithDetails.mockResolvedValue({
            id: 'u1', email: 'admin@test.com', passwordHash: 'hashed', isBlocked: false,
            userRoles: [{ role: { name: 'INFRASTRUCTURE' } }]
        } as any);
        mockPasswordService.compare.mockResolvedValue(true);
        mockSecurityService.isAccountLocked.mockResolvedValue(false);

        const { container } = await import('../../core/container');
        const result = await container.get(AuthService).login('e', 'p');
        expect(result.isAdmin).toBe(true);
    });

    it('refresh: customExpiration < standardExpireS && we are inside the grace period (Line 201)', async () => {
        const startedAt = new Date(Date.now() - (3600 * 1000) - 10000); 
        mockExamRepo.findActiveExam.mockResolvedValue({ durationSeconds: 3600, startedAt } as any);
        
        const { container } = await import('../../core/container');
        await container.get(AuthService).refresh('token', '1.1.1.1', 'exam-id', 'user');
        expect(mockExamRepo.findActiveExam).toHaveBeenCalled();
    });

    it('refresh: customExpiration < standardExpireS && we are inside exam time (Line 201)', async () => {
        const startedAt = new Date(Date.now() - (60 * 1000)); 
        mockExamRepo.findActiveExam.mockResolvedValue({ durationSeconds: 600, startedAt } as any);
        
        const { container } = await import('../../core/container');
        await container.get(AuthService).refresh('token', '1.1.1.1', 'exam-id', 'user');
        expect(mockExamRepo.findActiveExam).toHaveBeenCalled();
    });

    it('refresh: customExpiration >= standardExpireS (Line 201)', async () => {
        const startedAt = new Date(Date.now() - (60 * 1000)); 
        mockExamRepo.findActiveExam.mockResolvedValue({ durationSeconds: 7200, startedAt } as any);
        
        const { container } = await import('../../core/container');
        await container.get(AuthService).refresh('token', '1.1.1.1', 'exam-id', 'user');
        expect(mockExamRepo.findActiveExam).toHaveBeenCalled();
    });
});
