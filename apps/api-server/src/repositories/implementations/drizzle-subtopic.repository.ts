import { db, subtopics } from '@quiz/db';
import { and, desc, eq, inArray, lt, sql } from 'drizzle-orm';

import { BaseRepository } from '@/modules/core/repositories/base.repository';

import { ISubtopicRepository } from '../interfaces/subtopic.repository.interface';

export class DrizzleSubtopicRepository extends BaseRepository<typeof subtopics.$inferSelect, typeof subtopics> implements ISubtopicRepository {
  protected table = subtopics;

  constructor(dbInstance: typeof db = db) {
    super(dbInstance);
  }

  withDb(dbClient: typeof db): this {
    return new DrizzleSubtopicRepository(dbClient) as this;
  }


  async findAll(cursor: string | null, limit: number, filters?: { topicId?: string; search?: string }) {
    const conditions = [];

    if (cursor !== null && cursor !== '') {
        conditions.push(lt(subtopics.createdAt, new Date(cursor)));
    }

    if (filters?.topicId !== undefined && filters?.topicId !== null && filters?.topicId !== '') {
        conditions.push(eq(subtopics.topicId, filters.topicId));
    }
    if (filters?.search !== undefined && filters?.search !== null && filters?.search.trim() !== '') {
        conditions.push(sql`${subtopics.name} ILIKE ${'%' + filters.search + '%'}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const dataRaw = await this.dbInstance.query.subtopics.findMany({
      where: whereClause,
      limit: limit + 1,
      orderBy: [desc(subtopics.createdAt)],
      with: {
        topic: true,
      }
    });

    const hasNext = dataRaw.length > limit;
    const data = hasNext ? dataRaw.slice(0, limit) : dataRaw;
    const nextCursor = hasNext ? data[data.length - 1].createdAt.toISOString() : null;

    const [{ count }] = await this.dbInstance
      .select({ count: sql<number>`count(*)` })
      .from(subtopics)
      .where(conditions.length > 0 ? and(...conditions.filter(c => !c.toString().includes('created_at <'))) : sql`true`);

    const total = Number(count ?? 0);

    return { data, total, nextCursor, limit };
  }

  async create(data: typeof subtopics.$inferInsert) {
    const [newSub] = await this.dbInstance.insert(subtopics).values(data).returning();
    return newSub;
  }

  async update(id: string, data: Partial<typeof subtopics.$inferInsert>) {
    const [updated] = await this.dbInstance.update(subtopics).set(data).where(eq(subtopics.id, id)).returning();
    return updated;
  }

  async delete(id: string) {
    const [deleted] = await this.dbInstance.delete(subtopics).where(eq(subtopics.id, id)).returning();
    return deleted;
  }

  async deleteBatch(ids: string[]) {
    return await this.dbInstance.delete(subtopics).where(inArray(subtopics.id, ids)).returning();
  }
}
