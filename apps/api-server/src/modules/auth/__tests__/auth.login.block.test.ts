import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../auth.service';
import { SecurityService } from '../security.service';
import { TokenService } from '../token.service';
import { AuditService } from '../audit.service';
import { PasswordService } from '../password.service';
import { UserRepository } from '../repositories/user.repository';
import { TokenRepository } from '../repositories/token.repository';
import { ExamRepository } from '../../exam-engine/repositories/exam.repository';
import { container } from '../../core/container';

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
const mockUserRepo = { 
  findWithDetails: vi.fn(),
  findByIdWithDetails: vi.fn()
};
const mockTokenRepo = { revokeToken: vi.fn() };
const mockExamRepo = { findActiveExam: vi.fn() };

vi.mock('../token.service', () => ({ TokenService: vi.fn().mockImplementation(() => mockTokenService) }));
vi.mock('../audit.service', () => ({ AuditService: vi.fn().mockImplementation(() => mockAuditService) }));
vi.mock('../security.service', () => ({ SecurityService: vi.fn().mockImplementation(() => mockSecurityService) }));
vi.mock('../password.service', () => ({ PasswordService: vi.fn().mockImplementation(() => mockPasswordService) }));
vi.mock('../repositories/user.repository', () => ({ UserRepository: vi.fn().mockImplementation(() => mockUserRepo) }));
vi.mock('../repositories/token.repository', () => ({ TokenRepository: vi.fn().mockImplementation(() => mockTokenRepo) }));
vi.mock('../../exam-engine/repositories/exam.repository', () => ({ ExamRepository: vi.fn().mockImplementation(() => mockExamRepo) }));

describe('AuthService login edge branches', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        container.reset();
        
        container.register(TokenService, mockTokenService as any);
        container.register(AuditService, mockAuditService as any);
        container.register(SecurityService, mockSecurityService as any);
        container.register(PasswordService, mockPasswordService as any);
        container.register(UserRepository, mockUserRepo as any);
        container.register(TokenRepository, mockTokenRepo as any);
        container.register(ExamRepository, mockExamRepo as any);
    });

  it('throws for blocked user', async () => {
    mockSecurityService.isAccountLocked.mockResolvedValue(false);
    mockUserRepo.findWithDetails.mockResolvedValue({ id: 'u1', passwordHash: 'h', isBlocked: true } as any);
    mockPasswordService.compare.mockResolvedValue(true);

    const service = container.get(AuthService);
    await expect(service.login('t@t.com', 'pw')).rejects.toThrow('Account has been blocked');
  });
});
