import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TokenService } from '../token.service';
import { container } from '../../core/container';

describe('Token Service Tail 7', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-test-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-test-refresh-secret';
    process.env.ADMIN_JWT_SECRET = 'test-admin-secret-test-admin-secret';
    container.reset();
  });

  it('verifyRefreshToken: enforces audience if provided in options', async () => {
    const service = container.get(TokenService);
    const token = await service.generateRefreshToken('u1', false, 'user');
    
    await expect(service.verifyAdminRefreshToken(token))
      .rejects.toThrow(); 
  });

  it('verifyRefreshToken: accepts matching audience in options', async () => {
    const service = container.get(TokenService);
    const token = await service.generateRefreshToken('u1', false, 'user');
    const decoded = await service.verifyUserRefreshToken(token);
    expect(decoded.userId).toBe('u1');
  });

  it('verifyRefreshToken: handles ADMIN_SECRET for admin refresh tokens', async () => {
    const service = container.get(TokenService);
    const token = await service.generateRefreshToken('a1', true, 'admin');
    const decoded = await service.verifyAdminRefreshToken(token);
    expect(decoded.isAdmin).toBe(true);
  });
});
