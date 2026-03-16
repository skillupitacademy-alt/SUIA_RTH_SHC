import { db, topics } from '@quiz/db';
import { and, desc, eq, inArray, lt, or, sql } from 'drizzle-orm';

import { buildPaginatedResponse, decodePageCursor } from '@/lib/pagination';
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
    const baseConditions = [];

    if (filters?.subjectId !== undefined && filters?.subjectId !== null && filters?.subjectId !== '') {
        baseConditions.push(eq(topics.subjectId, filters.subjectId));
    }
    if (filters?.search !== undefined && filters?.search !== null && filters?.search.trim() !== '') {
        baseConditions.push(sql`${topics.name} ILIKE ${'%' + filters.search + '%'}`);
    }

    const cursorConditions = [];
    if (cursor !== null && cursor !== '') {
      try {
        const { lastSortValue, lastId } = decodePageCursor(cursor);
        cursorConditions.push(
          or(
            lt(topics.createdAt, new Date(lastSortValue)),
            and(eq(topics.createdAt, new Date(lastSortValue)), lt(topics.id, lastId))
          )
        );
      } catch {
        const [cursorDate, cursorId] = cursor.split('|');
        if (cursorId) {
          cursorConditions.push(
            or(
              lt(topics.createdAt, new Date(cursorDate)),
              and(eq(topics.createdAt, new Date(cursorDate)), lt(topics.id, cursorId))
            )
          );
        } else {
          cursorConditions.push(lt(topics.createdAt, new Date(cursorDate)));
        }
      }
    }

    const allConditions = [...baseConditions, ...cursorConditions];
    const whereClause = allConditions.length > 0 ? and(...allConditions) : undefined;

    const dataRaw = await this.dbInstance.query.topics.findMany({
      where: whereClause,
      limit: limit + 1,
      orderBy: [desc(topics.createdAt), desc(topics.id)],
      with: {
        subject: true,
      }
    });

    const [{ count: totalCount }] = await this.dbInstance
      .select({ count: sql<number>`count(*)` })
      .from(topics)
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
