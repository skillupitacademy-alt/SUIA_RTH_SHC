import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../auth.service';
import { TokenService } from '../token.service';
import { SecurityService } from '../security.service';
import { AuditService } from '../audit.service';
import { UserRepository } from '../repositories/user.repository';
import { TokenRepository } from '../repositories/token.repository';
import { ExamRepository } from '../../exam-engine/repositories/exam.repository';
import { container } from '../../core/container';

const mockTokenService = { 
    verifyRefreshToken: vi.fn(), 
    hashToken: vi.fn().mockResolvedValue('hash') 
};
const mockUserRepo = { findByIdWithDetails: vi.fn() };
const mockTokenRepo = { findByHash: vi.fn() };
const mockExamRepo = { findActiveExam: vi.fn() };
const mockSecurityService = { trackLoginAttempt: vi.fn() };
const mockAuditService = { log: vi.fn() };

vi.mock('../token.service', () => ({ TokenService: vi.fn().mockImplementation(() => mockTokenService) }));
vi.mock('../repositories/user.repository', () => ({ UserRepository: vi.fn().mockImplementation(() => mockUserRepo) }));
vi.mock('../repositories/token.repository', () => ({ TokenRepository: vi.fn().mockImplementation(() => mockTokenRepo) }));
vi.mock('../../exam-engine/repositories/exam.repository', () => ({ ExamRepository: vi.fn().mockImplementation(() => mockExamRepo) }));
vi.mock('../security.service', () => ({ SecurityService: vi.fn().mockImplementation(() => mockSecurityService) }));
vi.mock('../audit.service', () => ({ AuditService: vi.fn().mockImplementation(() => mockAuditService) }));

// Mock jose to satisfy TokenRefreshService line 20
vi.mock('jose', () => ({
    decodeJwt: vi.fn().mockReturnValue({ userId: 'u1', isAdmin: false })
}));

describe('AuthService uncovered lines 89 & 201', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        container.reset();
        container.register(TokenService, mockTokenService as any);
        container.register(UserRepository, mockUserRepo as any);
        container.register(TokenRepository, mockTokenRepo as any);
        container.register(ExamRepository, mockExamRepo as any);
        container.register(SecurityService, mockSecurityService as any);
        container.register(AuditService, mockAuditService as any);
    });

    it('refresh: throws when user is blocked', async () => {
        mockTokenRepo.findByHash.mockResolvedValue({ userId: 'u1', expiresAt: new Date(Date.now() + 100000) } as any);
        mockTokenService.verifyRefreshToken.mockResolvedValue({ userId: 'u1', isAdmin: false });
        mockUserRepo.findByIdWithDetails.mockResolvedValue({ id: 'u1', isBlocked: true } as any);

        const service = container.get(AuthService);
        await expect(service.refresh('token')).rejects.toThrow('access_denied:user_blocked');
    });

    it('refresh: throws when user not found (line ~201)', async () => {
        mockTokenRepo.findByHash.mockResolvedValue({ userId: 'u1', expiresAt: new Date(Date.now() + 100000) } as any);
        mockTokenService.verifyRefreshToken.mockResolvedValue({ userId: 'u1', isAdmin: false });
        // Must return undefined to trigger "User not found" branch
        mockUserRepo.findByIdWithDetails.mockResolvedValue(undefined);

        const service = container.get(AuthService);
        await expect(service.refresh('token')).rejects.toThrow('User not found');
    });
});
