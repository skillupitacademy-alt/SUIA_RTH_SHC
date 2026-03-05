import { afterEach, describe, expect, it, vi, beforeEach } from 'vitest';
import { container } from '../../core/container';
import { UserRepository } from '../repositories/user.repository';
import { TokenRepository } from '../repositories/token.repository';
import { ExamRepository } from '../../exam-engine/repositories/exam.repository';
import { AuthService } from '../auth.service';
import { PasswordService } from '../password.service';
import { SecurityService } from '../security.service';
import { TokenService } from '../token.service';
import { EmailService } from '../../email/EmailService';
import { AuditService } from '../audit.service';
import { decodeJwt } from 'jose';

// Standard Mocks
vi.mock('../audit.service');
vi.mock('../password.service');
vi.mock('../security.service');
vi.mock('../token.service');
vi.mock('../../email/EmailService');
vi.mock('jose', () => ({
  decodeJwt: vi.fn(),
}));

describe('AuthService', () => {
  beforeEach(() => {
    container.reset();
    
    // Repository Prototype Mocks - Total isolation from DB proxy
    vi.spyOn(UserRepository.prototype, 'findByEmail').mockResolvedValue(undefined);
    vi.spyOn(UserRepository.prototype, 'findWithDetails').mockResolvedValue(undefined);
    vi.spyOn(UserRepository.prototype, 'findByIdWithDetails').mockResolvedValue(undefined);
    vi.spyOn(UserRepository.prototype, 'findById').mockResolvedValue(undefined);
    vi.spyOn(UserRepository.prototype, 'create').mockResolvedValue({ id: 'u1' } as any);
    vi.spyOn(UserRepository.prototype, 'assignRole').mockResolvedValue(undefined as any);
    vi.spyOn(UserRepository.prototype, 'updateLastActive').mockResolvedValue(undefined as any);
    vi.spyOn(UserRepository.prototype, 'verifyEmail').mockResolvedValue(undefined as any);
    vi.spyOn(UserRepository.prototype, 'deleteToken').mockResolvedValue(undefined as any);
    vi.spyOn(UserRepository.prototype, 'createToken').mockResolvedValue(undefined as any);
    vi.spyOn(UserRepository.prototype, 'createResetToken').mockResolvedValue(undefined as any);
    vi.spyOn(UserRepository.prototype, 'findResetToken').mockResolvedValue(undefined);
    vi.spyOn(UserRepository.prototype, 'updatePassword').mockResolvedValue(undefined as any);
    vi.spyOn(UserRepository.prototype, 'deleteResetToken').mockResolvedValue(undefined as any);
    vi.spyOn(UserRepository.prototype, 'findToken').mockResolvedValue(undefined);

    vi.spyOn(TokenRepository.prototype, 'findByHash').mockResolvedValue(undefined);
    vi.spyOn(TokenRepository.prototype, 'createRefreshToken').mockResolvedValue(undefined as any);
    vi.spyOn(TokenRepository.prototype, 'revokeToken').mockResolvedValue(undefined as any);
    vi.spyOn(TokenRepository.prototype, 'revokeById').mockResolvedValue(undefined as any);
    vi.spyOn(TokenRepository.prototype, 'revokeAll').mockResolvedValue(undefined as any);
    vi.spyOn(TokenRepository.prototype, 'touchSession').mockResolvedValue(undefined as any);
    
    vi.spyOn(ExamRepository.prototype, 'findActiveExam').mockResolvedValue(undefined);
    vi.spyOn(ExamRepository.prototype, 'updateStatus').mockResolvedValue([] as any);

    // Instance Prototype Mocks for Services
    vi.spyOn(AuditService.prototype, 'log').mockResolvedValue(undefined as any);
    vi.spyOn(PasswordService.prototype, 'hash').mockResolvedValue('hash');
    vi.spyOn(PasswordService.prototype, 'compare').mockResolvedValue(true);
    vi.spyOn(SecurityService.prototype, 'isAccountLocked').mockResolvedValue(false);
    vi.spyOn(SecurityService.prototype, 'trackLoginAttempt').mockResolvedValue(undefined as any);
    vi.spyOn(TokenService.prototype, 'generateAccessToken').mockResolvedValue('access');
    vi.spyOn(TokenService.prototype, 'generateRefreshToken').mockResolvedValue('refresh');
    vi.spyOn(TokenService.prototype, 'verifyRefreshToken').mockResolvedValue({ userId: 'u1' } as any);
    vi.spyOn(TokenService.prototype, 'hashToken').mockResolvedValue('hash');
    vi.spyOn(TokenService.prototype, 'getExpiration').mockReturnValue(new Date(Date.now() + 1000).toISOString());
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  describe('signup', () => {
    it('throws if user already exists', async () => {
      vi.spyOn(UserRepository.prototype, 'findByEmail').mockResolvedValue({ id: 'u1' } as any);
      await expect(container.get(AuthService).signup('test@test.com', 'pw', 'Name')).rejects.toThrow('User already exists');
    });

    it('creates user and assigns default role if found', async () => {
      vi.spyOn(UserRepository.prototype, 'findByEmail').mockResolvedValue(undefined);
      const createSpy = vi.spyOn(UserRepository.prototype, 'create').mockResolvedValue({ id: 'u1', email: 't@t.com' } as any);
      const roleSpy = vi.spyOn(UserRepository.prototype, 'assignRole').mockResolvedValue(undefined as any);

      const user = await container.get(AuthService).signup('t@t.com', 'pw', 'Name');
      expect(user.id).toBe('u1');
      expect(createSpy).toHaveBeenCalled();
      expect(roleSpy).toHaveBeenCalledWith('u1', 'USER');
    });
  });

  describe('login', () => {
    it('throws if account is locked', async () => {
      vi.spyOn(SecurityService.prototype, 'isAccountLocked').mockResolvedValue(true);
      await expect(container.get(AuthService).login('t@t.com', 'pw')).rejects.toThrow('Account temporarily locked');
    });

    it('throws on invalid credentials', async () => {
      vi.spyOn(SecurityService.prototype, 'isAccountLocked').mockResolvedValue(false);
      vi.spyOn(UserRepository.prototype, 'findWithDetails').mockResolvedValue({ passwordHash: 'h' } as any);
      vi.spyOn(PasswordService.prototype, 'compare').mockResolvedValue(false);
      await expect(container.get(AuthService).login('t@t.com', 'pw', '1.1.1.1')).rejects.toThrow('Invalid credentials');
    });

    it('throws if user is blocked', async () => {
      vi.spyOn(UserRepository.prototype, 'findWithDetails').mockResolvedValue({ id: 'u1', passwordHash: 'h', isBlocked: true } as any);
      vi.spyOn(PasswordService.prototype, 'compare').mockResolvedValue(true);
      vi.spyOn(SecurityService.prototype, 'isAccountLocked').mockResolvedValue(false);

      await expect(container.get(AuthService).login('t@t.com', 'pw', '1.1.1.1')).rejects.toThrow('Account has been blocked');
    });

    it('returns tokens and detects admin roles', async () => {
      const mockUser = {
        id: 'u1', email: 't@t.com', passwordHash: 'h', isBlocked: false,
        userRoles: [{ role: { name: 'ADMIN' } }]
      };
      vi.spyOn(UserRepository.prototype, 'findWithDetails').mockResolvedValue(mockUser as any);
      vi.spyOn(PasswordService.prototype, 'compare').mockResolvedValue(true);
      vi.spyOn(SecurityService.prototype, 'isAccountLocked').mockResolvedValue(false);
      
      const result = await container.get(AuthService).login('t@t.com', 'pw', '1.1.1.1');
      expect(result.isAdmin).toBe(true);
      expect(result.accessToken).toBe('access');
    });
  });

  describe('refresh', () => {
    it('detects token reuse', async () => {
      vi.mocked(decodeJwt).mockReturnValue({ isAdmin: false });
      vi.spyOn(TokenService.prototype, 'verifyRefreshToken').mockResolvedValue({ userId: 'u1' } as any);
      vi.spyOn(TokenRepository.prototype, 'findByHash').mockResolvedValue(undefined);

      await expect(container.get(AuthService).refresh('token')).rejects.toThrow('Security Alert');
    });

    it('throws if refresh token is expired according to DB', async () => {
      vi.mocked(decodeJwt).mockReturnValue({ isAdmin: false });
      vi.spyOn(TokenService.prototype, 'verifyRefreshToken').mockResolvedValue({ userId: 'u1' } as any);
      vi.spyOn(TokenRepository.prototype, 'findByHash').mockResolvedValue({ expiresAt: new Date(Date.now() - 1000) } as any);

      await expect(container.get(AuthService).refresh('token')).rejects.toThrow('Refresh _token expired');
    });

    it('restricts portal access for non-infra users', async () => {
      vi.mocked(decodeJwt).mockReturnValue({ isAdmin: false });
      vi.spyOn(TokenService.prototype, 'verifyRefreshToken').mockResolvedValue({ userId: 'u1' } as any);
      vi.spyOn(TokenRepository.prototype, 'findByHash').mockResolvedValue({ id: 's1', expiresAt: new Date(Date.now() + 100000) } as any);
      
      vi.spyOn(UserRepository.prototype, 'findByIdWithDetails').mockResolvedValue({ 
        id: 'u1', email: 't@t.com', isBlocked: false,
        userRoles: [{ role: { name: 'USER' } }]
      } as any);

      await expect(container.get(AuthService).refresh('token', 'ip', undefined, 'infra')).rejects.toThrow('Infrastructure privileges required');
    });

    it('handles exam grace window correctly', async () => {
      vi.mocked(decodeJwt).mockReturnValue({ isAdmin: false });
      vi.spyOn(TokenService.prototype, 'verifyRefreshToken').mockResolvedValue({ userId: 'u1' } as any);
      vi.spyOn(TokenRepository.prototype, 'findByHash').mockResolvedValue({ id: 's1', expiresAt: new Date(Date.now() + 100000) } as any);
      
      vi.spyOn(UserRepository.prototype, 'findByIdWithDetails').mockResolvedValue({ 
        id: 'u1', email: 't@t.com', isBlocked: false,
        userRoles: [{ role: { name: 'USER' } }]
      } as any);

      vi.spyOn(ExamRepository.prototype, 'findActiveExam').mockResolvedValue({ 
        id: 'e1', userId: 'u1', status: 'started', durationSeconds: 3600, startedAt: new Date(Date.now() - 1000) 
      } as any);

      const genSpy = vi.spyOn(TokenService.prototype, 'generateAccessToken');

      await container.get(AuthService).refresh('token', 'ip', 'e1');
      expect(genSpy).toHaveBeenCalledWith(expect.any(Object), expect.any(Number));
    });
  });

  describe('logout', () => {
    it('sets user offline immediate by setting lastActiveAt to past', async () => {
      const revokeSpy = vi.spyOn(TokenRepository.prototype, 'revokeToken');
      const activeSpy = vi.spyOn(UserRepository.prototype, 'updateLastActive');

      await container.get(AuthService).logout('token', 'u1');
      expect(revokeSpy).toHaveBeenCalled();
      expect(activeSpy).toHaveBeenCalled();
    });
  });

  describe('verifyEmail', () => {
    it('throws if token is invalid', async () => {
      vi.spyOn(UserRepository.prototype, 'findToken').mockResolvedValue(undefined);
      await expect(container.get(AuthService).verifyEmail('bad')).rejects.toThrow('Invalid or expired');
    });

    it('marks email as verified and deletes token', async () => {
      vi.spyOn(UserRepository.prototype, 'findToken').mockResolvedValue({ id: 't1', userId: 'u1', expiresAt: new Date(Date.now() + 10000) } as any);
      const verifySpy = vi.spyOn(UserRepository.prototype, 'verifyEmail');
      const deleteSpy = vi.spyOn(UserRepository.prototype, 'deleteToken');

      await container.get(AuthService).verifyEmail('good');
      expect(verifySpy).toHaveBeenCalledWith('u1');
      expect(deleteSpy).toHaveBeenCalledWith('t1');
    });
  });

  describe('forgotPassword', () => {
    it('prevents enumeration', async () => {
      vi.spyOn(UserRepository.prototype, 'findWithDetails').mockResolvedValue(undefined);
      expect(await container.get(AuthService).forgotPassword('unknown@test.com')).toBe(true);
    });

    it('chooses correct portal URL for admins', async () => {
      vi.stubEnv('NEXT_PUBLIC_ADMIN_URL', 'http://admin.com');
      vi.spyOn(UserRepository.prototype, 'findWithDetails').mockResolvedValue({ 
        id: 'u1', email: 'a@a.com', userRoles: [{ role: { name: 'ADMIN' } }] 
      } as any);

      await container.get(AuthService).forgotPassword('a@a.com');
      expect(EmailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('http://admin.com')
      );
    });

    it('throws if portal URL is missing in env', async () => {
      vi.stubEnv('NEXT_PUBLIC_WEB_APP_URL', '');
      vi.spyOn(UserRepository.prototype, 'findWithDetails').mockResolvedValue({ id: 'u1', email: 't@t.com', userRoles: [] } as any);
      await expect(container.get(AuthService).forgotPassword('t@t.com')).rejects.toThrow('is required');
    });
  });

  describe('resendVerification', () => {
    it('throws if user not found', async () => {
      vi.spyOn(UserRepository.prototype, 'findById').mockResolvedValue(undefined);
      await expect(container.get(AuthService).resendVerification('u1')).rejects.toThrow('User not found');
    });

    it('throws if already verified', async () => {
      vi.spyOn(UserRepository.prototype, 'findById').mockResolvedValue({ emailVerified: true } as any);
      await expect(container.get(AuthService).resendVerification('u1')).rejects.toThrow('already verified');
    });

    it('inserts new token on success', async () => {
      vi.spyOn(UserRepository.prototype, 'findById').mockResolvedValue({ id: 'u1', emailVerified: false } as any);
      const tokenSpy = vi.spyOn(UserRepository.prototype, 'createToken');

      const result = await container.get(AuthService).resendVerification('u1');
      expect(result).toBe(true);
      expect(tokenSpy).toHaveBeenCalled();
    });
  });

  describe('heartbeat', () => {
    it('updates lastActiveAt', async () => {
      const activeSpy = vi.spyOn(UserRepository.prototype, 'updateLastActive');
      const result = await container.get(AuthService).heartbeat('u1');
      expect(result).toBe(true);
      expect(activeSpy).toHaveBeenCalledWith('u1');
    });
  });

  describe('touchUserSession', () => {
    it('updates lastActiveAt for all active sessions of a user', async () => {
      const touchSpy = vi.spyOn(TokenRepository.prototype, 'touchSession');
      await container.get(AuthService).touchUserSession('u1');
      expect(touchSpy).toHaveBeenCalledWith('u1');
    });
  });

  describe('resetPassword', () => {
    it('updates password on success', async () => {
      vi.spyOn(UserRepository.prototype, 'findResetToken').mockResolvedValue({ id: 't1', userId: 'u1' } as any);
      const updateSpy = vi.spyOn(UserRepository.prototype, 'updatePassword');
      const deleteSpy = vi.spyOn(UserRepository.prototype, 'deleteResetToken');

      await container.get(AuthService).resetPassword('tok', 'new-pw');
      expect(updateSpy).toHaveBeenCalled();
      expect(deleteSpy).toHaveBeenCalledWith('t1');
    });
  });
});
