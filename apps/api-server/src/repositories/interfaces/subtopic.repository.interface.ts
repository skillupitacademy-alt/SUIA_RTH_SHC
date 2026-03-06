import { subtopics } from '@quiz/db';

export interface ISubtopicRepository {
  findAll(page: number, limit: number, filters?: { topicId?: string; search?: string }): Promise<{
    data: Array<(typeof subtopics.$inferSelect) & { topic?: Record<string, unknown> }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  findById(id: string): Promise<typeof subtopics.$inferSelect | undefined>;
  create(data: typeof subtopics.$inferInsert): Promise<typeof subtopics.$inferSelect>;
  update(id: string, data: Partial<typeof subtopics.$inferInsert>): Promise<typeof subtopics.$inferSelect>;
  delete(id: string): Promise<typeof subtopics.$inferSelect>;
  deleteBatch(ids: string[]): Promise<(typeof subtopics.$inferSelect)[]>;
}
