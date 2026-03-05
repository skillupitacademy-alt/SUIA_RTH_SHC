import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../auth.service';
import { TokenService } from '../token.service';
import { TokenRepository } from '../repositories/token.repository';
import { UserRepository } from '../repositories/user.repository';
import { AuditService } from '../audit.service';
import { container } from '../../core/container';

const mockTokenService = { hashToken: vi.fn().mockResolvedValue('hash') };
const mockTokenRepo = { revokeToken: vi.fn() };
const mockUserRepo = { updateLastActive: vi.fn() };
const mockAuditService = { log: vi.fn() };

vi.mock('../token.service', () => ({ TokenService: vi.fn().mockImplementation(() => mockTokenService) }));
vi.mock('../repositories/token.repository', () => ({ TokenRepository: vi.fn().mockImplementation(() => mockTokenRepo) }));
vi.mock('../repositories/user.repository', () => ({ UserRepository: vi.fn().mockImplementation(() => mockUserRepo) }));
vi.mock('../audit.service', () => ({ AuditService: vi.fn().mockImplementation(() => mockAuditService) }));

describe('AuthService logout edge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    container.reset();
    container.register(TokenService, mockTokenService as any);
    container.register(TokenRepository, mockTokenRepo as any);
    container.register(UserRepository, mockUserRepo as any);
    container.register(AuditService, mockAuditService as any);
  });

  it('marks refresh token revoked and bumps lastActiveAt backwards', async () => {
    const service = container.get(AuthService);
    await service.logout('tok', 'u1', '1.1.1.1');
    expect(mockTokenRepo.revokeToken).toHaveBeenCalledWith('hash');
    expect(mockUserRepo.updateLastActive).toHaveBeenCalledWith('u1', expect.any(Date));
  });
});
