import { db, topics } from '@quiz/db';

export interface ITopicRepository {
  /**
   * Returns a new instance of the repository using the specified database client.
   */
  withDb(dbClient: typeof db): this;
  findAll(cursor: string | null, limit: number, filters?: { subjectId?: string; search?: string }): Promise<{
    data: Array<(typeof topics.$inferSelect) & { subject?: Record<string, unknown> | Record<string, unknown>[] }>;
    total: number;
    nextCursor: string | null;
    limit: number;
  }>;
  findById(id: string): Promise<typeof topics.$inferSelect | undefined>;
  create(data: typeof topics.$inferInsert): Promise<typeof topics.$inferSelect>;
  update(id: string, data: Partial<typeof topics.$inferInsert>): Promise<typeof topics.$inferSelect>;
  delete(id: string): Promise<typeof topics.$inferSelect>;
  deleteBatch(ids: string[]): Promise<(typeof topics.$inferSelect)[]>;
}
