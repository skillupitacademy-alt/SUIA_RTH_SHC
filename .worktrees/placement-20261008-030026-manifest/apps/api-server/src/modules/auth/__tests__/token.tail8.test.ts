import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TokenService } from '../token.service';
import { container } from '../../core/container';

describe('Token Service Tail 8', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-test-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-test-refresh-secret';
    process.env.ADMIN_JWT_SECRET = 'test-admin-secret-test-admin-secret';
    container.reset();
  });

  it('verifyAccessToken: fallback to admin secret when user secret fails', async () => {
    const service = container.get(TokenService);
    // Generate an admin token
    const token = await service.generateAccessToken({ 
        userId: 'a1', email: 'a@a.com', roles: [], isAdmin: true 
    } as any);
    
    // verifyAccessToken without isAdmin option should try user secret first, then admin secret
    const decoded = await service.verifyAccessToken(token);
    expect(decoded.isAdmin).toBe(true);
  });

  it('verifyAccessToken: throws if both secrets fail', async () => {
    const service = container.get(TokenService);
    await expect(service.verifyAccessToken('invalid.token.here'))
      .rejects.toThrow();
  });
});
