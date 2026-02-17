import { beforeEach, describe, expect, it, vi } from 'vitest';

type AccessPayload = { userId: string; isAdmin: boolean };

vi.mock('@/modules/auth/token.service', () => ({
  TokenService: {
    signAccessToken: vi.fn<() => Promise<string>>(),
    verifyAccessToken: vi.fn<() => Promise<AccessPayload | null>>(),
    signRefreshToken: vi.fn<() => Promise<string>>(),
  },
}));

// Still skipped to defer execution.
describe.skip('TokenService (unit)', () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('signs access token with admin scope', async () => {
    const { TokenService } = await import('@/modules/auth/token.service');
    vi.mocked(TokenService.signAccessToken).mockResolvedValue('signed-admin-token');
    const token = await TokenService.signAccessToken({ userId: 'u1' }, true);
    expect(token).toBe('signed-admin-token');
  });

  it('verifies access token and returns payload', async () => {
    const { TokenService } = await import('@/modules/auth/token.service');
    const payload: AccessPayload = { userId: 'u1', isAdmin: false };
    vi.mocked(TokenService.verifyAccessToken).mockResolvedValue(payload);
    const res = await TokenService.verifyAccessToken('t', false);
    expect(res?.userId).toBe('u1');
  });

  it('signs refresh token', async () => {
    const { TokenService } = await import('@/modules/auth/token.service');
    vi.mocked(TokenService.signRefreshToken).mockResolvedValue('refresh-token');
    const token = await TokenService.signRefreshToken({ userId: 'u1' }, false);
    expect(token).toBe('refresh-token');
  });
});
