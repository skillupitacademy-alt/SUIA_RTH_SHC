import { auditLogs } from '@quiz/db';

export interface IAuditRepository {
  log(entry: typeof auditLogs.$inferInsert): Promise<void>;
  findByUser(userId: string, options?: { limit?: number; offset?: number }): Promise<(typeof auditLogs.$inferSelect)[]>;
  findByAction(action: string, dateRange: { start: Date; end: Date }): Promise<(typeof auditLogs.$inferSelect)[]>;
  findByDateRange(start: Date, end: Date, options?: { limit?: number; offset?: number }): Promise<(typeof auditLogs.$inferSelect)[]>;
}
