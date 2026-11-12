import { db, refreshTokens } from '@quiz/db';
import { and, eq, gt } from 'drizzle-orm';

import type { BrandAuthTables } from '@/modules/auth/brand-db';
import { BaseRepository } from '@/modules/core/repositories/base.repository';

type RefreshTokenRow = typeof refreshTokens.$inferSelect;

export interface DeviceContext {
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceName?: string;
}

export class TokenRepository extends BaseRepository<RefreshTokenRow, typeof refreshTokens> {
  protected table = refreshTokens;
  protected refreshTokensTable = refreshTokens;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(dbInstance: any = db, tables?: Pick<BrandAuthTables, 'refreshTokens'>) {
    super(dbInstance);
    if (tables?.refreshTokens !== undefined) {
      this.refreshTokensTable = tables.refreshTokens as typeof refreshTokens;
      this.table = this.refreshTokensTable;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  withDb(dbClient: any, tables?: Pick<BrandAuthTables, 'refreshTokens'>): this {
    return new TokenRepository(dbClient, tables) as this;
  }

  async createRefreshToken(data: {
    userId: string;
    token: string;
    expiresAt: Date;
    deviceContext?: DeviceContext;
  }) {
    await this.dbInstance.insert(this.refreshTokensTable).values({
      userId: data.userId,
      token: data.token,
      expiresAt: data.expiresAt,
      deviceId: data.deviceContext?.deviceId,
      ipAddress: data.deviceContext?.ipAddress,
      userAgent: data.deviceContext?.userAgent,
      deviceName: data.deviceContext?.deviceName,
      lastUsedAt: new Date(),
    });
  }

  async revokeToken(tokenHash: string) {
    await this.dbInstance.update(this.refreshTokensTable)
      .set({ revoked: true })
      .where(eq(this.refreshTokensTable.token, tokenHash));
  }

  /**
   * 🔐 ATOMIC REFRESH ROTATION (W1.2-REFRESH-02)
   * Conditionally consumes an active, unexpired refresh token for the expected owner.
   * Performs an atomic compare-and-swap update and returns the consumed record or null.
   *
   * @param tokenHash - SHA-256 hash of the refresh token to consume
   * @param expectedUserId - REQUIRED verified owner user ID
   * @returns The consumed session row if exactly one row was updated; null otherwise.
   */
  async consumeToken(tokenHash: string, expectedUserId: string): Promise<RefreshTokenRow | null> {
    if (typeof expectedUserId !== 'string' || expectedUserId.trim().length === 0) {
      throw new Error('W1.2-REFRESH-02: expectedUserId is required for token consumption');
    }
    if (typeof tokenHash !== 'string' || tokenHash.trim().length === 0) {
      throw new Error('W1.2-REFRESH-02: tokenHash is required for token consumption');
    }

    const now = new Date();
    const result = await this.dbInstance.update(this.refreshTokensTable)
      .set({
        revoked: true,
        lastUsedAt: now,
      })
      .where(and(
        eq(this.refreshTokensTable.token, tokenHash),
        eq(this.refreshTokensTable.userId, expectedUserId),
        eq(this.refreshTokensTable.revoked, false),
        gt(this.refreshTokensTable.expiresAt, now)
      ))
      .returning();

    if (Array.isArray(result) && result.length === 1) {
      return result[0] as RefreshTokenRow;
    }

    return null;
  }

  /**
   * 🔐 SECURITY FIX (W1.2-SESS-01): Owner-scoped single-session revocation.
   * Prevents cross-user session revocation by requiring verified userId match.
   *
   * @param id - Session ID to revoke
   * @param userId - REQUIRED verified brand-local user ID (ownership authority)
   * @throws {Error} If userId is missing, empty, or whitespace-only
   */
  async revokeById(id: string, userId: string) {
    // Runtime validation: fail closed if owner identity is missing/invalid
    if (typeof userId !== 'string' || userId.trim().length === 0) {
      throw new Error('W1.2-SESS-01: userId is required for session revocation');
    }

    // Single atomic update with both session ID and owner ID in WHERE clause
    const changed = await this.dbInstance.update(this.refreshTokensTable)
      .set({ revoked: true })
      .where(and(
        eq(this.refreshTokensTable.id, id),
        eq(this.refreshTokensTable.userId, userId)
      )).returning({ id: this.refreshTokensTable.id });
    return changed.length > 0;
  }

  async revokeAll(userId: string) {
     await this.dbInstance.update(this.refreshTokensTable)
        .set({ revoked: true })
        .where(eq(this.refreshTokensTable.userId, userId));
  }

  // 🔐 Revoke specific device session by deviceId
  async revokeByDeviceId(userId: string, deviceId: string) {
    await this.dbInstance.update(this.refreshTokensTable)
      .set({ revoked: true })
      .where(and(
        eq(this.refreshTokensTable.userId, userId),
        eq(this.refreshTokensTable.deviceId, deviceId)
      ));
  }

  async touchSession(userId: string) {
    await this.dbInstance.update(this.refreshTokensTable)
      .set({ lastActiveAt: new Date() })
      .where(and(
        eq(this.refreshTokensTable.userId, userId),
        eq(this.refreshTokensTable.revoked, false),
        gt(this.refreshTokensTable.expiresAt, new Date())
      ));
  }

  async updateLastUsed(tokenHash: string) {
    await this.dbInstance.update(this.refreshTokensTable)
      .set({ lastUsedAt: new Date() })
      .where(eq(this.refreshTokensTable.token, tokenHash));
  }

  async findValidToken(userId: string, tokenHash: string) {
    return await this.dbInstance.query.refreshTokens.findFirst({
      where: and(
        eq(this.refreshTokensTable.userId, userId),
        eq(this.refreshTokensTable.token, tokenHash),
        eq(this.refreshTokensTable.revoked, false),
        gt(this.refreshTokensTable.expiresAt, new Date())
      )
    });
  }

  /**
   * 🔐 FAANG-LEVEL: Find valid session by userId and refresh token hash
   * This is the SOURCE OF TRUTH for session validation
   * Used by /me endpoint to check if session is still valid after global logout
   */
  async findValidSession(params: {
    userId: string;
    refreshTokenHash: string;
  }) {
    return await this.dbInstance.query.refreshTokens.findFirst({
      where: and(
        eq(this.refreshTokensTable.userId, params.userId),
        eq(this.refreshTokensTable.token, params.refreshTokenHash),
        eq(this.refreshTokensTable.revoked, false),
        gt(this.refreshTokensTable.expiresAt, new Date())
      )
    });
  }

  async findByHash(tokenHash: string) {
    return await this.dbInstance.query.refreshTokens.findFirst({
      where: and(
        eq(this.refreshTokensTable.token, tokenHash),
        eq(this.refreshTokensTable.revoked, false)
      ),
    });
  }

  // 🔐 Enterprise Auth: Get all active sessions for a user
  async getUserSessions(userId: string) {
    return await this.dbInstance
      .select()
      .from(this.refreshTokensTable)
      .where(and(
        eq(this.refreshTokensTable.userId, userId),
        eq(this.refreshTokensTable.revoked, false),
        gt(this.refreshTokensTable.expiresAt, new Date())
      ))
      .orderBy(this.refreshTokensTable.lastUsedAt);
  }

  /**
   * 🔐 SECURITY FIX (AUTH-49): Revoke all sessions except current in a single
   * atomic WHERE clause using sql"`not equal"` instead of revoking all then
   * un-revoking the current token (which was race-prone).
   */
  async revokeOtherSessions(userId: string, currentTokenHash: string) {
    const { ne } = await import('drizzle-orm');
    await this.dbInstance.update(this.refreshTokensTable)
      .set({ revoked: true })
      .where(and(
        eq(this.refreshTokensTable.userId, userId),
        eq(this.refreshTokensTable.revoked, false),
        ne(this.refreshTokensTable.token, currentTokenHash)
      ));
  }

  // 🔐 Enterprise Auth: Check for suspicious activity (IP mismatch)
  async validateSessionSecurity(tokenHash: string, currentIp: string): Promise<{
    valid: boolean;
    reason?: string;
    session?: RefreshTokenRow;
  }> {
    const session = await this.findByHash(tokenHash);

    if (!session) {
      return { valid: false, reason: 'session_not_found' };
    }

    if (session.revoked) {
      return { valid: false, reason: 'session_revoked' };
    }

    if (new Date(session.expiresAt) < new Date()) {
      return { valid: false, reason: 'session_expired' };
    }

    // 🔥 IP Mismatch Detection (optional - can be disabled for mobile users)
    if (typeof session.ipAddress === 'string' && session.ipAddress.length > 0 && session.ipAddress !== currentIp) {
      // Log suspicious activity but don't block (mobile IPs change frequently)
      console.warn('[SECURITY] IP mismatch detected', {
        sessionId: session.id,
        originalIp: session.ipAddress,
        currentIp,
      });
      // Return valid but with warning
      return { valid: true, reason: 'ip_mismatch_warning', session };
    }

    return { valid: true, session };
  }
}
