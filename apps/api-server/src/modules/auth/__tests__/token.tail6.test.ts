import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TokenService } from '../token.service';
import { container } from '../../core/container';

describe('Token Service Tail 6', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-test-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-test-refresh-secret';
    process.env.ADMIN_JWT_SECRET = 'test-admin-secret-test-admin-secret';
    container.reset();
  });

  it('verifyAccessToken: handles specific audience requirement mismatch', async () => {
    const service = container.get(TokenService);
    const token = await service.generateAccessToken({ 
        userId: 'u1', email: 'e', roles: [], aud: 'user' 
    } as any);
    
    // Pass isAdmin: false to prevent fallback to ADMIN_SECRET which obscures the audience mismatch error
    await expect(service.verifyAccessToken(token, { audience: 'admin', isAdmin: false }))
      .rejects.toThrow(/Audience mismatch/);
  });

  it('verifyAccessToken: admin scope with unexpected audience (defensive)', async () => {
    const service = container.get(TokenService);
    // Generate an admin token but with a weird audience
    const token = await service.generateAccessToken({ 
        userId: 'a1', email: 'a', roles: [], isAdmin: true, aud: 'web-app' 
    } as any);
    
    await expect(service.verifyAccessToken(token, { isAdmin: true }))
      .rejects.toThrow(/Audience violation: admin scope received unexpected aud/);
  });
});
