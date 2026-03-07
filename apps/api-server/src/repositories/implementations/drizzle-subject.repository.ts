import { db, subjects } from '@quiz/db';
import { and, desc, eq, inArray, lt, sql } from 'drizzle-orm';

import { BaseRepository } from '@/modules/core/repositories/base.repository';

import { ISubjectRepository } from '../interfaces/subject.repository.interface';

export class DrizzleSubjectRepository extends BaseRepository<typeof subjects.$inferSelect, typeof subjects> implements ISubjectRepository {
  protected table = subjects;

  constructor() {
    super(db);
  }

  async findAll(cursor: string | null, limit: number, filters?: { domainId?: string; search?: string }) {
    const conditions = [];

    if (cursor !== null && cursor !== '') {
        conditions.push(lt(subjects.createdAt, new Date(cursor)));
    }

    if (filters?.domainId !== undefined && filters?.domainId !== null && filters?.domainId !== '') {
        conditions.push(eq(subjects.domainId, filters.domainId));
    }
    if (filters?.search !== undefined && filters?.search !== null && filters?.search.trim() !== '') {
        conditions.push(sql`${subjects.name} ILIKE ${'%' + filters.search + '%'}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const dataRaw = await this.dbInstance.query.subjects.findMany({
      where: whereClause,
      limit: limit + 1,
      orderBy: [desc(subjects.createdAt)],
      with: {
        domain: true,
      }
    });

    const hasNext = dataRaw.length > limit;
    const data = hasNext ? dataRaw.slice(0, limit) : dataRaw;
    const nextCursor = hasNext ? data[data.length - 1].createdAt.toISOString() : null;

    const [{ count }] = await this.dbInstance
      .select({ count: sql<number>`count(*)` })
      .from(subjects)
      .where(conditions.length > 0 ? and(...conditions.filter(c => !c.toString().includes('created_at <'))) : sql`true`);

    const total = Number(count ?? 0);

    return { data, total, nextCursor, limit };
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
