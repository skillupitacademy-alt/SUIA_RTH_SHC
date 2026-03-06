import { skills } from '@quiz/db';

export interface ISkillRepository {
  findAll(page: number, limit: number, filters?: { search?: string }): Promise<{
    data: (typeof skills.$inferSelect)[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  findById(id: string): Promise<typeof skills.$inferSelect | undefined>;
  create(data: typeof skills.$inferInsert): Promise<typeof skills.$inferSelect>;
  update(id: string, data: Partial<typeof skills.$inferInsert>): Promise<typeof skills.$inferSelect>;
  delete(id: string): Promise<typeof skills.$inferSelect>;
  deleteBatch(ids: string[]): Promise<(typeof skills.$inferSelect)[]>;
  getTopicSkills(page: number, limit: number): Promise<Record<string, unknown>[]>;
  getSkillsByTopic(topicId: string): Promise<(typeof skills.$inferSelect)[]>;
  mapTopicToSkills(topicId: string, skillIds: string[]): Promise<void>;
}
