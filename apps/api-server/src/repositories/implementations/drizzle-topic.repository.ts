import { db, topics } from '@quiz/db';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';

import { BaseRepository } from '@/modules/core/repositories/base.repository';

import { ITopicRepository } from '../interfaces/topic.repository.interface';

export class DrizzleTopicRepository extends BaseRepository<typeof topics.$inferSelect, typeof topics> implements ITopicRepository {
  protected table = topics;

  constructor() {
    super(db);
  }

  async findAll(page: number, limit: number, filters?: { subjectId?: string; search?: string }) {
    const offset = (page - 1) * limit;
    const conditions = [];
    if (filters?.subjectId !== undefined && filters?.subjectId !== null && filters?.subjectId !== '') {
        conditions.push(eq(topics.subjectId, filters.subjectId));
    }
    if (filters?.search !== undefined && filters?.search !== null && filters?.search.trim() !== '') {
        conditions.push(sql`${topics.name} ILIKE ${'%' + filters.search + '%'}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await this.dbInstance.query.topics.findMany({
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

    const [{ count }] = await this.dbInstance
      .select({ count: sql<number>`count(*)` })
      .from(topics)
      .where(whereClause ?? sql`true`);

    const total = Number(count ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return { data, total, page, limit, totalPages };
  }

  async create(data: typeof topics.$inferInsert) {
    const [newTopic] = await this.dbInstance.insert(topics).values(data).returning();
    return newTopic;
  }

  async update(id: string, data: Partial<typeof topics.$inferInsert>) {
    const [updated] = await this.dbInstance.update(topics).set(data).where(eq(topics.id, id)).returning();
    return updated;
  }

  async delete(id: string) {
    const [deleted] = await this.dbInstance.delete(topics).where(eq(topics.id, id)).returning();
    return deleted;
  }

  async deleteBatch(ids: string[]) {
    return await this.dbInstance.delete(topics).where(inArray(topics.id, ids)).returning();
  }
}
