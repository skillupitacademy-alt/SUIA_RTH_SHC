import { subjects } from '@quiz/db';

export interface ISubjectRepository {
  findAll(cursor: string | null, limit: number, filters?: { domainId?: string; search?: string }): Promise<{
    data: Array<(typeof subjects.$inferSelect) & { domain?: Record<string, unknown> }>;
    total: number;
    nextCursor: string | null;
    limit: number;
  }>;
  findById(id: string): Promise<typeof subjects.$inferSelect | undefined>;
  create(data: typeof subjects.$inferInsert): Promise<typeof subjects.$inferSelect>;
  update(id: string, data: Partial<typeof subjects.$inferInsert>): Promise<typeof subjects.$inferSelect>;
  delete(id: string): Promise<typeof subjects.$inferSelect>;
  deleteBatch(ids: string[]): Promise<(typeof subjects.$inferSelect)[]>;
}
