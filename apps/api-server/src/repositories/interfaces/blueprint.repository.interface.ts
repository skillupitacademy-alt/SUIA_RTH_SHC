import { examBlueprints } from '@quiz/db';

export interface IBlueprintRepository {
  findAll(page: number, limit: number, filters?: { search?: string }): Promise<(typeof examBlueprints.$inferSelect)[]>;
  findById(id: string): Promise<typeof examBlueprints.$inferSelect | undefined>;
  create(data: typeof examBlueprints.$inferInsert): Promise<typeof examBlueprints.$inferSelect>;
  update(id: string, data: Partial<typeof examBlueprints.$inferInsert>): Promise<typeof examBlueprints.$inferSelect>;
  delete(id: string): Promise<typeof examBlueprints.$inferSelect>;
}
