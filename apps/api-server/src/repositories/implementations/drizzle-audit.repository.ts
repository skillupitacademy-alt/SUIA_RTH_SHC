import { auditLogs,db } from '@quiz/db';
import { and, between, eq } from 'drizzle-orm';

import { BaseRepository } from '@/modules/core/repositories/base.repository';

import { IAuditRepository } from '../interfaces/audit.repository.interface';

export class DrizzleAuditRepository extends BaseRepository<typeof auditLogs.$inferSelect, typeof auditLogs> implements IAuditRepository {
  protected table = auditLogs;

  constructor() {
    super(db);
  }

  async log(entry: typeof auditLogs.$inferInsert) {
    await this.dbInstance.insert(auditLogs).values(entry);
  }

  async findByUser(userId: string, options?: { limit?: number; offset?: number }) {
    return await this.dbInstance.query.auditLogs.findMany({
      where: eq(auditLogs.userId, userId),
      limit: options?.limit,
      offset: options?.offset
    });
  }

  async findByAction(action: string, dateRange: { start: Date; end: Date }) {
    return await this.dbInstance.query.auditLogs.findMany({
      where: and(
        eq(auditLogs.action, action),
        between(auditLogs.createdAt, dateRange.start, dateRange.end)
      )
    });
  }

  async findByDateRange(start: Date, end: Date, options?: { limit?: number; offset?: number }) {
    return await this.dbInstance.query.auditLogs.findMany({
      where: between(auditLogs.createdAt, start, end),
      limit: options?.limit,
      offset: options?.offset
    });
  }
}
