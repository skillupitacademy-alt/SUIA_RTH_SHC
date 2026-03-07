import { examBlueprints } from '@quiz/db';

export interface IBlueprintRepository {
  findAll(cursor: string | null, limit: number, filters?: { search?: string }): Promise<{
    data: (typeof examBlueprints.$inferSelect)[];
    total: number;
    nextCursor: string | null;
    limit: number;
  }>;
  findById(id: string): Promise<typeof examBlueprints.$inferSelect | undefined>;
  create(data: typeof examBlueprints.$inferInsert): Promise<typeof examBlueprints.$inferSelect>;
  update(id: string, data: Partial<typeof examBlueprints.$inferInsert>): Promise<typeof examBlueprints.$inferSelect>;
  delete(id: string): Promise<typeof examBlueprints.$inferSelect>;
}
