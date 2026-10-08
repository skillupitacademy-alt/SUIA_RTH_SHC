import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TokenService } from '../token.service';
import { container } from '../../core/container';

describe('TokenService Verification Coverage', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-test-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-test-refresh-secret';
    process.env.ADMIN_JWT_SECRET = 'test-admin-secret-test-admin-secret';
    container.reset();
  });

  it('verifyAccessToken: should correctly verify a valid user token', async () => {
    const service = container.get(TokenService);
    const token = await service.generateAccessToken({ userId: 'u1', email: 'u@u.com', roles: ['USER'] } as any);
    const decoded = await service.verifyAccessToken(token);
    expect(decoded.userId).toBe('u1');
  });

  it('verifyAccessToken: should throw for expired token', async () => {
    const service = container.get(TokenService);
    // Generate a token that is already expired
    const token = await service.generateAccessToken({ userId: 'u1', email: 'u@u.com', roles: ['USER'] } as any, -10);
    await expect(service.verifyAccessToken(token)).rejects.toThrow();
  });

  it('getExpiration: returns ISO string for valid token', async () => {
      const service = container.get(TokenService);
      const token = await service.generateAccessToken({ userId: 'u1', email: 'u@u.com', roles: ['USER'] } as any);
      const exp = service.getExpiration(token);
      expect(exp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
