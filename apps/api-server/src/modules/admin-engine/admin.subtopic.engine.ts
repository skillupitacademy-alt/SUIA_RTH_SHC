import { db, subtopics } from '@quiz/db';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';

export class AdminSubtopicEngine {
  static async getSubtopics(page: number = 1, limit: number = 20, filters?: { topicId?: string; search?: string }) {
    const offset = (page - 1) * limit;
    const conditions = [];
    if (filters?.topicId !== undefined && filters?.topicId !== null && filters?.topicId !== '') {
        conditions.push(eq(subtopics.topicId, filters.topicId));
    }
    if (filters?.search !== undefined && filters?.search !== null && filters?.search.trim() !== '') {
        conditions.push(sql`${subtopics.name} ILIKE ${'%' + filters.search + '%'}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db.query.subtopics.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: [desc(subtopics.createdAt)],
      with: {
        topic: {
          with: {
            subject: {
              with: {
                domain: true,
              }
            }
          }
        }
      }
    });

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(subtopics)
      .where(whereClause ?? sql`true`);

    const total = Number(count ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return { data, total, page, limit, totalPages };
  }

  static async createSubtopic(data: typeof subtopics.$inferInsert) {
    const [res] = await db.insert(subtopics).values(data).returning();
    return res;
  }

  static async updateSubtopic(id: string, data: Partial<typeof subtopics.$inferInsert>) {
    const [res] = await db.update(subtopics).set(data).where(eq(subtopics.id, id)).returning();
    return res;
  }

  static async deleteSubtopic(id: string) {
    const [res] = await db.delete(subtopics).where(eq(subtopics.id, id)).returning();
    return res;
  }

  static async deleteSubtopicsBatch(ids: string[]) {
    return await db.delete(subtopics).where(inArray(subtopics.id, ids)).returning();
  }
}
