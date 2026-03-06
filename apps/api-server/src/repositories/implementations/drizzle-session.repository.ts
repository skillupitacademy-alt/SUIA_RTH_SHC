import { db, sessions } from '@quiz/db';
import { eq, lt } from 'drizzle-orm';

import { BaseRepository } from '@/modules/core/repositories/base.repository';

import { ISessionRepository } from '../interfaces/session.repository.interface';

export class DrizzleSessionRepository extends BaseRepository<typeof sessions.$inferSelect, typeof sessions> implements ISessionRepository {
  protected table = sessions;

  constructor() {
    super(db);
  }

  async createSession(userId: string, expiresAt: Date, ip?: string, device?: string) {
    const [session] = await this.dbInstance.insert(sessions).values({
      userId,
      expiresAt,
      ip,
      device
    }).returning();
    return session;
  }

  async findById(id: string) {
    return await this.dbInstance.query.sessions.findFirst({
      where: eq(sessions.id, id)
    });
  }

  async findByUser(userId: string) {
    return await this.dbInstance.query.sessions.findMany({
      where: eq(sessions.userId, userId)
    });
  }

  async deleteSession(sessionId: string) {
    await this.dbInstance.delete(sessions).where(eq(sessions.id, sessionId));
  }

  async deleteAllUserSessions(userId: string) {
    await this.dbInstance.delete(sessions).where(eq(sessions.userId, userId));
  }

  async cleanupExpired() {
    const result = await this.dbInstance.delete(sessions).where(lt(sessions.expiresAt, new Date())).returning();
    return result.length;
  }
}
