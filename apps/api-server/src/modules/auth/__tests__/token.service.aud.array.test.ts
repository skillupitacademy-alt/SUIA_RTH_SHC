import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Forces Array.isArray(tokenAud) === true inside verifyUserAccessToken (L134-136)
 * and verifyAdminAccessToken (L156-158).
 */

const h = vi.hoisted(() => ({
  jwtVerify: vi.fn(),
}));

vi.mock('jose', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return { ...actual, jwtVerify: h.jwtVerify };
});

describe('TokenService Array aud branch coverage', () => {
  const userPayload = (overrides: Record<string, unknown> = {}) => ({
    userId: 'u1',
    originalUserId: 'u1',
    shadowUserId: 'shadow-u1',
    email: 'a@b.com',
    roles: ['USER'],
    tokenType: 'user',
    ...overrides,
  });

  const adminPayload = (overrides: Record<string, unknown> = {}) => ({
    userId: 'a1',
    originalUserId: 'a1',
    shadowUserId: 'shadow-a1',
    email: 'a@b.com',
    roles: ['ADMIN'],
    isAdmin: true,
    tokenType: 'admin',
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── verifyUserAccessToken: Array.isArray(tokenAud) === true (L134-136) ───

  it('verifyUserAccessToken with array aud matching requested audience', async () => {
    h.jwtVerify.mockResolvedValueOnce({
      payload: userPayload({ aud: ['user', 'exam'] }),
    });

    const { TokenService } = await import('../token.service');
    const service = new TokenService();
    const result = await service.verifyUserAccessToken('tok', { audience: 'user' });
    expect(result.userId).toBe('u1');
  });

  it('verifyUserAccessToken with array aud NOT matching requested audience', async () => {
    h.jwtVerify.mockResolvedValueOnce({
      payload: userPayload({ userId: 'u2', originalUserId: 'u2', shadowUserId: 'shadow-u2', aud: ['exam', 'quiz'] }),
    });

    const { TokenService } = await import('../token.service');
    const service = new TokenService();
    await expect(
      service.verifyUserAccessToken('tok', { audience: 'admin' })
    ).rejects.toThrow(/Audience mismatch/);
  });

  it('verifyUserAccessToken with array aud and no enforcement', async () => {
    h.jwtVerify.mockResolvedValueOnce({
      payload: userPayload({ userId: 'u3', originalUserId: 'u3', shadowUserId: 'shadow-u3', aud: ['user'] }),
    });

    const { TokenService } = await import('../token.service');
    const service = new TokenService();
    const result = await service.verifyUserAccessToken('tok');
    expect(result.userId).toBe('u3');
  });

  // ─── verifyAdminAccessToken: Array.isArray(tokenAud) === true (L156-158) ───

  it('verifyAdminAccessToken with array aud matching requested audience', async () => {
    h.jwtVerify.mockResolvedValueOnce({
      payload: adminPayload({ aud: ['admin', 'infra'] }),
    });

    const { TokenService } = await import('../token.service');
    const service = new TokenService();
    const result = await service.verifyAdminAccessToken('tok', { audience: 'admin' });
    expect(result.userId).toBe('a1');
  });

  it('verifyAdminAccessToken with array aud containing non-admin values (L169)', async () => {
    h.jwtVerify.mockResolvedValueOnce({
      payload: adminPayload({ userId: 'a2', originalUserId: 'a2', shadowUserId: 'shadow-a2', aud: ['user', 'exam'] }),
    });

    const { TokenService } = await import('../token.service');
    const service = new TokenService();
    await expect(
      service.verifyAdminAccessToken('tok')
    ).rejects.toThrow(/Audience violation/);
  });

  it('verifyAdminAccessToken with array aud [admin, infra] without enforcement passes', async () => {
    h.jwtVerify.mockResolvedValueOnce({
      payload: adminPayload({ userId: 'a3', originalUserId: 'a3', shadowUserId: 'shadow-a3', aud: ['admin', 'infra'] }),
    });

    const { TokenService } = await import('../token.service');
    const service = new TokenService();
    const result = await service.verifyAdminAccessToken('tok');
    expect(result.userId).toBe('a3');
  });
});
