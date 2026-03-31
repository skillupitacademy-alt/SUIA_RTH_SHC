import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../auth.service';
import { AuditService } from '../audit.service';
import { TokenService } from '../token.service';
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
const mockUserRepo = { findByIdWithDetails: vi.fn(), updateLastActive: vi.fn(), findWithDetails: vi.fn(), create: vi.fn(), assignRole: vi.fn(), findByEmail: vi.fn(), createToken: vi.fn(), findById: vi.fn(), verifyEmail: vi.fn(), deleteToken: vi.fn() };
const mockTokenRepo = { findByHash: vi.fn(), revokeAll: vi.fn(), revokeById: vi.fn(), createRefreshToken: vi.fn(), revokeToken: vi.fn() };
const mockExamRepo = { findActiveExam: vi.fn() };

// Manual mock for db to test AuditService internal logic
const mockDb = {
    insert: vi.fn().mockReturnValue({ values: vi.fn().mockReturnThis() }),
    update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnThis(), where: vi.fn().mockReturnThis() }),
    query: {
        users: { findFirst: vi.fn() },
    }
};

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

describe('Auth / Audit Tail Coverage', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        vi.stubEnv('APP_URL', 'https://app.test');
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

    it('AuditService: log catches non-Error objects (Line 29)', async () => {
        // Use vi.importActual to get the real AuditService logic despite the module mock
        const { AuditService: RealAuditService } = await vi.importActual<typeof import('../audit.service')>('../audit.service');
        const service = new RealAuditService(mockDb as any);
        mockDb.insert.mockImplementationOnce(() => { throw 'String Error'; });
        
        // Should catch and not re-throw
        await expect(service.log({ action: 'test' })).resolves.not.toThrow();
    });

    it('AuthService.signup: handles user registration (delegation)', async () => {
        mockUserRepo.findByEmail.mockResolvedValue(undefined);
        mockPasswordService.hash.mockResolvedValue('hashed');
        mockUserRepo.create.mockResolvedValue({ id: 'u1', email: 'test@test.com' });
        
        const { container } = await import('../../core/container');
        const user = await container.get(AuthService).signup('test@test.com', 'pwd', 'Name', undefined, 'realtutorialhub');
        expect(user.id).toBe('u1');
        expect(mockAuditService.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'signup_attempt' }));
    });

    it('AuthService.login: evaluates isAdmin for tokens', async () => {
        mockUserRepo.findWithDetails.mockResolvedValue({
            id: 'u1',
            email: 'admin@test.com',
            passwordHash: 'hashed',
            isBlocked: false,
            userRoles: [
                { role: { name: 'SUPER_ADMIN' } }
            ]
        } as any);

        mockPasswordService.compare.mockResolvedValue(true);
        mockSecurityService.isAccountLocked.mockResolvedValue(false);

        const { container } = await import('../../core/container');
        const result = await container.get(AuthService).login('admin@test.com', 'pwd', 'unknown', 'realtutorialhub');
        expect(result.isAdmin).toBe(true);
    });

    it('AuthService.refresh: handles exam grace window logic', async () => {
        const startedAt = new Date(Date.now() - 10000); 
        mockExamRepo.findActiveExam.mockResolvedValue({
            durationSeconds: 3600,
            startedAt
        } as any);

        const { container } = await import('../../core/container');
        const result = await container.get(AuthService).refresh('token', '1.1.1.1', 'exam-id', 'user', 'realtutorialhub');
        expect(result.accessToken).toBe('access');
        expect(mockTokenService.generateAccessToken).toHaveBeenCalled();
    });

    it('AuthService.logout: forces offline status if userId is provided', async () => {
        const { container } = await import('../../core/container');
        await container.get(AuthService).logout('token', 'u1');
        expect(mockTokenRepo.revokeToken).toHaveBeenCalled();
        expect(mockUserRepo.updateLastActive).toHaveBeenCalled();
    });
});
