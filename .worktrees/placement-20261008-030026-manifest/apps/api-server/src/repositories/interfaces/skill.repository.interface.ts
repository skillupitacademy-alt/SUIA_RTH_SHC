import { db, skills } from '@quiz/db';

export interface ISkillRepository {
  /**
   * Returns a new instance of the repository using the specified database client.
   */
  withDb(dbClient: typeof db): this;
  findAll(cursor: string | null, limit: number, filters?: { search?: string }): Promise<{
    data: (typeof skills.$inferSelect)[];
    total: number;
    nextCursor: string | null;
    limit: number;
  }>;
  findById(id: string): Promise<typeof skills.$inferSelect | undefined>;
  create(data: typeof skills.$inferInsert): Promise<typeof skills.$inferSelect>;
  update(id: string, data: Partial<typeof skills.$inferInsert>): Promise<typeof skills.$inferSelect>;
  delete(id: string): Promise<typeof skills.$inferSelect>;
  deleteBatch(ids: string[]): Promise<(typeof skills.$inferSelect)[]>;
  getTopicSkills(cursor: string | null, limit: number): Promise<{ data: Record<string, unknown>[]; nextCursor: string | null }>;
  getSkillsByTopic(topicId: string): Promise<(typeof skills.$inferSelect)[]>;
  mapTopicToSkills(topicId: string, skillIds: string[]): Promise<void>;
}
