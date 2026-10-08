import { db, examBlueprints } from '@quiz/db';

export interface IBlueprintRepository {
  /**
   * Returns a new instance of the repository using the specified database client.
   */
  withDb(dbClient: typeof db): this;

  findAll(cursor: string | null, limit: number, filters?: { search?: string; fields?: string }): Promise<{
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
