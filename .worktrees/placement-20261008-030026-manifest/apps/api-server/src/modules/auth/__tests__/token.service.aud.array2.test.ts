import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('jose', () => ({
  jwtVerify: vi.fn(async (_t, _s) => ({
    payload: {
      aud: ['user'],
      userId: 'u1',
      originalUserId: 'u1',
      shadowUserId: 'shadow-u1',
      tokenType: 'user',
    },
  })),
}));

import { jwtVerify } from 'jose';
import { TokenService } from '@/modules/auth/token.service';

describe('TokenService audience array coverage', () => {
  let service: TokenService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TokenService();
  });

  it('handles array audience for user token', async () => {
    const payload = await service.verifyUserAccessToken('tok');
    expect(payload.userId).toBe('u1');
    expect(jwtVerify).toHaveBeenCalled();
  });

  it('handles array audience for admin token', async () => {
    (jwtVerify as any).mockResolvedValueOnce({
      payload: {
        aud: ['admin', 'infra'],
        isAdmin: true,
        userId: 'a1',
        originalUserId: 'a1',
        shadowUserId: 'shadow-a1',
        tokenType: 'admin',
      },
    });
    const payload = await service.verifyAdminAccessToken('tok');
    expect(payload.isAdmin).toBe(true);
  });
});
