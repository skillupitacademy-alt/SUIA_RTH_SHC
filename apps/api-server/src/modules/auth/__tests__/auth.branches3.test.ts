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
const mockUserRepo = { findActiveUserWithRoles: vi.fn(), findByIdWithDetails: vi.fn(), updateLastActive: vi.fn(), findWithDetails: vi.fn() };
const mockTokenRepo = { consumeToken: vi.fn(), getUserSessions: vi.fn(), findByHash: vi.fn(), revokeAll: vi.fn(), revokeById: vi.fn(), createRefreshToken: vi.fn(), revokeToken: vi.fn(), touchSession: vi.fn() };
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
        mockTokenRepo.consumeToken.mockResolvedValue({ id: 'rt1' });
        mockTokenRepo.getUserSessions.mockResolvedValue([]);
        mockUserRepo.findActiveUserWithRoles.mockResolvedValue({ id: 'u1', email: 'fixture@example.invalid', roles: ['student'], isBlocked: false, deletedAt: null });
        mockTokenService.verifyRefreshToken.mockResolvedValue({ userId: 'u1', isAdmin: false });
        mockTokenRepo.findByHash.mockResolvedValue({ id: 'rt1', userId: 'u1', expiresAt: new Date(Date.now() + 100000) } as any);
        mockUserRepo.findByIdWithDetails.mockResolvedValue({ id: 'u1', email: 'e', userRoles: [], isBlocked: false } as any);
    });

    it('AuthService.refresh: a current session rotates without an exam ID', async () => {
        const { container } = await import('../../core/container');
        await container.get(AuthService).refresh('token', '1.1.1.1', undefined, 'user');
        expect(mockTokenService.verifyRefreshToken).toHaveBeenCalledWith('token', { audience: 'user' });
        expect(mockUserRepo.findActiveUserWithRoles).toHaveBeenCalledWith('u1');
        expect(mockTokenRepo.consumeToken).toHaveBeenCalledWith('hash', 'u1');
        expect(mockExamRepo.findActiveExam).not.toHaveBeenCalled();
    });

    it('AuthService.refresh: absent exam metadata cannot change rotation', async () => {
        mockExamRepo.findActiveExam.mockResolvedValue(undefined as any);
        const { container } = await import('../../core/container');
        const result = await container.get(AuthService).refresh('token', '1.1.1.1', 'exam-id', 'user');
        expect(result.accessToken).toBe('access');
        expect(mockExamRepo.findActiveExam).not.toHaveBeenCalled();
        expect(mockTokenRepo.consumeToken).toHaveBeenCalledWith('hash', 'u1');
        expect(mockTokenRepo.createRefreshToken).toHaveBeenCalledWith(expect.objectContaining({ userId: 'u1' }));
    });

    it('AuthService.refresh: zero-duration exam metadata cannot change rotation', async () => {
        mockExamRepo.findActiveExam.mockResolvedValue({ durationSeconds: 0 } as any);
        const { container } = await import('../../core/container');
        const result = await container.get(AuthService).refresh('token', '1.1.1.1', 'exam-id', 'user');
        expect(result.accessToken).toBe('access');
        expect(mockExamRepo.findActiveExam).not.toHaveBeenCalled();
        expect(mockTokenRepo.consumeToken).toHaveBeenCalledWith('hash', 'u1');
        expect(mockTokenRepo.createRefreshToken).toHaveBeenCalledWith(expect.objectContaining({ userId: 'u1' }));
    });

    it('AuthService.refresh: expired exam metadata cannot change rotation', async () => {
        const oldDate = new Date(Date.now() - 10000000);
        mockExamRepo.findActiveExam.mockResolvedValue({ durationSeconds: 60, startedAt: oldDate } as any);
        const { container } = await import('../../core/container');
        const result = await container.get(AuthService).refresh('token', '1.1.1.1', 'exam-id', 'user');
        expect(result.accessToken).toBe('access');
        expect(mockExamRepo.findActiveExam).not.toHaveBeenCalled();
        expect(mockTokenRepo.consumeToken).toHaveBeenCalledWith('hash', 'u1');
        expect(mockTokenRepo.createRefreshToken).toHaveBeenCalledWith(expect.objectContaining({ userId: 'u1' }));
    });

    it('AuthService.logout: recovers the signed owner when userId is omitted', async () => {
        const { container } = await import('../../core/container');
        await container.get(AuthService).logout('token', undefined);
        expect(mockTokenRepo.revokeToken).toHaveBeenCalled();
        expect(mockTokenRepo.getUserSessions).toHaveBeenCalledWith('u1');
        expect(mockUserRepo.updateLastActive).toHaveBeenCalledWith('u1', expect.any(Date));
    });
});
