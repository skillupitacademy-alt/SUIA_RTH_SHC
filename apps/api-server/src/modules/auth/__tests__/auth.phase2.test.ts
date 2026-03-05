import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../auth.service';
import { SignupService } from '../signup.service';
import { UserRepository } from '../repositories/user.repository';
import { AuditService } from '../audit.service';
import { container } from '../../core/container';

const mockUserRepo = { 
    findById: vi.fn(), 
    createToken: vi.fn(),
    deleteToken: vi.fn()
};
const mockAuditService = { log: vi.fn() };

vi.mock('../repositories/user.repository', () => ({ UserRepository: vi.fn().mockImplementation(() => mockUserRepo) }));
vi.mock('../audit.service', () => ({ AuditService: vi.fn().mockImplementation(() => mockAuditService) }));

describe('Auth phase 2 tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    container.reset();
    container.register(UserRepository, mockUserRepo as any);
    container.register(AuditService, mockAuditService as any);
  });

  it('resendVerification: throws if email already verified', async () => {
    mockUserRepo.findById.mockResolvedValue({ id: 'u1', emailVerified: true } as any);
    const service = container.get(AuthService);
    await expect(service.resendVerification('u1')).rejects.toThrow('Email already verified');
  });

  it('resendVerification: success flow', async () => {
    mockUserRepo.findById.mockResolvedValue({ id: 'u1', emailVerified: false } as any);
    mockUserRepo.createToken.mockResolvedValue({ token: 't1' } as any);
    const service = container.get(AuthService);
    const result = await service.resendVerification('u1');
    expect(result).toBe(true);
    expect(mockUserRepo.createToken).toHaveBeenCalled();
  });
});
