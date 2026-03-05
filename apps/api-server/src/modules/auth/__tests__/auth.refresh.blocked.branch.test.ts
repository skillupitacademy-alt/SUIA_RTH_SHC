import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../auth.service';
import { TokenService } from '../token.service';
import { UserRepository } from '../repositories/user.repository';
import { TokenRepository } from '../repositories/token.repository';
import { AuditService } from '../audit.service';
import { container } from '../../core/container';

const mockTokenService = { 
    verifyRefreshToken: vi.fn(),
    hashToken: vi.fn().mockResolvedValue('hash')
};
const mockUserRepo = { findByIdWithDetails: vi.fn() };
const mockTokenRepo = { findByHash: vi.fn() };
const mockAuditService = { log: vi.fn() };

vi.mock('../token.service', () => ({ TokenService: vi.fn().mockImplementation(() => mockTokenService) }));
vi.mock('../repositories/user.repository', () => ({ UserRepository: vi.fn().mockImplementation(() => mockUserRepo) }));
vi.mock('../repositories/token.repository', () => ({ TokenRepository: vi.fn().mockImplementation(() => mockTokenRepo) }));
vi.mock('../audit.service', () => ({ AuditService: vi.fn().mockImplementation(() => mockAuditService) }));

vi.mock('jose', () => ({
    decodeJwt: vi.fn().mockReturnValue({ userId: 'u1', isAdmin: false })
}));

describe('AuthService.refresh blocked branch', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        container.reset();
        container.register(TokenService, mockTokenService as any);
        container.register(UserRepository, mockUserRepo as any);
        container.register(TokenRepository, mockTokenRepo as any);
        container.register(AuditService, mockAuditService as any);
    });

    it('refresh: throws specifically for blocked user', async () => {
        mockTokenRepo.findByHash.mockResolvedValue({ userId: 'u1', expiresAt: new Date(Date.now() + 100000) } as any);
        mockTokenService.verifyRefreshToken.mockResolvedValue({ userId: 'u1', isAdmin: false });
        mockUserRepo.findByIdWithDetails.mockResolvedValue({ id: 'u1', isBlocked: true } as any);

        const service = container.get(AuthService);
        await expect(service.refresh('token')).rejects.toThrow('access_denied:user_blocked');
    });
});
