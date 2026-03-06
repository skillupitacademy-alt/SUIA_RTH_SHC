import { db, subtopics } from '@quiz/db';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';

import { BaseRepository } from '@/modules/core/repositories/base.repository';

import { ISubtopicRepository } from '../interfaces/subtopic.repository.interface';

export class DrizzleSubtopicRepository extends BaseRepository<typeof subtopics.$inferSelect, typeof subtopics> implements ISubtopicRepository {
  protected table = subtopics;

  constructor() {
    super(db);
  }

  async findAll(page: number, limit: number, filters?: { topicId?: string; search?: string }) {
    const offset = (page - 1) * limit;
    const conditions = [];
    if (filters?.topicId !== undefined && filters?.topicId !== null && filters?.topicId !== '') {
        conditions.push(eq(subtopics.topicId, filters.topicId));
    }
    if (filters?.search !== undefined && filters?.search !== null && filters?.search.trim() !== '') {
        conditions.push(sql`${subtopics.name} ILIKE ${'%' + filters.search + '%'}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await this.dbInstance.query.subtopics.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: [desc(subtopics.createdAt)],
      with: {
        topic: true,
      }
    });

    const [{ count }] = await this.dbInstance
      .select({ count: sql<number>`count(*)` })
      .from(subtopics)
      .where(whereClause ?? sql`true`);

    const total = Number(count ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return { data, total, page, limit, totalPages };
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
