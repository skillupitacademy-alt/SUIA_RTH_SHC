import { db, examBlueprints } from '@quiz/db';
import { desc, eq, sql } from 'drizzle-orm';

import { BaseRepository } from '@/modules/core/repositories/base.repository';

import { IBlueprintRepository } from '../interfaces/blueprint.repository.interface';

export class DrizzleBlueprintRepository extends BaseRepository<typeof examBlueprints.$inferSelect, typeof examBlueprints> implements IBlueprintRepository {
  protected table = examBlueprints;

  constructor() {
    super(db);
  }

  async findAll(page: number, limit: number, filters?: { search?: string }) {
    const offset = (page - 1) * limit;
    let whereClause = undefined;
    if (filters?.search !== undefined && filters?.search !== null && filters?.search.trim() !== '') {
        whereClause = sql`${examBlueprints.name} ILIKE ${'%' + filters.search + '%'}`;
    }

    return await this.dbInstance.query.examBlueprints.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: [desc(examBlueprints.createdAt)]
    });
  }

  async create(data: typeof examBlueprints.$inferInsert) {
    const [newBp] = await this.dbInstance.insert(examBlueprints).values(data).returning();
    return newBp;
  }

  async update(id: string, data: Partial<typeof examBlueprints.$inferInsert>) {
    const [updated] = await this.dbInstance.update(examBlueprints).set(data).where(eq(examBlueprints.id, id)).returning();
    return updated;
  }

  async delete(id: string) {
    const [deleted] = await this.dbInstance.delete(examBlueprints).where(eq(examBlueprints.id, id)).returning();
    return deleted;
  }
}
