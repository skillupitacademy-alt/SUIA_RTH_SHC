import { db, refreshTokens,sessions } from '@quiz/db';
import { eq, lt } from 'drizzle-orm';

export class SessionService {
  static async createSession(userId: string, ip?: string, device?: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1); // 24h session

    return await db.insert(sessions).values({
      userId,
      ip,
      device,
      expiresAt,
    }).returning();
  }

  static async revokeRefreshTokens(userId: string) {
    return await db.update(refreshTokens)
      .set({ revoked: true })
      .where(eq(refreshTokens.userId, userId));
  }

  static async cleanExpiredSessions() {
    return await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
  }
}
