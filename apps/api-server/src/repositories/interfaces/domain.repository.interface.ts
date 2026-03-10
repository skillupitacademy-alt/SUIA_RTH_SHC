import { db, domains } from '@quiz/db';

export interface IDomainRepository {
  /**
   * Returns a new instance of the repository using the specified database client.
   */
  withDb(dbClient: typeof db): this;
  findAll(cursor: string | null, limit: number, filters?: { search?: string }): Promise<{
    data: (typeof domains.$inferSelect)[];
    total: number;
    nextCursor: string | null;
    limit: number;
  }>;
  findById(id: string): Promise<typeof domains.$inferSelect | undefined>;
  create(data: typeof domains.$inferInsert): Promise<typeof domains.$inferSelect>;
  update(id: string, data: Partial<typeof domains.$inferInsert>): Promise<typeof domains.$inferSelect>;
  delete(id: string): Promise<typeof domains.$inferSelect>;
  deleteBatch(ids: string[]): Promise<(typeof domains.$inferSelect)[]>;
  updateStatus(id: string, status: 'active' | 'inactive' | 'draft'): Promise<typeof domains.$inferSelect>;
  findWithHierarchy(domainId: string): Promise<Record<string, unknown> | undefined>;
  upsertHierarchy(hierarchy: { name?: string }): Promise<void>;
}
