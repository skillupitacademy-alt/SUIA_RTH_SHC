import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TokenService } from '../token.service';
import * as jose from 'jose';

vi.mock('jose', async () => {
  const actual = await vi.importActual<typeof import('jose')>('jose');
  return {
    ...actual,
    jwtVerify: vi.fn(),
    decodeJwt: vi.fn(),
  };
});

describe('TokenService verification branches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('enforces explicit audience mismatch branch', async () => {
    vi.mocked(jose.jwtVerify).mockResolvedValue({ payload: { aud: 'weird' } } as any);
    const service = new TokenService();
    await expect(service.verifyInfraAccessToken('tok')).rejects.toThrow(
      'Audience mismatch: expected infra, got weird',
    );
  });

  it('hits admin-scope audience violation branch for unknown audience', async () => {
    vi.mocked(jose.jwtVerify).mockResolvedValue({ payload: { aud: ['partner'] } } as any);
    const service = new TokenService();
    await expect(service.verifyAdminAccessToken('tok')).rejects.toThrow(
      'Audience violation: admin scope received unexpected aud partner',
    );
  });

  it('hits fallback error wrapping branch when jwtVerify throws non-Error', async () => {
    vi.mocked(jose.jwtVerify).mockRejectedValue('bad-jwt');
    const service = new TokenService();
    await expect(service.verifyAccessToken('tok')).rejects.toThrow(
      'Invalid token signature or audience mismatch',
    );
  });

  it('covers no-audience payload path and refresh verify error propagation', async () => {
    vi.mocked(jose.jwtVerify).mockResolvedValueOnce({ payload: {} } as any);
    const service = new TokenService();
    await expect(service.verifyAccessToken('tok', { audience: '' as any })).resolves.toEqual({});

    vi.mocked(jose.jwtVerify).mockRejectedValueOnce(new Error('Invalid Compact JWS'));
    await expect(service.verifyRefreshToken('tok')).rejects.toThrow('Invalid Compact JWS');
  });

  it('rejects explicit audience when token has no aud claim', async () => {
    vi.mocked(jose.jwtVerify).mockResolvedValue({ payload: {} } as any);
    const service = new TokenService();
    await expect(service.verifyUserAccessToken('tok')).rejects.toThrow('Audience mismatch');
  });

  it('accepts admin verification when no audience exists and enforcement is off', async () => {
    vi.mocked(jose.jwtVerify).mockResolvedValue({ payload: { userId: 'admin1' } } as any);
    const service = new TokenService();
    await expect(service.verifyAdminAccessToken('tok')).resolves.toMatchObject({ userId: 'admin1' });
  });

  it('getExpiration returns null when exp missing or decode throws', () => {
    vi.mocked(jose.decodeJwt).mockReturnValueOnce({} as any);
    const service = new TokenService();
    expect(service.getExpiration('tok')).toBeNull();

    vi.mocked(jose.decodeJwt).mockImplementationOnce(() => {
      throw new Error('decode failed');
    });
    expect(service.getExpiration('tok')).toBeNull();
  });
});
