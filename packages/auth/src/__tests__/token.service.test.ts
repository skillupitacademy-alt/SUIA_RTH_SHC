import { describe, expect, it, vi } from 'vitest';
import { TokenService } from '../token.service';
import { SignJWT } from 'jose';

vi.mock('jose', async (importOriginal) => {
  const actual = await importOriginal<typeof import('jose')>();
  return {
    ...actual,
    jwtVerify: vi.fn().mockImplementation(async (...args: any[]) => {
      const [token, key] = args;
      const keyStr = new TextDecoder().decode((key as object) instanceof Uint8Array ? key : new TextEncoder().encode(''));
      if (token === 'mock-no-aud-access') {
        return { payload: { userId: 'u1', email: 'test@example.com', roles: ['USER'] } };
      }
      if (token === 'mock-no-aud-refresh') {
        return { payload: { userId: 'u1', isAdmin: false } };
      }
      if (token === 'mock-no-aud-infra') {
        return { payload: { userId: 'u1' } };
      }
      if (token === 'mock-wrong-aud') {
        if (keyStr.includes('admin')) throw new Error('signature verification failed');
        return { payload: { aud: 'wrong' } };
      }
      if (token === 'mock-wrong-aud-array') {
        if (keyStr.includes('admin')) throw new Error('signature verification failed');
        return { payload: { aud: ['wrong'] } };
      }
      if (token === 'mock-mixed-error') {
        if (keyStr.includes('admin')) throw 'string error';
        throw new Error('first error');
      }
      if (token === 'mock-string-error') return Promise.reject('string error');
      return actual.jwtVerify.apply(actual, args as any);
    }),
  };
});

describe('TokenService', () => {
  const service = new TokenService();
  const mockPayload = { userId: 'u1', email: 'test@example.com', roles: ['USER'] };
  
  it('extracts access tokens from cookies before authorization header', () => {
    const token1 = service.getAccessToken({ cookies: { get: (name: string) => name === 'accessToken' ? { value: 'cookie-user' } : undefined } }, { scope: 'user' });
    expect(token1).toBe('cookie-user');
    
    const token2 = service.getAccessToken({ cookies: { get: (name: string) => name === 'admin_accessToken' ? { value: 'cookie-admin' } : undefined } }, { scope: 'admin' });
    expect(token2).toBe('cookie-admin');

    const token3 = service.getAccessToken({ cookies: { get: (name: string) => name === 'infra_accessToken' ? { value: 'cookie-infra' } : undefined } }, { scope: 'infrastructure' });
    expect(token3).toBe('cookie-infra');

    const token4 = service.getAccessToken({ cookies: { get: (name: string) => name === 'accessToken' ? { value: 'cookie-any' } : undefined } });
    expect(token4).toBe('cookie-any');

    const token5 = service.getAccessToken({ headers: { get: () => 'Bearer header-token' } });
    expect(token5).toBe('header-token');
  });

  it('hashes token values deterministically', async () => {
    const hash = await service.hashToken('abc');
    expect(hash).toHaveLength(64);
    expect(await TokenService.hashToken('abc')).toBe(hash);
  });

  describe('AccessToken generation and verification', () => {
    it('generates and verifies user access token', async () => {
      const token = await service.generateAccessToken({ ...mockPayload, isAdmin: false });
      const verified = await service.verifyUserAccessToken(token);
      expect(verified.userId).toBe('u1');
      expect(verified.aud).toBe('user');
    });

    it('generates and verifies admin access token', async () => {
      const token = await service.generateAccessToken({ ...mockPayload, isAdmin: true });
      const verified = await service.verifyAdminAccessToken(token);
      expect(verified.isAdmin).toBe(true);
      expect(verified.aud).toBe('admin');
    });

    it('fails to verify user token as admin', async () => {
      const token = await service.generateAccessToken({ ...mockPayload, isAdmin: false });
      await expect(service.verifyAdminAccessToken(token)).rejects.toThrow();
    });

    it('fails to verify admin token as user', async () => {
      const token = await service.generateAccessToken({ ...mockPayload, isAdmin: true });
      await expect(service.verifyUserAccessToken(token)).rejects.toThrow();
    });

    it('verifies access token dynamically based on signature', async () => {
      const userToken = await service.generateAccessToken({ ...mockPayload, isAdmin: false });
      const adminToken = await service.generateAccessToken({ ...mockPayload, isAdmin: true });

      await expect(service.verifyAccessToken(userToken)).resolves.toMatchObject({ userId: 'u1' });
      await expect(service.verifyAccessToken(adminToken)).resolves.toMatchObject({ userId: 'u1' });
    });

    it('enforces audience correctly if specified', async () => {
      const token = await service.generateAccessToken({ ...mockPayload, aud: 'custom-aud' });
      await expect(service.verifyAccessToken(token, { audience: 'custom-aud' })).resolves.toMatchObject({ aud: 'custom-aud' });
      await expect(service.verifyAccessToken(token, { audience: 'wrong-aud' })).rejects.toThrow();
    });

    it('throws audience errors in verifyUserAccessToken', async () => {
      const tokenNoAud = await new SignJWT(mockPayload).setProtectedHeader({ alg: 'HS256' }).sign(TokenService.ACCESS_SECRET);
      await expect(service.verifyUserAccessToken(tokenNoAud)).rejects.toThrow(/Audience mismatch: expected user/);
      
      const tokenWrongAud = await service.generateAccessToken({ ...mockPayload, aud: 'wrong' });
      await expect(service.verifyUserAccessToken(tokenWrongAud, { audience: 'user' })).rejects.toThrow(/Audience mismatch: expected user, got wrong/);
    });

    it('verifies admin token with empty audience option', async () => {
      const token = await service.generateAccessToken({ ...mockPayload, isAdmin: true, aud: 'admin' });
      await expect(service.verifyAdminAccessToken(token, { audience: '' })).resolves.toBeTruthy();
      await expect(service.verifyAdminAccessToken(token, { audience: null as any })).resolves.toBeTruthy();
      await expect(service.verifyAdminAccessToken(token, { audience: undefined })).resolves.toBeTruthy();
    });

    it('throws audience errors in verifyAdminAccessToken', async () => {
      const token = await service.generateAccessToken({ ...mockPayload, isAdmin: true, aud: 'wrong' });
      await expect(service.verifyAdminAccessToken(token, { audience: 'admin' })).rejects.toThrow(/Audience mismatch: expected admin, got wrong/);
      
      const tokenUnrelated = await service.generateAccessToken({ ...mockPayload, isAdmin: true, aud: 'unrelated' });
      await expect(service.verifyAdminAccessToken(tokenUnrelated)).rejects.toThrow(/Audience violation/);
    });

    it('throws custom error for verifyAccessToken with isAdmin: false', async () => {
      const invalidToken = 'invalid.token.here';
      await expect(service.verifyAccessToken(invalidToken, { isAdmin: false })).rejects.toThrow();
    });

    it('throws audience mismatch for access tokens without aud', async () => {
      await expect(service.verifyAccessToken('mock-no-aud-access', { isAdmin: false, audience: 'user' })).rejects.toThrow(/Audience mismatch: expected user/);
    });

    it('normalizes non-Error failures in verifyAccessToken when isAdmin is false', async () => {
      await expect(service.verifyAccessToken('mock-string-error', { isAdmin: false })).rejects.toThrow('Invalid token signature or audience mismatch');
    });
  });

  describe('RefreshToken generation and verification', () => {
    it('generates and verifies user refresh token', async () => {
      const token = await service.generateRefreshToken('u1', false);
      const verified = await service.verifyRefreshToken(token);
      expect(verified.userId).toBe('u1');
      expect(verified.aud).toBe('user');
    });

    it('generates and verifies admin refresh token', async () => {
      const token = await service.generateRefreshToken('u1', true, 'admin');
      const verified = await service.verifyRefreshToken(token);
      expect(verified.userId).toBe('u1');
      expect(verified.aud).toBe('admin');
    });

    it('fails to verify refresh token with wrong signature', async () => {
      const token = await new SignJWT({ userId: 'u1' }).setProtectedHeader({ alg: 'HS256' }).sign(new TextEncoder().encode('wrong'));
      await expect(service.verifyRefreshToken(token)).rejects.toThrow();
    });

    it('throws audience mismatch in verifyRefreshToken', async () => {
      const token = await service.generateRefreshToken('u1', false, 'wrong');
      await expect(service.verifyRefreshToken(token, { audience: 'user' })).rejects.toThrow();
    });

    it('throws audience mismatch for refresh tokens without aud', async () => {
      await expect(service.verifyRefreshToken('mock-no-aud-refresh', { audience: 'user' })).rejects.toThrow(/Audience mismatch: expected user/);
    });

    it('throws generic error in verifyRefreshToken inner catch block', async () => {
      await expect(service.verifyRefreshToken('completely.invalid.token')).rejects.toThrow();
    });

    it('verifies refresh token with empty audience option', async () => {
      const token = await service.generateRefreshToken('u1', false, 'user');
      await expect(service.verifyRefreshToken(token, { audience: '' })).resolves.toBeTruthy();
      await expect(service.verifyRefreshToken(token, { audience: null as any })).resolves.toBeTruthy();
      await expect(service.verifyRefreshToken(token, { audience: undefined })).resolves.toBeTruthy();
    });

    it('throws audience mismatch from custom validation in verifyRefreshToken', async () => {
      await expect(service.verifyRefreshToken('mock-wrong-aud', { audience: 'user' })).rejects.toThrow();
    });

    it('throws audience mismatch with array aud in verifyRefreshToken', async () => {
      await expect(service.verifyRefreshToken('mock-wrong-aud-array', { audience: 'user' })).rejects.toThrow();
    });

    it('throws generic error in verifyRefreshToken fallback when non-Error is thrown', async () => {
      await expect(service.verifyRefreshToken('mock-string-error')).rejects.toThrow('Invalid refresh token signature or audience mismatch');
    });

    it('throws first error in verifyRefreshToken fallback when second error is generic', async () => {
      await expect(service.verifyRefreshToken('mock-mixed-error')).rejects.toThrow('first error');
    });

    it('throws generic error in verifyRefreshToken fallback when non-Error is thrown', async () => {
      await expect(service.verifyRefreshToken('mock-string-error')).rejects.toThrow('Invalid refresh token signature or audience mismatch');
    });
  });

  describe('Expiration helpers', () => {
    it('reads token expiration safely', async () => {
      const token = await service.generateAccessToken(mockPayload, '1h');
      const exp = service.getExpiration(token);
      expect(exp).toBeTruthy();
      
      const payload = await service.verifyAccessToken(token);
      expect(service.getExpiryISO(payload)).toBe(exp);
      expect(TokenService.getExpiration(token)).toBe(exp);
      expect(TokenService.getExpiryISO(payload)).toBe(exp);
    });

    it('returns null for invalid token expiration', () => {
      expect(service.getExpiration('invalid.token.format')).toBeNull();
    });
    
    it('returns null for valid token missing expiration', async () => {
      const token = await new SignJWT({}).setProtectedHeader({ alg: 'HS256' }).sign(new TextEncoder().encode('secret'));
      expect(service.getExpiration(token)).toBeNull();
    });
  });

  describe('Static facade', () => {
    it('exposes generic verification methods', async () => {
      const token = await TokenService.generateAccessToken(mockPayload);
      await expect(TokenService.verifyUserAccessToken(token)).resolves.toBeTruthy();
      await expect(TokenService.verifyAccessToken(token)).resolves.toBeTruthy();
      
      const adminToken = await TokenService.generateAccessToken({ ...mockPayload, isAdmin: true });
      await expect(TokenService.verifyAdminAccessToken(adminToken)).resolves.toBeTruthy();
    });

    it('exposes refresh token static methods', async () => {
      const token = await TokenService.generateRefreshToken('u1');
      await expect(TokenService.verifyRefreshToken(token)).resolves.toBeTruthy();
      await expect(TokenService.verifyUserRefreshToken(token)).resolves.toBeTruthy();
      
      const adminToken = await TokenService.generateRefreshToken('u1', true, 'admin');
      await expect(TokenService.verifyAdminRefreshToken(adminToken, { audience: 'admin' })).resolves.toBeTruthy();
    });
    
    it('exposes infra access token method', async () => {
      const token = await new SignJWT({ aud: 'infra' }).setProtectedHeader({ alg: 'HS256' }).sign(TokenService.ACCESS_SECRET);
      await expect(TokenService.verifyInfraAccessToken(token)).resolves.toMatchObject({ aud: 'infra' });
    });

    it('verifies infra token with empty audience option', async () => {
      const token = await new SignJWT({ aud: 'infra' }).setProtectedHeader({ alg: 'HS256' }).sign(TokenService.ACCESS_SECRET);
      await expect(TokenService.verifyInfraAccessToken(token, { audience: '' })).rejects.toThrow();
      await expect(TokenService.verifyInfraAccessToken(token, { audience: null as any })).resolves.toBeTruthy();
      await expect(TokenService.verifyInfraAccessToken(token, { audience: undefined })).resolves.toBeTruthy();
    });

    it('throws audience mismatch in verifyInfraAccessToken', async () => {
      const token = await new SignJWT({ aud: 'wrong' }).setProtectedHeader({ alg: 'HS256' }).sign(TokenService.ACCESS_SECRET);
      await expect(TokenService.verifyInfraAccessToken(token)).rejects.toThrow(/Audience mismatch/i);
    });

    it('throws audience mismatch for infra tokens without aud', async () => {
      await expect(TokenService.verifyInfraAccessToken('mock-no-aud-infra')).rejects.toThrow(/Audience mismatch: expected infra/);
    });
    
    it('uses fallback to verifyUserAccessToken in verifyAdminAccessToken static method', async () => {
      const adminToken = await TokenService.generateAccessToken({ ...mockPayload, isAdmin: true });
      const mockInst = new TokenService();
      
      mockInst.verifyAdminAccessToken = undefined as any;
      mockInst.verifyAccessToken = undefined as any;
      TokenService.setInstance(mockInst);
      
      await expect(TokenService.verifyAdminAccessToken(adminToken)).rejects.toThrow();
      
      TokenService.setInstance(null as any); // reset
    });

    it('uses fallback to verifyAccessToken in verifyAdminAccessToken static method', async () => {
      const mockInst = new TokenService();
      
      mockInst.verifyAdminAccessToken = undefined as any;
      // verifyAccessToken is preserved
      TokenService.setInstance(mockInst);
      
      const userToken = await TokenService.generateAccessToken({ ...mockPayload, isAdmin: false });
      await expect(TokenService.verifyAdminAccessToken(userToken, { audience: 'admin' })).rejects.toThrow();
      
      TokenService.setInstance(null as any); // reset
    });

    it('uses fallback to verifyUserRefreshToken in verifyRefreshToken static method', async () => {
      const mockInst = new TokenService();
      
      mockInst.verifyRefreshToken = undefined as any;
      // verifyUserRefreshToken is preserved
      TokenService.setInstance(mockInst);
      
      const token = await TokenService.generateRefreshToken('u1');
      await expect(TokenService.verifyRefreshToken(token)).resolves.toBeTruthy();
      
      TokenService.setInstance(null as any); // reset
    });

    it('throws when fallback methods are missing in verifyAdminAccessToken', async () => {
      const mockInst = new TokenService();
      
      // simulate broken implementation
      mockInst.verifyAdminAccessToken = undefined as any;
      mockInst.verifyAccessToken = undefined as any;
      mockInst.verifyUserAccessToken = undefined as any;
      
      TokenService.setInstance(mockInst);
      await expect(TokenService.verifyAdminAccessToken('token')).rejects.toThrow('verifyAdminAccessToken not implemented');
      
      TokenService.setInstance(null as any); // resets singleton
    });

    it('throws when fallback methods are missing in verifyRefreshToken', async () => {
      const mockInst = new TokenService();
      
      // simulate broken implementation
      mockInst.verifyRefreshToken = undefined as any;
      mockInst.verifyUserRefreshToken = undefined as any;
      
      TokenService.setInstance(mockInst);
      expect(() => TokenService.verifyRefreshToken('token')).toThrow('verifyRefreshToken not implemented');

      TokenService.setInstance(null as any); // resets singleton
    });
  });
});
