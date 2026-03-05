import { db, topics } from '@quiz/db';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';

export class AdminTopicEngine {
  static async getTopics(page: number = 1, limit: number = 20, filters?: { subjectId?: string; search?: string }) {
    const offset = (page - 1) * limit;
    const conditions = [];
    if (filters?.subjectId !== undefined && filters?.subjectId !== null && filters?.subjectId !== '') {
        conditions.push(eq(topics.subjectId, filters.subjectId));
    }
    if (filters?.search !== undefined && filters?.search !== null && filters?.search.trim() !== '') {
        conditions.push(sql`${topics.name} ILIKE ${'%' + filters.search + '%'}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db.query.topics.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: [desc(topics.createdAt)],
      with: {
        subject: {
          with: {
            domain: true,
          }
        }
      }
    });

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(topics)
      .where(whereClause ?? sql`true`);

    const total = Number(count ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return { data, total, page, limit, totalPages };
  }

  static async createTopic(data: typeof topics.$inferInsert) {
    const [newTopic] = await db.insert(topics).values(data).returning();
    return newTopic;
  }

  static async updateTopic(id: string, data: Partial<typeof topics.$inferInsert>) {
    const [updated] = await db.update(topics).set(data).where(eq(topics.id, id)).returning();
    return updated;
  }

  static async deleteTopic(id: string) {
    return await db.delete(topics).where(eq(topics.id, id)).returning();
  }

  static async deleteTopicsBatch(ids: string[]) {
    return await db.delete(topics).where(inArray(topics.id, ids)).returning();
  }

  static async validateTopic(_topicId: string) {
    // Placeholder for topic validation logic
    return { valid: true, issues: [] };
  }
}
