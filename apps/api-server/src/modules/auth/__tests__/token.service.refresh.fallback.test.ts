import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as jose from 'jose';

import { TokenService } from '../token.service';

vi.mock('jose', async () => {
  const actual = await vi.importActual<typeof import('jose')>('jose');
  return {
    ...actual,
    jwtVerify: vi.fn(),
  };
});

describe('TokenService refresh fallback branches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('falls back to admin refresh secret when user verification fails', async () => {
    const firstError = new Error('user refresh failed');
    vi.mocked(jose.jwtVerify)
      .mockRejectedValueOnce(firstError)
      .mockResolvedValueOnce({ payload: { aud: 'admin', userId: 'u1', isAdmin: true } } as any);

    const service = new TokenService();
    const result = await service.verifyRefreshToken('tok', { audience: 'admin' });
    expect(result.userId).toBe('u1');
    expect(jose.jwtVerify).toHaveBeenCalledTimes(2);
  });

  it('normalizes non-Error failures for both attempts', async () => {
    vi.mocked(jose.jwtVerify)
      .mockRejectedValueOnce('string-error-1' as any)
      .mockRejectedValueOnce('string-error-2' as any);

    const service = new TokenService();
    await expect(service.verifyRefreshToken('tok')).rejects.toThrow(
      'Invalid refresh _token signature or audience mismatch',
    );
  });

  it('enforces audience mismatch after successful verification', async () => {
    vi.mocked(jose.jwtVerify).mockResolvedValue({ payload: { aud: 'admin', userId: 'u2', isAdmin: true } } as any);
    const service = new TokenService();
    await expect(service.verifyRefreshToken('tok', { audience: 'user' })).rejects.toThrow(
      /Audience mismatch/,
    );
  });

  it('covers refresh generation/admin secret and infra static facade', async () => {
    // Uses real SignJWT path for coverage of generateRefreshToken admin branch (line ~119)
    const service = new TokenService();
    const token = await service.generateRefreshToken('u3', true, 'admin');
    expect(typeof token).toBe('string');

    vi.mocked(jose.jwtVerify).mockResolvedValue({ payload: { aud: ['infra'], userId: 'infra1' } } as any);
    await expect(TokenService.verifyInfraAccessToken('tok')).resolves.toMatchObject({ userId: 'infra1' });
  });
});
