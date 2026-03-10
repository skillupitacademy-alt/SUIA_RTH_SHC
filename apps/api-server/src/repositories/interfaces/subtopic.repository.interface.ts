import { db, subtopics } from '@quiz/db';

export interface ISubtopicRepository {
  /**
   * Returns a new instance of the repository using the specified database client.
   */
  withDb(dbClient: typeof db): this;
  findAll(cursor: string | null, limit: number, filters?: { topicId?: string; search?: string }): Promise<{
    data: Array<(typeof subtopics.$inferSelect) & { topic?: Record<string, unknown> | Record<string, unknown>[] }>;
    total: number;
    nextCursor: string | null;
    limit: number;
  }>;
  findById(id: string): Promise<typeof subtopics.$inferSelect | undefined>;
  create(data: typeof subtopics.$inferInsert): Promise<typeof subtopics.$inferSelect>;
  update(id: string, data: Partial<typeof subtopics.$inferInsert>): Promise<typeof subtopics.$inferSelect>;
  delete(id: string): Promise<typeof subtopics.$inferSelect>;
  deleteBatch(ids: string[]): Promise<(typeof subtopics.$inferSelect)[]>;
}
