import { db, subjects } from '@quiz/db';
import { and, desc, eq, inArray, lt, or, sql } from 'drizzle-orm';

import { buildPaginatedResponse, decodePageCursor } from '@/lib/pagination';
import { BaseRepository } from '@/modules/core/repositories/base.repository';

import { ISubjectRepository } from '../interfaces/subject.repository.interface';

export class DrizzleSubjectRepository extends BaseRepository<typeof subjects.$inferSelect, typeof subjects> implements ISubjectRepository {
  protected table = subjects;

  constructor(dbInstance: typeof db = db) {
    super(dbInstance);
  }

  withDb(dbClient: typeof db): this {
    return new DrizzleSubjectRepository(dbClient) as this;
  }


  async findAll(cursor: string | null, limit: number, filters?: { domainId?: string; search?: string }) {
    const baseConditions = [];

    if (filters?.domainId !== undefined && filters?.domainId !== null && filters?.domainId !== '') {
        baseConditions.push(eq(subjects.domainId, filters.domainId));
    }
    if (filters?.search !== undefined && filters?.search !== null && filters?.search.trim() !== '') {
        baseConditions.push(sql`${subjects.name} ILIKE ${'%' + filters.search + '%'}`);
    }

    const cursorConditions = [];
    if (cursor !== null && cursor !== '') {
      try {
        const { lastSortValue, lastId } = decodePageCursor(cursor);
        cursorConditions.push(
          or(
            lt(subjects.createdAt, new Date(lastSortValue)),
            and(eq(subjects.createdAt, new Date(lastSortValue)), lt(subjects.id, lastId))
          )
        );
      } catch {
        const [cursorDate, cursorId] = cursor.split('|');
        if (cursorId) {
          cursorConditions.push(
            or(
              lt(subjects.createdAt, new Date(cursorDate)),
              and(eq(subjects.createdAt, new Date(cursorDate)), lt(subjects.id, cursorId))
            )
          );
        } else {
          cursorConditions.push(lt(subjects.createdAt, new Date(cursorDate)));
        }
      }
    }

    const allConditions = [...baseConditions, ...cursorConditions];
    const whereClause = allConditions.length > 0 ? and(...allConditions) : undefined;

    const dataRaw = await this.dbInstance.query.subjects.findMany({
      where: whereClause,
      limit: limit + 1,
      orderBy: [desc(subjects.createdAt), desc(subjects.id)],
      with: {
        domain: true,
      }
    });

    const [{ count: totalCount }] = await this.dbInstance
      .select({ count: sql<number>`count(*)` })
      .from(subjects)
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

  async create(data: typeof subjects.$inferInsert) {
    const [newSub] = await this.dbInstance.insert(subjects).values(data).returning();
    return newSub;
  }

  async update(id: string, data: Partial<typeof subjects.$inferInsert>) {
    const [updated] = await this.dbInstance.update(subjects).set(data).where(eq(subjects.id, id)).returning();
    return updated;
  }

  async delete(id: string) {
    const [deleted] = await this.dbInstance.delete(subjects).where(eq(subjects.id, id)).returning();
    return deleted;
  }

  async deleteBatch(ids: string[]) {
    return await this.dbInstance.delete(subjects).where(inArray(subjects.id, ids)).returning();
  }
}
