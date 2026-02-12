import { db, examBlueprints } from '@quiz/db';
import { eq, sql, desc } from 'drizzle-orm';

export class AdminBlueprintEngine {
  static async getBlueprints(page: number = 1, limit: number = 20, filters?: { search?: string }) {
    const offset = (page - 1) * limit;
    let whereClause = undefined;
    if (filters?.search !== undefined && filters?.search !== null && filters?.search.trim() !== '') {
        whereClause = sql`${examBlueprints.name} ILIKE ${'%' + filters.search + '%'}`;
    }

    return await db.query.examBlueprints.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: [desc(examBlueprints.createdAt)]
    });
  }

  static async createBlueprint(data: typeof examBlueprints.$inferInsert) {
    const [newBp] = await db.insert(examBlueprints).values(data).returning();
    return newBp;
  }

  static async updateBlueprint(id: string, data: Partial<typeof examBlueprints.$inferInsert>) {
    const [updated] = await db.update(examBlueprints).set(data).where(eq(examBlueprints.id, id)).returning();
    return updated;
  }

  static async deleteBlueprint(id: string) {
    return await db.delete(examBlueprints).where(eq(examBlueprints.id, id)).returning();
  }

  static async getBlueprintById(id: string) {
    return await db.query.examBlueprints.findFirst({
        where: eq(examBlueprints.id, id)
    });
  }
}
