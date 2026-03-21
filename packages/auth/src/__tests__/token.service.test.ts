import { describe, expect, it, vi, beforeEach } from 'vitest';

import { TokenService } from '../token.service';

vi.mock('jose', () => ({
  decodeJwt: vi.fn().mockReturnValue({ exp: 1 }),
  jwtVerify: vi.fn(),
  SignJWT: class {
    setProtectedHeader() {
      return this;
    }

    setAudience() {
      return this;
    }

    setIssuedAt() {
      return this;
    }

    setExpirationTime() {
      return this;
    }

    async sign() {
      return 'signed-token';
    }
  },
}));

describe('TokenService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('extracts access tokens from cookies before authorization header', () => {
    const service = new TokenService();
    const token = service.getAccessToken({
      cookies: {
        get: (name: string) => (name === 'accessToken' ? { value: 'cookie-token' } : undefined),
      },
      headers: {
        get: () => 'Bearer header-token',
      },
    });

    expect(token).toBe('cookie-token');
  });

  it('hashes token values deterministically', async () => {
    const service = new TokenService();
    await expect(service.hashToken('abc')).resolves.toHaveLength(64);
  });

  it('generates access tokens with the shared signing helper', async () => {
    const service = new TokenService();
    await expect(
      service.generateAccessToken({
        userId: 'u1',
        email: 'learner@example.com',
        roles: ['USER'],
        isAdmin: false,
      })
    ).resolves.toBe('signed-token');
  });

  it('exposes the static compatibility facade', async () => {
    await expect(TokenService.generateRefreshToken('u1')).resolves.toBe('signed-token');
  });
});
