import { auditLogs, db } from '@quiz/db';

export interface IAuditRepository {
  /**
   * Returns a new instance of the repository using the specified database client.
   */
  withDb(dbClient: typeof db): this;
  log(entry: typeof auditLogs.$inferInsert): Promise<void>;
  findByUser(userId: string, options?: { limit?: number; offset?: number }): Promise<(typeof auditLogs.$inferSelect)[]>;
  findByAction(action: string, dateRange: { start: Date; end: Date }): Promise<(typeof auditLogs.$inferSelect)[]>;
  findByDateRange(start: Date, end: Date, options?: { limit?: number; offset?: number }): Promise<(typeof auditLogs.$inferSelect)[]>;
}
