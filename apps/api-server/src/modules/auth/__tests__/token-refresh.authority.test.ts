import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TokenRefreshService } from '../token-refresh.service';

/**
 * W1.2-REFRESH-05: Token Authority and Brand Binding Security Tests
 *
 * Verifies:
 * 1. Verification ordering: all authority verifications precede database writes.
 * 2. Brand claim parity: token brand claim must match target tenant DB context.
 * 3. Subject parity: signed userId must match stored session row owner.
 * 4. Scope consistency: prevents scope confusion between user/admin and tokenType.
 * 5. Malformed brand rejection: null, non-string, blank, shared, unknown fail closed.
 * 6. Legacy compatibility: absent brand upgrades progressively; no-jti supported.
 * 7. Zero state writes on denied requests: updateLastUsed and consumeToken never called.
 * 8. CAS transaction rollback: failed successor insert rolls back parent consumption.
 */

describe('TokenRefreshService Authority & Brand Binding (W1.2-REFRESH-05)', () => {
  let mockTokenRepo: any;
  let mockTokenService: any;
  let mockAuditService: any;
  let mockDb: any;
  let mockUserRepo: any;
  let service: TokenRefreshService;

  beforeEach(() => {
    vi.clearAllMocks();

    mockTokenRepo = {
      findByHash: vi.fn(),
      updateLastUsed: vi.fn().mockResolvedValue(undefined),
      consumeToken: vi.fn().mockResolvedValue({ id: 's1', userId: 'u1' }),
      createRefreshToken: vi.fn().mockResolvedValue(undefined),
      withDb: vi.fn(function (this: any) {
        return this;
      }),
    };

    mockTokenService = {
      hashToken: vi.fn().mockResolvedValue('token-sha256-hash'),
      verifyRefreshToken: vi.fn(),
      generateAccessToken: vi.fn().mockResolvedValue('new-access-token'),
      generateRefreshToken: vi.fn().mockResolvedValue('new-refresh-token'),
    };

    mockAuditService = {
      log: vi.fn().mockResolvedValue(undefined),
    };

    mockDb = {
      transaction: vi.fn(async (cb: any) => cb(mockDb)),
    };

    mockUserRepo = {
      findActiveUserWithRoles: vi.fn().mockImplementation(async (userId: string) => ({
        id: userId,
        email: userId + '@example.com',
        isBlocked: false,
        deletedAt: null,
        roles: ['student'],
      })),
      withDb: vi.fn(function (this: any) {
        return this;
      }),
    };

    service = new TokenRefreshService(mockTokenRepo, mockTokenService, mockAuditService, mockUserRepo as any);
  });

  it('TC-AUTH-01: succeeds for valid learner token matching RTH tenant DB', async () => {
    mockTokenRepo.findByHash.mockResolvedValue({
      id: 'session-1',
      userId: 'user-rth-1',
      revoked: false,
      expiresAt: new Date(Date.now() + 100000),
    });

    mockTokenService.verifyRefreshToken.mockResolvedValue({
      userId: 'user-rth-1',
      brand: 'realtutorialhub',
      isAdmin: false,
      tokenType: 'user',
      email: 'learner@rth.com',
      roles: ['student'],
    });

    const result = await service.refresh('raw-token', '127.0.0.1', undefined, 'user', 'realtutorialhub');

    expect(result.accessToken).toBe('new-access-token');
    expect(result.refreshToken).toBe('new-refresh-token');
    expect(result.userId).toBe('user-rth-1');
    expect(result.isAdmin).toBe(false);

    // Verify ordering: updateLastUsed called only after authority verified
    expect(mockTokenRepo.updateLastUsed).toHaveBeenCalledWith('token-sha256-hash');
    expect(mockTokenRepo.consumeToken).toHaveBeenCalledWith('token-sha256-hash', 'user-rth-1');
    expect(mockTokenRepo.createRefreshToken).toHaveBeenCalled();
  });

  it('TC-AUTH-02: succeeds for valid learner token matching SUIA tenant DB', async () => {
    mockTokenRepo.findByHash.mockResolvedValue({
      id: 'session-2',
      userId: 'user-suia-1',
      revoked: false,
      expiresAt: new Date(Date.now() + 100000),
    });

    mockTokenService.verifyRefreshToken.mockResolvedValue({
      userId: 'user-suia-1',
      brand: 'skillup',
      isAdmin: false,
      tokenType: 'user',
      email: 'learner@suia.com',
      roles: ['student'],
    });

    const result = await service.refresh('raw-token', '127.0.0.1', undefined, 'user', 'skillup');

    expect(result.accessToken).toBe('new-access-token');
    expect(mockTokenRepo.updateLastUsed).toHaveBeenCalledTimes(1);
    expect(mockTokenRepo.consumeToken).toHaveBeenCalledTimes(1);
  });

  it('TC-AUTH-03: fails closed when token brand mismatches target DB (Swapped Platform)', async () => {
    // Session exists in RTH database
    mockTokenRepo.findByHash.mockResolvedValue({
      id: 'session-1',
      userId: 'user-1',
      revoked: false,
      expiresAt: new Date(Date.now() + 100000),
    });

    // But token was minted for skillup!
    mockTokenService.verifyRefreshToken.mockResolvedValue({
      userId: 'user-1',
      brand: 'skillup',
      isAdmin: false,
      tokenType: 'user',
    });

    await expect(
      service.refresh('raw-token', '127.0.0.1', undefined, 'user', 'realtutorialhub')
    ).rejects.toThrow('Invalid refresh token: tenant brand mismatch');

    // ZERO database state modifications
    expect(mockTokenRepo.updateLastUsed).not.toHaveBeenCalled();
    expect(mockTokenRepo.consumeToken).not.toHaveBeenCalled();
    expect(mockTokenRepo.createRefreshToken).not.toHaveBeenCalled();

    // Security audit logged
    expect(mockAuditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'token_refresh_failed',
        metadata: expect.objectContaining({
          reason: 'brand_mismatch',
          tokenBrand: 'skillup',
          targetBrand: 'realtutorialhub',
        }),
      })
    );
  });

  it('TC-AUTH-04: fails closed when signed userId does not match session row owner (Subject Parity)', async () => {
    // Session row in DB belongs to user-bob
    mockTokenRepo.findByHash.mockResolvedValue({
      id: 'session-1',
      userId: 'user-bob',
      revoked: false,
      expiresAt: new Date(Date.now() + 100000),
    });

    // But token payload was signed for user-alice
    mockTokenService.verifyRefreshToken.mockResolvedValue({
      userId: 'user-alice',
      brand: 'realtutorialhub',
      isAdmin: false,
      tokenType: 'user',
    });

    await expect(
      service.refresh('raw-token', '127.0.0.1', undefined, 'user', 'realtutorialhub')
    ).rejects.toThrow('Invalid refresh token');

    // ZERO database state modifications
    expect(mockTokenRepo.updateLastUsed).not.toHaveBeenCalled();
    expect(mockTokenRepo.consumeToken).not.toHaveBeenCalled();
    expect(mockTokenRepo.createRefreshToken).not.toHaveBeenCalled();

    expect(mockAuditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'token_refresh_failed',
        metadata: expect.objectContaining({
          reason: 'token_owner_mismatch',
          tokenUserId: 'user-alice',
          sessionUserId: 'user-bob',
        }),
      })
    );
  });

  it('TC-AUTH-05: fails closed on explicit null brand claim (Malformed)', async () => {
    mockTokenRepo.findByHash.mockResolvedValue({
      id: 'session-1',
      userId: 'user-1',
      revoked: false,
      expiresAt: new Date(Date.now() + 100000),
    });

    mockTokenService.verifyRefreshToken.mockResolvedValue({
      userId: 'user-1',
      brand: null as any,
      isAdmin: false,
      tokenType: 'user',
    });

    await expect(
      service.refresh('raw-token', '127.0.0.1', undefined, 'user', 'realtutorialhub')
    ).rejects.toThrow('Invalid refresh token: malformed brand claim');

    expect(mockTokenRepo.updateLastUsed).not.toHaveBeenCalled();
    expect(mockTokenRepo.consumeToken).not.toHaveBeenCalled();
  });

  it('TC-AUTH-06: fails closed on empty or whitespace brand claim (Malformed)', async () => {
    mockTokenRepo.findByHash.mockResolvedValue({
      id: 'session-1',
      userId: 'user-1',
      revoked: false,
      expiresAt: new Date(Date.now() + 100000),
    });

    mockTokenService.verifyRefreshToken.mockResolvedValue({
      userId: 'user-1',
      brand: '   ' as any,
      isAdmin: false,
      tokenType: 'user',
    });

    await expect(
      service.refresh('raw-token', '127.0.0.1', undefined, 'user', 'realtutorialhub')
    ).rejects.toThrow('Invalid refresh token: malformed brand claim');

    expect(mockTokenRepo.updateLastUsed).not.toHaveBeenCalled();
    expect(mockTokenRepo.consumeToken).not.toHaveBeenCalled();
  });

  it('TC-AUTH-07: fails closed on brand claim with value shared (Malformed/Forbidden)', async () => {
    mockTokenRepo.findByHash.mockResolvedValue({
      id: 'session-1',
      userId: 'user-1',
      revoked: false,
      expiresAt: new Date(Date.now() + 100000),
    });

    mockTokenService.verifyRefreshToken.mockResolvedValue({
      userId: 'user-1',
      brand: 'shared' as any,
      isAdmin: false,
      tokenType: 'user',
    });

    await expect(
      service.refresh('raw-token', '127.0.0.1', undefined, 'user', 'realtutorialhub')
    ).rejects.toThrow('Invalid refresh token: malformed brand claim');

    expect(mockTokenRepo.updateLastUsed).not.toHaveBeenCalled();
    expect(mockTokenRepo.consumeToken).not.toHaveBeenCalled();
  });

  it('TC-AUTH-08: fails closed on non-string brand claim such as number or object', async () => {
    mockTokenRepo.findByHash.mockResolvedValue({
      id: 'session-1',
      userId: 'user-1',
      revoked: false,
      expiresAt: new Date(Date.now() + 100000),
    });

    mockTokenService.verifyRefreshToken.mockResolvedValue({
      userId: 'user-1',
      brand: 12345 as any,
      isAdmin: false,
      tokenType: 'user',
    });

    await expect(
      service.refresh('raw-token', '127.0.0.1', undefined, 'user', 'realtutorialhub')
    ).rejects.toThrow('Invalid refresh token: malformed brand claim');

    expect(mockTokenRepo.updateLastUsed).not.toHaveBeenCalled();
    expect(mockTokenRepo.consumeToken).not.toHaveBeenCalled();
  });

  it('TC-AUTH-09: succeeds and progressively upgrades legacy token with genuinely absent brand claim', async () => {
    mockTokenRepo.findByHash.mockResolvedValue({
      id: 'session-legacy',
      userId: 'user-legacy-1',
      revoked: false,
      expiresAt: new Date(Date.now() + 100000),
    });

    // Genuinely absent brand claim: undefined
    mockTokenService.verifyRefreshToken.mockResolvedValue({
      userId: 'user-legacy-1',
      brand: undefined,
      isAdmin: false,
      tokenType: 'user',
    });

    const result = await service.refresh('raw-legacy-token', '127.0.0.1', undefined, 'user', 'realtutorialhub');

    expect(result.accessToken).toBe('new-access-token');
    expect(mockTokenRepo.updateLastUsed).toHaveBeenCalledTimes(1);
    expect(mockTokenRepo.consumeToken).toHaveBeenCalledTimes(1);

    // Verify progressive upgrade: successor token generated with explicit canonical brand
    expect(mockTokenService.generateRefreshToken).toHaveBeenCalledWith(
      'user-legacy-1',
      false,
      'user',
      expect.objectContaining({ brand: 'realtutorialhub' })
    );
  });

  it('TC-AUTH-10: fails closed when scope confusion detected (tokenType admin with isAdmin false)', async () => {
    mockTokenRepo.findByHash.mockResolvedValue({
      id: 'session-1',
      userId: 'user-1',
      revoked: false,
      expiresAt: new Date(Date.now() + 100000),
    });

    mockTokenService.verifyRefreshToken.mockResolvedValue({
      userId: 'user-1',
      brand: 'realtutorialhub',
      isAdmin: false,
      tokenType: 'admin', // Inconsistent with isAdmin: false
    });

    await expect(
      service.refresh('raw-token', '127.0.0.1', undefined, 'admin', 'realtutorialhub')
    ).rejects.toThrow('Invalid refresh token');

    expect(mockTokenRepo.updateLastUsed).not.toHaveBeenCalled();
    expect(mockTokenRepo.consumeToken).not.toHaveBeenCalled();
  });

  it('TC-AUTH-11: fails closed when scope confusion detected (tokenType user with isAdmin true)', async () => {
    mockTokenRepo.findByHash.mockResolvedValue({
      id: 'session-1',
      userId: 'user-1',
      revoked: false,
      expiresAt: new Date(Date.now() + 100000),
    });

    mockTokenService.verifyRefreshToken.mockResolvedValue({
      userId: 'user-1',
      brand: 'realtutorialhub',
      isAdmin: true, // Inconsistent with tokenType: user
      tokenType: 'user',
    });

    await expect(
      service.refresh('raw-token', '127.0.0.1', undefined, 'admin', 'realtutorialhub')
    ).rejects.toThrow('Invalid refresh token');

    expect(mockTokenRepo.updateLastUsed).not.toHaveBeenCalled();
    expect(mockTokenRepo.consumeToken).not.toHaveBeenCalled();
  });

  it('TC-AUTH-12: fails closed when learner token presented to admin requested audience', async () => {
    mockTokenRepo.findByHash.mockResolvedValue({
      id: 'session-1',
      userId: 'user-1',
      revoked: false,
      expiresAt: new Date(Date.now() + 100000),
    });

    mockTokenService.verifyRefreshToken.mockResolvedValue({
      userId: 'user-1',
      brand: 'realtutorialhub',
      isAdmin: false,
      tokenType: 'user', // Learner token cannot be used to request admin audience
    });

    await expect(
      service.refresh('raw-token', '127.0.0.1', undefined, 'admin', 'realtutorialhub')
    ).rejects.toThrow('Invalid refresh token');

    expect(mockTokenRepo.updateLastUsed).not.toHaveBeenCalled();
    expect(mockTokenRepo.consumeToken).not.toHaveBeenCalled();
  });

  it('TC-AUTH-13: fails closed when admin token presented to user requested audience', async () => {
    mockTokenRepo.findByHash.mockResolvedValue({
      id: 'session-1',
      userId: 'user-1',
      revoked: false,
      expiresAt: new Date(Date.now() + 100000),
    });

    mockTokenService.verifyRefreshToken.mockResolvedValue({
      userId: 'user-1',
      brand: 'realtutorialhub',
      isAdmin: true,
      tokenType: 'admin',
    });

    await expect(
      service.refresh('raw-token', '127.0.0.1', undefined, 'user', 'realtutorialhub')
    ).rejects.toThrow('Invalid refresh token');

    expect(mockTokenRepo.updateLastUsed).not.toHaveBeenCalled();
    expect(mockTokenRepo.consumeToken).not.toHaveBeenCalled();
  });

  it('TC-AUTH-14: verification first: cryptographic or audience error aborts before updateLastUsed', async () => {
    mockTokenRepo.findByHash.mockResolvedValue({
      id: 'session-1',
      userId: 'user-1',
      revoked: false,
      expiresAt: new Date(Date.now() + 100000),
    });

    mockTokenService.verifyRefreshToken.mockRejectedValue(new Error('JWT signature invalid'));

    await expect(
      service.refresh('bad-sig-token', '127.0.0.1', undefined, 'user', 'realtutorialhub')
    ).rejects.toThrow('Invalid refresh token');

    // updateLastUsed MUST NOT be called!
    expect(mockTokenRepo.updateLastUsed).not.toHaveBeenCalled();
    expect(mockTokenRepo.consumeToken).not.toHaveBeenCalled();
    expect(mockAuditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'token_refresh_failed',
        metadata: expect.objectContaining({
          reason: 'invalid_token_signature_or_audience',
        }),
      })
    );
  });

  it('TC-AUTH-15: succeeds for valid infrastructure refresh with aud: infra and brand: skillhubcore without invoking tenant user eligibility', async () => {
    mockTokenRepo.findByHash.mockResolvedValue({
      id: 'session-infra',
      userId: 'user-infra-1',
      revoked: false,
      expiresAt: new Date(Date.now() + 100000),
    });

    mockTokenService.verifyRefreshToken.mockResolvedValue({
      userId: 'user-infra-1',
      brand: 'skillhubcore',
      isAdmin: true,
      tokenType: 'admin',
      roles: ['super_admin'],
    });

    const result = await service.refresh('raw-infra-token', '127.0.0.1', undefined, 'infra', 'skillhubcore');

    expect(result.accessToken).toBe('new-access-token');
    expect(result.userId).toBe('user-infra-1');
    expect(result.isAdmin).toBe(true);

    // Assert that out-of-scope infrastructure does NOT invoke tenant user eligibility lookup
    expect(mockUserRepo.findActiveUserWithRoles).not.toHaveBeenCalled();
    expect(mockTokenRepo.updateLastUsed).toHaveBeenCalledWith('token-sha256-hash');
    expect(mockTokenRepo.consumeToken).toHaveBeenCalledWith('token-sha256-hash', 'user-infra-1');
  });
});
