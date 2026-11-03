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
const mockUserRepo = { findByIdWithDetails: vi.fn(), findActiveUserWithRoles: vi.fn(), updateLastActive: vi.fn() };
const mockTokenRepo = {
    findByHash: vi.fn(),
    createRefreshToken: vi.fn(),
    revokeById: vi.fn(),
    revokeToken: vi.fn(),
    consumeToken: vi.fn().mockResolvedValue({ id: 's1', userId: 'u1' }),
    updateLastUsed: vi.fn(),
    withDb: vi.fn(function(this: any) { return this; })
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

    it('refresh: successful refresh flow with transactional token rotation', async () => {
        mockTokenRepo.findByHash.mockResolvedValue({ id: 's1', userId: 'u1', expiresAt: new Date(Date.now() + 100000) } as any);
        mockTokenService.verifyRefreshToken.mockResolvedValue({ userId: 'u1', isAdmin: false });
        mockUserRepo.findByIdWithDetails.mockResolvedValue({ id: 'u1', isBlocked: false, userRoles: [] } as any);
        mockUserRepo.findActiveUserWithRoles.mockResolvedValue({ id: 'u1', email: 'u1@test.com', isBlocked: false, deletedAt: null, roles: [] });
        mockTokenService.generateAccessToken.mockResolvedValue('access');
        mockTokenService.generateRefreshToken.mockResolvedValue('refresh');

        const service = container.get(AuthService);
        const result = await service.refresh('token', undefined, undefined, 'user', 'realtutorialhub');

        expect(result.accessToken).toBe('access');
        expect(result.refreshToken).toBe('refresh');

        // Verify token rotation occurred: parent atomically consumed, successor created
        expect(mockTokenRepo.consumeToken).toHaveBeenCalledTimes(1);
        expect(mockTokenRepo.consumeToken).toHaveBeenCalledWith('hash', 'u1');
        expect(mockTokenRepo.createRefreshToken).toHaveBeenCalledTimes(1);
        expect(mockTokenRepo.updateLastUsed).not.toHaveBeenCalled();
    });
});
