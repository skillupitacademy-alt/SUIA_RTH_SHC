import { sessions } from '@quiz/db';

export interface ISessionRepository {
  createSession(userId: string, expiresAt: Date, ip?: string, device?: string): Promise<typeof sessions.$inferSelect>;
  findById(id: string): Promise<typeof sessions.$inferSelect | undefined>;
  findByUser(userId: string): Promise<(typeof sessions.$inferSelect)[]>;
  deleteSession(sessionId: string): Promise<void>;
  deleteAllUserSessions(userId: string): Promise<void>;
  cleanupExpired(): Promise<number>;
}
