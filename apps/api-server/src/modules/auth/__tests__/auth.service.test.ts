import { afterEach, describe, expect, it, vi, beforeEach } from 'vitest';
import crypto from 'crypto';
import { db, refreshTokens, users, roles, passwordResetTokens, verificationTokens } from '@quiz/db';
import { eq, and } from 'drizzle-orm';
import { decodeJwt } from 'jose';

import { AuthService } from '../auth.service';
import { AuditService } from '../audit.service';
import { PasswordService } from '../password.service';
import { SecurityService } from '../security.service';
import { TokenService } from '../token.service';
import { EmailService } from '../../email/EmailService';

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
    // Reset the query/insert/update/delete mocks specifically for each test
    db.query = {
       users: { findFirst: vi.fn() },
       roles: { findFirst: vi.fn() },
       refreshTokens: { findFirst: vi.fn() },
       exams: { findFirst: vi.fn() },
       passwordResetTokens: { findFirst: vi.fn() },
       verificationTokens: { findFirst: vi.fn() },
    } as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('signup', () => {
    it('throws if user already exists', async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue({ id: 'u1' } as any);
      await expect(AuthService.signup('test@test.com', 'pw', 'Name')).rejects.toThrow('User already exists');
    });

    it('creates user and assigns default role if found', async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue(undefined);
      vi.mocked(PasswordService.hash).mockResolvedValue('hash');
      
      const mockReturning = vi.fn().mockResolvedValue([{ id: 'u1', email: 't@t.com' }]);
      const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
      vi.mocked(db.insert).mockReturnValue({ values: mockValues } as any);
      
      vi.mocked(db.query.roles.findFirst).mockResolvedValue({ id: 'r1', name: 'USER' } as any);

      const user = await AuthService.signup('t@t.com', 'pw', 'Name');
      expect(user.id).toBe('u1');
      expect(db.insert).toHaveBeenCalledTimes(3); 
    });
  });

  describe('login', () => {
    it('throws if account is locked', async () => {
      vi.mocked(SecurityService.isAccountLocked).mockResolvedValue(true);
      await expect(AuthService.login('t@t.com', 'pw')).rejects.toThrow('Account temporarily locked');
    });

    it('throws on invalid credentials', async () => {
      vi.mocked(SecurityService.isAccountLocked).mockResolvedValue(false);
      vi.mocked(db.query.users.findFirst).mockResolvedValue({ passwordHash: 'h' } as any);
      vi.mocked(PasswordService.compare).mockResolvedValue(false);
      await expect(AuthService.login('t@t.com', 'pw')).rejects.toThrow('Invalid credentials');
    });

    it('throws if user is blocked', async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue({ passwordHash: 'h', isBlocked: true } as any);
      vi.mocked(PasswordService.compare).mockResolvedValue(true);
      vi.mocked(SecurityService.isAccountLocked).mockResolvedValue(false);

      await expect(AuthService.login('t@t.com', 'pw')).rejects.toThrow('Account has been blocked');
    });

    it('returns tokens and detects admin roles', async () => {
      const mockUser = {
        id: 'u1', email: 't@t.com', passwordHash: 'h', isBlocked: false,
        userRoles: [{ role: { name: 'ADMIN' } }]
      };
      vi.mocked(db.query.users.findFirst).mockResolvedValue(mockUser as any);
      vi.mocked(PasswordService.compare).mockResolvedValue(true);
      vi.mocked(SecurityService.isAccountLocked).mockResolvedValue(false);
      vi.mocked(TokenService.generateAccessToken).mockResolvedValue('access');
      vi.mocked(TokenService.generateRefreshToken).mockResolvedValue('refresh');

      const mockWhere = vi.fn().mockResolvedValue(undefined);
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
      vi.mocked(db.update).mockReturnValue({ set: mockSet } as any);
      vi.mocked(db.insert).mockReturnValue({ values: vi.fn() } as any);

      const result = await AuthService.login('t@t.com', 'pw');
      expect(result.isAdmin).toBe(true);
      expect(result.accessToken).toBe('access');
    });
  });

  describe('refresh', () => {
    it('detects token reuse', async () => {
      vi.mocked(decodeJwt).mockReturnValue({ isAdmin: false });
      vi.mocked(TokenService.verifyRefreshToken).mockResolvedValue({ userId: 'u1' } as any);
      vi.mocked(db.query.refreshTokens.findFirst).mockResolvedValue(undefined);

      const mockWhere = vi.fn().mockResolvedValue(undefined);
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
      vi.mocked(db.update).mockReturnValue({ set: mockSet } as any);

      await expect(AuthService.refresh('token')).rejects.toThrow('Security Alert');
    });

    it('throws if refresh token is expired according to DB', async () => {
      vi.mocked(decodeJwt).mockReturnValue({ isAdmin: false });
      vi.mocked(TokenService.verifyRefreshToken).mockResolvedValue({ userId: 'u1' } as any);
      vi.mocked(db.query.refreshTokens.findFirst).mockResolvedValue({ expiresAt: new Date(Date.now() - 1000) } as any);

      await expect(AuthService.refresh('token')).rejects.toThrow('Refresh _token expired');
    });

    it('restricts portal access for non-infra users', async () => {
      vi.mocked(decodeJwt).mockReturnValue({ isAdmin: false });
      vi.mocked(TokenService.verifyRefreshToken).mockResolvedValue({ userId: 'u1' } as any);
      vi.mocked(db.query.refreshTokens.findFirst).mockResolvedValue({ id: 's1', expiresAt: new Date(Date.now() + 100000) } as any);
      
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnValue([{ id: 'u1', roleName: 'USER', isBlocked: false }]),
      } as any);

      await expect(AuthService.refresh('token', 'ip', undefined, 'infra')).rejects.toThrow('Infrastructure privileges required');
    });

    it('handles exam grace window correctly', async () => {
      vi.mocked(decodeJwt).mockReturnValue({ isAdmin: false });
      vi.mocked(TokenService.verifyRefreshToken).mockResolvedValue({ userId: 'u1' } as any);
      vi.mocked(db.query.refreshTokens.findFirst).mockResolvedValue({ id: 's1', expiresAt: new Date(Date.now() + 100000) } as any);
      
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnValue([{ id: 'u1', roleName: 'USER', isBlocked: false }]),
      } as any);

      vi.mocked(db.query.exams.findFirst).mockResolvedValue({ 
        id: 'e1', userId: 'u1', status: 'started', durationSeconds: 3600, startedAt: new Date(Date.now() - 1000) 
      } as any);

      vi.mocked(db.update).mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn() }) } as any);
      vi.mocked(db.insert).mockReturnValue({ values: vi.fn() } as any);

      await AuthService.refresh('token', 'ip', 'e1');
      expect(TokenService.generateAccessToken).toHaveBeenCalledWith(expect.any(Object), expect.any(Number));
    });
  });

  describe('logout', () => {
    it('sets user offline immediate by setting lastActiveAt to past', async () => {
      vi.mocked(db.update).mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) } as any);
      await AuthService.logout('token', 'u1');
      expect(db.update).toHaveBeenCalledTimes(2); // token revoke + user offline
    });
  });

  describe('verifyEmail', () => {
    it('throws if token is invalid', async () => {
      vi.mocked(db.query.verificationTokens.findFirst).mockResolvedValue(undefined);
      await expect(AuthService.verifyEmail('bad')).rejects.toThrow('Invalid or expired');
    });

    it('marks email as verified and deletes token', async () => {
      vi.mocked(db.query.verificationTokens.findFirst).mockResolvedValue({ id: 't1', userId: 'u1', expiresAt: new Date(Date.now() + 10000) } as any);
      vi.mocked(db.update).mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn() }) } as any);
      vi.mocked(db.delete).mockReturnValue({ where: vi.fn() } as any);

      await AuthService.verifyEmail('good');
      expect(db.update).toHaveBeenCalledWith(users);
      expect(db.delete).toHaveBeenCalledWith(verificationTokens);
    });
  });

  describe('forgotPassword', () => {
    it('prevents enumeration', async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue(undefined);
      expect(await AuthService.forgotPassword('unknown@test.com')).toBe(true);
    });

    it('chooses correct portal URL for admins', async () => {
      process.env.NEXT_PUBLIC_ADMIN_URL = 'http://admin.com';
      vi.mocked(db.query.users.findFirst).mockResolvedValue({ 
        id: 'u1', email: 'a@a.com', userRoles: [{ role: { name: 'ADMIN' } }] 
      } as any);
      vi.mocked(db.insert).mockReturnValue({ values: vi.fn() } as any);

      await AuthService.forgotPassword('a@a.com');
      expect(EmailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('http://admin.com')
      );
    });

    it('throws if portal URL is missing in env', async () => {
      const original = process.env.NEXT_PUBLIC_WEB_APP_URL;
      delete process.env.NEXT_PUBLIC_WEB_APP_URL;
      vi.mocked(db.query.users.findFirst).mockResolvedValue({ id: 'u1', email: 't@t.com', userRoles: [] } as any);
      await expect(AuthService.forgotPassword('t@t.com')).rejects.toThrow('is required');
      process.env.NEXT_PUBLIC_WEB_APP_URL = original;
    });
  });

  describe('resendVerification', () => {
    it('throws if user not found', async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue(undefined);
      await expect(AuthService.resendVerification('u1')).rejects.toThrow('User not found');
    });

    it('throws if already verified', async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue({ emailVerified: true } as any);
      await expect(AuthService.resendVerification('u1')).rejects.toThrow('already verified');
    });

    it('inserts new token on success', async () => {
      vi.mocked(db.query.users.findFirst).mockResolvedValue({ emailVerified: false } as any);
      vi.mocked(db.insert).mockReturnValue({ values: vi.fn() } as any);
      
      const result = await AuthService.resendVerification('u1');
      expect(result).toBe(true);
      expect(db.insert).toHaveBeenCalledWith(verificationTokens);
    });
  });

  describe('heartbeat', () => {
    it('updates lastActiveAt', async () => {
      vi.mocked(db.update).mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) } as any);
      const result = await AuthService.heartbeat('u1');
      expect(result).toBe(true);
      expect(db.update).toHaveBeenCalledWith(users);
    });
  });

  describe('touchUserSession', () => {
    it('updates lastActiveAt for all active sessions of a user', async () => {
      vi.mocked(db.update).mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) } as any);
      await AuthService.touchUserSession('u1');
      expect(db.update).toHaveBeenCalledWith(refreshTokens);
    });
  });

  describe('resetPassword', () => {
    it('updates password on success', async () => {
      vi.mocked(db.query.passwordResetTokens.findFirst).mockResolvedValue({ id: 't1', userId: 'u1' } as any);
      vi.mocked(db.update).mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn() }) } as any);
      vi.mocked(db.delete).mockReturnValue({ where: vi.fn() } as any);

      await AuthService.resetPassword('tok', 'new-pw');
      expect(db.update).toHaveBeenCalled();
    });
  });
});
