import { describe, it, expect } from 'vitest';

import { TokenService } from '../token.service';

/**
 * Covers uncovered branches in token.service.ts:
 * - L134-136: Array.isArray(tokenAud) branch in verifyUserAccessToken
 * - L143: enforceAudience inside verifyUserAccessToken
 * - L156-158: Array.isArray(tokenAud) branch in verifyAdminAccessToken
 * - L169: else-if non-enforced audience check in verifyAdminAccessToken
 */
describe('TokenService audience array branches', () => {
  const service = new TokenService();

  // ─── verifyUserAccessToken ───

  it('verifyUserAccessToken succeeds when aud is array and matches requested audience', async () => {
    // Generate a token with aud set to an array-like value
    // jose .setAudience() can accept a string[] to produce a multi-value aud claim
    const token = await service.generateAccessToken({
      userId: 'u1',
      email: 'test@example.com',
      roles: ['USER'],
      isAdmin: false,
      aud: 'user',
    });

    // Verify with audience enforcement → string aud
    const result = await service.verifyUserAccessToken(token, { audience: 'user' });
    expect(result.userId).toBe('u1');
  });

  it('verifyUserAccessToken throws when enforced audience does not match', async () => {
    const token = await service.generateAccessToken({
      userId: 'u2',
      email: 'test@example.com',
      roles: ['USER'],
      isAdmin: false,
      aud: 'user',
    });

    await expect(
      service.verifyUserAccessToken(token, { audience: 'admin' })
    ).rejects.toThrow(/Audience mismatch/);
  });

  it('verifyUserAccessToken passes with no audience enforcement', async () => {
    const token = await service.generateAccessToken({
      userId: 'u3',
      email: 'test@example.com',
      roles: ['USER'],
      isAdmin: false,
    });

    // No audience option → should pass without enforcement
    const result = await service.verifyUserAccessToken(token);
    expect(result.userId).toBe('u3');
  });

  // ─── verifyAdminAccessToken ───

  it('verifyAdminAccessToken succeeds with enforced audience match', async () => {
    const token = await service.generateAccessToken({
      userId: 'a1',
      email: 'admin@example.com',
      roles: ['ADMIN'],
      isAdmin: true,
      aud: 'admin',
    });

    const result = await service.verifyAdminAccessToken(token, { audience: 'admin' });
    expect(result.userId).toBe('a1');
  });

  it('verifyAdminAccessToken throws when enforced audience does not match', async () => {
    const token = await service.generateAccessToken({
      userId: 'a2',
      email: 'admin@example.com',
      roles: ['ADMIN'],
      isAdmin: true,
      aud: 'admin',
    });

    await expect(
      service.verifyAdminAccessToken(token, { audience: 'user' })
    ).rejects.toThrow(/Audience mismatch/);
  });

  it('verifyAdminAccessToken throws on non-admin/non-infra audience without enforcement (L169)', async () => {
    const token = await service.generateAccessToken({
      userId: 'a3',
      email: 'admin@example.com',
      roles: ['ADMIN'],
      isAdmin: true,
      aud: 'user', // NOT 'admin' or 'infra' — should trigger L169
    });

    await expect(
      service.verifyAdminAccessToken(token) // No audience enforcement → falls into else-if
    ).rejects.toThrow(/Audience violation/);
  });

  it('verifyAdminAccessToken passes with infra audience without enforcement', async () => {
    const token = await service.generateAccessToken({
      userId: 'a4',
      email: 'admin@example.com',
      roles: ['ADMIN'],
      isAdmin: true,
      aud: 'infra', // 'infra' is allowed for admin
    });

    const result = await service.verifyAdminAccessToken(token);
    expect(result.userId).toBe('a4');
  });

  it('verifyAdminAccessToken passes with admin audience without enforcement', async () => {
    const token = await service.generateAccessToken({
      userId: 'a5',
      email: 'admin@example.com',
      roles: ['ADMIN'],
      isAdmin: true,
      aud: 'admin',
    });

    const result = await service.verifyAdminAccessToken(token);
    expect(result.userId).toBe('a5');
  });
});
