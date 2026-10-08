import { db, subtopics } from '@quiz/db';
import { and, desc, eq, inArray, lt, or, sql } from 'drizzle-orm';

import { buildPaginatedResponse, decodePageCursor } from '@/lib/pagination';
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
    const baseConditions = [];

    if (filters?.topicId !== undefined && filters?.topicId !== null && filters?.topicId !== '') {
        baseConditions.push(eq(subtopics.topicId, filters.topicId));
    }
    if (filters?.search !== undefined && filters?.search !== null && filters?.search.trim() !== '') {
        baseConditions.push(sql`${subtopics.name} ILIKE ${'%' + filters.search + '%'}`);
    }

    const cursorConditions = [];
    if (cursor !== null && cursor !== '') {
      try {
        const { lastSortValue, lastId } = decodePageCursor(cursor);
        cursorConditions.push(
          or(
            lt(subtopics.createdAt, new Date(lastSortValue)),
            and(eq(subtopics.createdAt, new Date(lastSortValue)), lt(subtopics.id, lastId))
          )
        );
      } catch {
        const [cursorDate, cursorId] = cursor.split('|');
        if (cursorId) {
          cursorConditions.push(
            or(
              lt(subtopics.createdAt, new Date(cursorDate)),
              and(eq(subtopics.createdAt, new Date(cursorDate)), lt(subtopics.id, cursorId))
            )
          );
        } else {
          cursorConditions.push(lt(subtopics.createdAt, new Date(cursorDate)));
        }
      }
    }

    const allConditions = [...baseConditions, ...cursorConditions];
    const whereClause = allConditions.length > 0 ? and(...allConditions) : undefined;

    const dataRaw = await this.dbInstance.query.subtopics.findMany({
      where: whereClause,
      limit: limit + 1,
      orderBy: [desc(subtopics.createdAt), desc(subtopics.id)],
      with: {
        topic: true,
      }
    });

    const [{ count: totalCount }] = await this.dbInstance
      .select({ count: sql<number>`count(*)` })
      .from(subtopics)
      .where(baseConditions.length > 0 ? and(...baseConditions) : sql`true`);

    const total = Number(totalCount ?? 0);
    const paginated = buildPaginatedResponse(
      dataRaw,
      limit,
      item => item.createdAt.toISOString(),
      total
    );

    return {
      data: paginated.data,
      total: paginated.total ?? 0,
      nextCursor: paginated.nextCursor,
      limit
    };
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
