import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../auth.service';
import { TokenService } from '../token.service';
import { AuditService } from '../audit.service';
import { SecurityService } from '../security.service';
import { PasswordService } from '../password.service';
import { EmailService } from '../../email/EmailService';
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
  getExpiration: vi.fn().mockReturnValue(new Date(Date.now() + 1000).toISOString()),
};

const mockAuditService = { log: vi.fn() };
const mockSecurityService = { isAccountLocked: vi.fn(), trackLoginAttempt: vi.fn() };
const mockPasswordService = { compare: vi.fn(), hash: vi.fn() };
const mockUserRepo = { 
  findByIdWithDetails: vi.fn(), 
  updateLastActive: vi.fn(), 
  findWithDetails: vi.fn(), 
  create: vi.fn(), 
  assignRole: vi.fn(), 
  withDb: vi.fn(),
  findByEmail: vi.fn(),
  findById: vi.fn(),
  findToken: vi.fn(),
  verifyEmail: vi.fn(),
  deleteToken: vi.fn(),
  createToken: vi.fn(),
  createResetToken: vi.fn(),
  findResetToken: vi.fn(),
  deleteResetToken: vi.fn(),
  updatePassword: vi.fn()
};
const mockTokenRepo = { 
  findByHash: vi.fn(), 
  revokeAll: vi.fn(), 
  revokeById: vi.fn(), 
  createRefreshToken: vi.fn(), 
  revokeToken: vi.fn(), 
  touchSession: vi.fn() 
};
const mockExamRepo = { findActiveExam: vi.fn() };

vi.mock('../token.service', () => ({ TokenService: vi.fn().mockImplementation(() => mockTokenService) }));
vi.mock('../audit.service', () => ({ AuditService: vi.fn().mockImplementation(() => mockAuditService) }));
vi.mock('../security.service', () => ({ SecurityService: vi.fn().mockImplementation(() => mockSecurityService) }));
vi.mock('../password.service', () => ({ PasswordService: vi.fn().mockImplementation(() => mockPasswordService) }));
vi.mock('../repositories/user.repository', () => ({ UserRepository: vi.fn().mockImplementation(() => mockUserRepo) }));
vi.mock('../repositories/token.repository', () => ({ TokenRepository: vi.fn().mockImplementation(() => mockTokenRepo) }));
vi.mock('../../exam-engine/repositories/exam.repository', () => ({ ExamRepository: vi.fn().mockImplementation(() => mockExamRepo) }));
vi.mock('../../email/EmailService', () => ({
  EmailService: {
    sendPasswordResetEmail: vi.fn(),
    sendVerificationEmail: vi.fn(),
  }
}));

vi.mock('jose', () => ({
  decodeJwt: vi.fn().mockReturnValue({ isAdmin: false, userId: 'u1' })
}));

describe('AuthService (Main Suite)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    container.reset();
    vi.stubEnv('APP_URL', 'https://app.test');
    
    // Explicit registration
    container.register(TokenService, mockTokenService as any);
    container.register(AuditService, mockAuditService as any);
    container.register(SecurityService, mockSecurityService as any);
    container.register(PasswordService, mockPasswordService as any);
    container.register(UserRepository, mockUserRepo as any);
    container.register(TokenRepository, mockTokenRepo as any);
    container.register(ExamRepository, mockExamRepo as any);

    // Default behaviors
    mockTokenService.generateAccessToken.mockResolvedValue('access');
    mockTokenService.generateRefreshToken.mockResolvedValue('refresh');
    mockTokenService.hashToken.mockResolvedValue('hash');
    mockTokenService.verifyRefreshToken.mockResolvedValue({ userId: 'u1', isAdmin: false });
    mockPasswordService.hash.mockResolvedValue('hashed');
    mockPasswordService.compare.mockResolvedValue(true);
    mockSecurityService.isAccountLocked.mockResolvedValue(false);
  });

  describe('signup', () => {
    it('throws if user already exists', async () => {
      mockUserRepo.findByEmail.mockResolvedValue({ id: 'u1' } as any);
      await expect(container.get(AuthService).signup('test@test.com', 'pw', 'Name')).rejects.toThrow('User already exists');
    });

    it('creates user and assigns default role if found', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(undefined);
      mockUserRepo.create.mockResolvedValue({ id: 'u1', email: 't@t.com' } as any);
      mockUserRepo.withDb.mockReturnValue(mockUserRepo);
      
      const user = await container.get(AuthService).signup('t@t.com', 'pw', 'Name');
      expect(user.id).toBe('u1');
      expect(mockUserRepo.create).toHaveBeenCalled();
      expect(mockUserRepo.assignRole).toHaveBeenCalledWith('u1', 'USER');
    });
  });

  describe('login', () => {
    it('throws if account is locked', async () => {
      mockSecurityService.isAccountLocked.mockResolvedValue(true);
      await expect(container.get(AuthService).login('t@t.com', 'pw', 'unknown', 'realtutorialhub')).rejects.toThrow('Account temporarily locked');
    });

    it('throws on invalid credentials', async () => {
      mockUserRepo.findWithDetails.mockResolvedValue({ passwordHash: 'h' } as any);
      mockPasswordService.compare.mockResolvedValue(false);
      await expect(container.get(AuthService).login('t@t.com', 'pw', '1.1.1.1', 'realtutorialhub')).rejects.toThrow('Invalid credentials');
    });

    it('returns tokens and detects admin roles', async () => {
      mockUserRepo.findWithDetails.mockResolvedValue({
        id: 'u1', email: 't@t.com', passwordHash: 'h', isBlocked: false,
        userRoles: [{ role: { name: 'ADMIN' } }]
      } as any);
      
      const result = await container.get(AuthService).login('t@t.com', 'pw', '1.1.1.1', 'realtutorialhub');
      expect(result.isAdmin).toBe(true);
      expect(result.accessToken).toBe('access');
    });
  });

  describe('refresh', () => {
    it('detects token reuse', async () => {
      mockTokenRepo.findByHash.mockResolvedValue(undefined);
      await expect(container.get(AuthService).refresh('token', undefined, undefined, 'user', 'realtutorialhub')).rejects.toThrow('Security Alert');
    });

    it('throws if refresh token is expired according to DB', async () => {
      mockTokenRepo.findByHash.mockResolvedValue({ expiresAt: new Date(Date.now() - 1000) } as any);
      await expect(container.get(AuthService).refresh('token', undefined, undefined, 'user', 'realtutorialhub')).rejects.toThrow('Refresh _token expired');
    });

    it('handles exam grace window correctly', async () => {
      mockTokenRepo.findByHash.mockResolvedValue({ id: 's1', expiresAt: new Date(Date.now() + 100000) } as any);
      mockUserRepo.findByIdWithDetails.mockResolvedValue({ 
        id: 'u1', email: 't@t.com', isBlocked: false, userRoles: []
      } as any);
      mockExamRepo.findActiveExam.mockResolvedValue({ 
        id: 'e1', userId: 'u1', status: 'started', durationSeconds: 3600, startedAt: new Date(Date.now() - 1000) 
      } as any);

      await container.get(AuthService).refresh('token', 'ip', 'e1', 'user', 'realtutorialhub');
      expect(mockTokenService.generateAccessToken).toHaveBeenCalledWith(expect.any(Object), expect.any(Number));
    });
  });

  describe('logout', () => {
    it('sets user offline immediate', async () => {
      await container.get(AuthService).logout('token', 'u1');
      expect(mockTokenRepo.revokeToken).toHaveBeenCalled();
      expect(mockUserRepo.updateLastActive).toHaveBeenCalled();
    });
  });

  describe('forgotPassword', () => {
    it('prevents enumeration', async () => {
      mockUserRepo.findWithDetails.mockResolvedValue(undefined);
      expect(await container.get(AuthService).forgotPassword('unknown@test.com', undefined, 'realtutorialhub')).toBe(true);
    });

    it('chooses correct portal URL for admins', async () => {
      mockUserRepo.findWithDetails.mockResolvedValue({ 
        id: 'u1', email: 'a@a.com', userRoles: [{ role: { name: 'ADMIN' } }] 
      } as any);

      await container.get(AuthService).forgotPassword('a@a.com', undefined, 'realtutorialhub');
      expect(EmailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('https://user.realtutorialhub.com'),
        'realtutorialhub'
      );
    });
  });

  describe('resendVerification', () => {
    it('inserts new token on success', async () => {
      mockUserRepo.findById.mockResolvedValue({ id: 'u1', emailVerified: false } as any);
      const result = await container.get(AuthService).resendVerification('u1');
      expect(result).toBe(true);
      expect(mockUserRepo.createToken).toHaveBeenCalled();
      expect(EmailService.sendVerificationEmail).toHaveBeenCalled();
    });
  });
});
