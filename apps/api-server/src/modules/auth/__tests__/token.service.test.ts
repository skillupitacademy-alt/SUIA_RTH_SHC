import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TokenService } from '../token.service';
import { container } from '../../core/container';
import type { NextRequest } from 'next/server';

describe('TokenService (unit)', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-test-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-test-refresh-secret';
    process.env.ADMIN_JWT_SECRET = 'test-admin-secret-test-admin-secret';
    container.reset();
  });

  it('signs and verifies access token', async () => {
    const service = container.get(TokenService);
    const payload = { userId: 'u1', email: 'u@u.com', roles: ['USER'], aud: 'user' } as any;
    const token = await service.generateAccessToken(payload);
    const decoded = await service.verifyAccessToken(token);
    expect(decoded.userId).toBe('u1');
  });

  it('signs refresh token', async () => {
    const service = container.get(TokenService);
    const token = await service.generateRefreshToken('u1', false, 'user');
    expect(token).toBeDefined();
    const decoded = await service.verifyRefreshToken(token, { audience: 'user' });
    expect(decoded.userId).toBe('u1');
  });

  it('hashes token', async () => {
    const service = container.get(TokenService);
    const hash = await service.hashToken('test-token');
    expect(hash).toHaveLength(64); // SHA-256 hex
  });

  it('getAccessToken: extracts from Authorization header', () => {
    const service = container.get(TokenService);
    const mockReq = {
      cookies: { get: () => undefined },
      headers: { get: (name: string) => name === 'authorization' ? 'Bearer my-token' : null }
    } as unknown as NextRequest;
    expect(service.getAccessToken(mockReq)).toBe('my-token');
  });
});
