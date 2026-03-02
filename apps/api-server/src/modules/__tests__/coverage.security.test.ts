import { describe, expect, it, vi, beforeEach } from 'vitest';
import { mockDb } from '../../__test-utils__/mock-db';
import { AdminAuthService } from '../auth/admin-auth.service';
import { TokenService } from '../auth/token.service';
import { csrfProtection } from '../auth/csrf.middleware';
import { SecurityService } from '../auth/security.service';
import { PasswordService } from '../auth/password.service';

// Mock DB
vi.mock('@quiz/db', () => ({
  db: mockDb,
  users: { id: 'users.id', email: 'users.email', passwordHash: 'users.passwordHash' },
  userProfiles: { userId: 'userProfiles.userId', name: 'userProfiles.name' },
  userRoles: { userId: 'userRoles.userId', roleId: 'userRoles.roleId' },
  roles: { id: 'roles.id', name: 'roles.name' },
  refreshTokens: { id: 'refreshTokens.id', userId: 'refreshTokens.userId', token: 'refreshTokens.token', expiresAt: 'refreshTokens.expiresAt' },
}));

// Mock related services
vi.mock('../auth/security.service', () => ({
  SecurityService: {
    isAccountLocked: vi.fn().mockResolvedValue(false),
    trackLoginAttempt: vi.fn().mockResolvedValue(undefined),
  }
}));

vi.mock('../auth/password.service', () => ({
  PasswordService: {
    compare: vi.fn(),
  }
}));

describe('Consolidated Security Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AdminAuthService', () => {
    it('detects locked accounts and triggers error', async () => {
        vi.mocked(SecurityService.isAccountLocked).mockResolvedValueOnce(true);
        await expect(AdminAuthService.login('admin@test.com', 'password')).rejects.toThrow('Governance');
    });

    it('rejects non-admin users', async () => {
        vi.mocked(mockDb.select).mockReturnValue({
            from: vi.fn().mockReturnValue({
                leftJoin: vi.fn().mockReturnValue({
                    leftJoin: vi.fn().mockReturnValue({
                        leftJoin: vi.fn().mockReturnValue({
                            where: vi.fn().mockResolvedValue([{ roleName: 'STUDENT' }])
                        })
                    })
                })
            })
        } as any);
        vi.mocked(PasswordService.compare).mockResolvedValue(true);

        await expect(AdminAuthService.login('user@test.com', 'password')).rejects.toThrow('Governance Privileges');
    });
  });

  describe('TokenService & CSRF', () => {
    it('covers audience violations', async () => {
        const token = await TokenService.generateAccessToken({ 
            userId: 'u1', 
            email: 'u1@test.com', 
            roles: ['USER'],
            isAdmin: false 
        });
        await expect(TokenService.verifyAccessToken(token, { audience: 'infra' })).rejects.toThrow();
    });

    it('triggers CSRF bearer bypass', async () => {
        const mockReq = { 
            method: 'POST',
            headers: new Map([['authorization', 'Bearer test'], ['origin', 'http://localhost:3000'], ['host', 'localhost:3000']]),
            cookies: { get: vi.fn(), has: vi.fn() }
        };
        
        // NextRequest mocks are tricky, using simple object for logic branch test
        const result = await csrfProtection(mockReq as any);
        expect(result).toBeNull(); // Should bypass due to Bearer
    });
  });
});
