import { db, refreshTokens,sessions } from '@quiz/db';
import { eq, lt } from 'drizzle-orm';

export class SessionService {
  constructor(private dbInstance = db) {}

  async createSession(userId: string, ip?: string, device?: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1); // 24h session

    return await this.dbInstance.insert(sessions).values({
      userId,
      ip,
      device,
      expiresAt,
    }).returning();
  }

  async revokeRefreshTokens(userId: string) {
    return await this.dbInstance.update(refreshTokens)
      .set({ revoked: true })
      .where(eq(refreshTokens.userId, userId));
  }

  async cleanExpiredSessions() {
    return await this.dbInstance.delete(sessions).where(lt(sessions.expiresAt, new Date()));
  }
}
