import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../auth.service';
import { TokenService } from '../token.service';
import { UserRepository } from '../repositories/user.repository';
import { TokenRepository } from '../repositories/token.repository';
import { AuditService } from '../audit.service';
import { container } from '../../core/container';

const mockTokenService = { 
    verifyRefreshToken: vi.fn(), 
    generateAccessToken: vi.fn(), 
    generateRefreshToken: vi.fn(), 
    hashToken: vi.fn().mockResolvedValue('hash') 
};
const mockUserRepo = { findByIdWithDetails: vi.fn(), updateLastActive: vi.fn() };
const mockTokenRepo = { 
    findByHash: vi.fn(), 
    createRefreshToken: vi.fn(), 
    revokeById: vi.fn() 
};
const mockAuditService = { log: vi.fn() };

vi.mock('../token.service', () => ({ TokenService: vi.fn().mockImplementation(() => mockTokenService) }));
vi.mock('../repositories/user.repository', () => ({ UserRepository: vi.fn().mockImplementation(() => mockUserRepo) }));
vi.mock('../repositories/token.repository', () => ({ TokenRepository: vi.fn().mockImplementation(() => mockTokenRepo) }));
vi.mock('../audit.service', () => ({ AuditService: vi.fn().mockImplementation(() => mockAuditService) }));

vi.mock('jose', () => ({
    decodeJwt: vi.fn().mockReturnValue({ userId: 'u1', isAdmin: false })
}));

describe('AuthService.refresh generic branches', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        container.reset();
        container.register(TokenService, mockTokenService as any);
        container.register(UserRepository, mockUserRepo as any);
        container.register(TokenRepository, mockTokenRepo as any);
        container.register(AuditService, mockAuditService as any);
    });

    it('refresh: successful refresh flow', async () => {
        mockTokenRepo.findByHash.mockResolvedValue({ id: 's1', userId: 'u1', expiresAt: new Date(Date.now() + 100000) } as any);
        mockTokenService.verifyRefreshToken.mockResolvedValue({ userId: 'u1', isAdmin: false });
        mockUserRepo.findByIdWithDetails.mockResolvedValue({ id: 'u1', isBlocked: false, userRoles: [] } as any);
        mockTokenService.generateAccessToken.mockResolvedValue('access');
        mockTokenService.generateRefreshToken.mockResolvedValue('refresh');

        const service = container.get(AuthService);
        const result = await service.refresh('token', undefined, undefined, 'user', 'realtutorialhub');
        expect(result.accessToken).toBe('access');
        expect(mockTokenRepo.revokeById).toHaveBeenCalledWith('s1');
    });
});
