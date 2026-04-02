import { db, refreshTokens } from '@quiz/db';
import { and, eq, gt } from 'drizzle-orm';

import type { BrandAuthTables } from '@/modules/auth/brand-db';
import { BaseRepository } from '@/modules/core/repositories/base.repository';

type RefreshTokenRow = typeof refreshTokens.$inferSelect;

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

  async createRefreshToken(data: { userId: string; token: string; expiresAt: Date }) {
    await this.dbInstance.insert(this.refreshTokensTable).values({
      userId: data.userId,
      token: data.token,
      expiresAt: data.expiresAt,
    });
  }

  async revokeToken(tokenHash: string) {
    await this.dbInstance.update(this.refreshTokensTable)
      .set({ revoked: true })
      .where(eq(this.refreshTokensTable.token, tokenHash));
  }

  async revokeById(id: string) {
    await this.dbInstance.update(this.refreshTokensTable)
      .set({ revoked: true })
      .where(eq(this.refreshTokensTable.id, id));
  }

  async revokeAll(userId: string) {
     await this.dbInstance.update(this.refreshTokensTable)
        .set({ revoked: true })
        .where(eq(this.refreshTokensTable.userId, userId));
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

  async findByHash(tokenHash: string) {
    return await this.dbInstance.query.refreshTokens.findFirst({
      where: and(
        eq(this.refreshTokensTable.token, tokenHash),
        eq(this.refreshTokensTable.revoked, false)
      ),
    });
  }
}
