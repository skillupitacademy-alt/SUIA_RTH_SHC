import { db, refreshTokens } from '@quiz/db';
import { and, eq, gt } from 'drizzle-orm';

import { BaseRepository } from '@/modules/core/repositories/base.repository';

type RefreshTokenRow = typeof refreshTokens.$inferSelect;

export class TokenRepository extends BaseRepository<RefreshTokenRow, typeof refreshTokens> {
  protected table = refreshTokens;

  constructor() {
    super(db);
  }

  async createRefreshToken(data: { userId: string; token: string; expiresAt: Date }) {
    await this.dbInstance.insert(refreshTokens).values({
      userId: data.userId,
      token: data.token,
      expiresAt: data.expiresAt,
    });
  }

  async revokeToken(tokenHash: string) {
    await this.dbInstance.update(refreshTokens)
      .set({ revoked: true })
      .where(eq(refreshTokens.token, tokenHash));
  }

  async revokeById(id: string) {
    await this.dbInstance.update(refreshTokens)
      .set({ revoked: true })
      .where(eq(refreshTokens.id, id));
  }

  async revokeAll(userId: string) {
     await this.dbInstance.update(refreshTokens)
        .set({ revoked: true })
        .where(eq(refreshTokens.userId, userId));
  }

  async touchSession(userId: string) {
    await this.dbInstance.update(refreshTokens)
      .set({ lastActiveAt: new Date() })
      .where(and(
        eq(refreshTokens.userId, userId),
        eq(refreshTokens.revoked, false),
        gt(refreshTokens.expiresAt, new Date())
      ));
  }

  async findValidToken(userId: string, tokenHash: string) {
    return await this.dbInstance.query.refreshTokens.findFirst({
      where: and(
        eq(refreshTokens.userId, userId),
        eq(refreshTokens.token, tokenHash),
        eq(refreshTokens.revoked, false),
        gt(refreshTokens.expiresAt, new Date())
      )
    });
  }

  async findByHash(tokenHash: string) {
    return await this.dbInstance.query.refreshTokens.findFirst({
      where: and(
        eq(refreshTokens.token, tokenHash),
        eq(refreshTokens.revoked, false)
      ),
    });
  }
}
