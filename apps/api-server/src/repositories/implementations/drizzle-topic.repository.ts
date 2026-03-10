import { db, topics } from '@quiz/db';
import { and, desc, eq, inArray, lt, sql } from 'drizzle-orm';

import { BaseRepository } from '@/modules/core/repositories/base.repository';

import { ITopicRepository } from '../interfaces/topic.repository.interface';

export class DrizzleTopicRepository extends BaseRepository<typeof topics.$inferSelect, typeof topics> implements ITopicRepository {
  protected table = topics;

  constructor(dbInstance: typeof db = db) {
    super(dbInstance);
  }

  withDb(dbClient: typeof db): this {
    return new DrizzleTopicRepository(dbClient) as this;
  }


  async findAll(cursor: string | null, limit: number, filters?: { subjectId?: string; search?: string }) {
    const conditions = [];

    if (cursor !== null && cursor !== '') {
        conditions.push(lt(topics.createdAt, new Date(cursor)));
    }

    if (filters?.subjectId !== undefined && filters?.subjectId !== null && filters?.subjectId !== '') {
        conditions.push(eq(topics.subjectId, filters.subjectId));
    }
    if (filters?.search !== undefined && filters?.search !== null && filters?.search.trim() !== '') {
        conditions.push(sql`${topics.name} ILIKE ${'%' + filters.search + '%'}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const dataRaw = await this.dbInstance.query.topics.findMany({
      where: whereClause,
      limit: limit + 1,
      orderBy: [desc(topics.createdAt)],
      with: {
        subject: true,
      }
    });

    const hasNext = dataRaw.length > limit;
    const data = hasNext ? dataRaw.slice(0, limit) : dataRaw;
    const nextCursor = hasNext ? data[data.length - 1].createdAt.toISOString() : null;

    const [{ count }] = await this.dbInstance
      .select({ count: sql<number>`count(*)` })
      .from(topics)
      .where(conditions.length > 0 ? and(...conditions.filter(c => !c.toString().includes('created_at <'))) : sql`true`);

    const total = Number(count ?? 0);

    return { data, total, nextCursor, limit };
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
