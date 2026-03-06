import { db, subjects } from '@quiz/db';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';

import { BaseRepository } from '@/modules/core/repositories/base.repository';

import { ISubjectRepository } from '../interfaces/subject.repository.interface';

export class DrizzleSubjectRepository extends BaseRepository<typeof subjects.$inferSelect, typeof subjects> implements ISubjectRepository {
  protected table = subjects;

  constructor() {
    super(db);
  }

  async findAll(page: number, limit: number, filters?: { domainId?: string; search?: string }) {
    const offset = (page - 1) * limit;
    const conditions = [];
    if (filters?.domainId !== undefined && filters?.domainId !== null && filters?.domainId !== '') {
        conditions.push(eq(subjects.domainId, filters.domainId));
    }
    if (filters?.search !== undefined && filters?.search !== null && filters?.search.trim() !== '') {
        conditions.push(sql`${subjects.name} ILIKE ${'%' + filters.search + '%'}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await this.dbInstance.query.subjects.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: [desc(subjects.createdAt)],
      with: {
        domain: true,
      }
    });

    const [{ count }] = await this.dbInstance
      .select({ count: sql<number>`count(*)` })
      .from(subjects)
      .where(whereClause ?? sql`true`);

    const total = Number(count ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return { data, total, page, limit, totalPages };
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
