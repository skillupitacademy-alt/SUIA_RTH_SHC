import { db, examBlueprints } from '@quiz/db';
import { and, desc, eq, lt, sql } from 'drizzle-orm';

import { getDrizzleFields } from '@/lib/field-selector';
import { BaseRepository } from '@/modules/core/repositories/base.repository';

import { IBlueprintRepository } from '../interfaces/blueprint.repository.interface';

export class DrizzleBlueprintRepository extends BaseRepository<typeof examBlueprints.$inferSelect, typeof examBlueprints> implements IBlueprintRepository {
  protected table = examBlueprints;

  constructor(dbInstance: typeof db = db) {
    super(dbInstance);
  }

  withDb(dbClient: typeof db): this {
    return new DrizzleBlueprintRepository(dbClient) as this;
  }


  async findAll(cursor: string | null = null, limit: number = 20, filters?: { search?: string; fields?: string }) {
    const conditions = [];

    if (cursor !== null && cursor !== '') {
        conditions.push(lt(examBlueprints.createdAt, new Date(cursor)));
    }

    if (filters?.search !== undefined && filters?.search !== null && filters?.search.trim() !== '') {
        conditions.push(sql`${examBlueprints.name} ILIKE ${'%' + filters.search + '%'}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const BLUEPRINT_ADMIN_ALLOWLIST = [
        'id',
        'name',
        'description',
        'config',
        'version',
        'createdAt',
        'updatedAt'
    ];
    const columns = getDrizzleFields(filters?.fields, BLUEPRINT_ADMIN_ALLOWLIST, examBlueprints as unknown as Record<string, unknown>);

    const dataRaw = await this.dbInstance.query.examBlueprints.findMany({
      where: whereClause,
      limit: limit + 1,
      orderBy: [desc(examBlueprints.createdAt)],
      ...(columns ? { columns } : {}),
    });

    const hasNext = dataRaw.length > limit;
    const data = hasNext ? dataRaw.slice(0, limit) : dataRaw;
    const nextCursor = hasNext ? data[data.length - 1].createdAt.toISOString() : null;

    const [{ count }] = await this.dbInstance
      .select({ count: sql<number>`count(*)` })
      .from(examBlueprints)
      .where(conditions.length > 0 ? and(...conditions.filter(c => !c.toString().includes('created_at <'))) : sql`true`);

    const total = Number(count ?? 0);

    return { data, total, nextCursor, limit };
  }

  async create(data: typeof examBlueprints.$inferInsert) {
    const [newBp] = await this.dbInstance.insert(examBlueprints).values(data).returning();
    return newBp;
  }

  async update(id: string, data: Partial<typeof examBlueprints.$inferInsert>) {
    const [updated] = await this.dbInstance.update(examBlueprints).set(data).where(eq(examBlueprints.id, id)).returning();
    return updated;
  }

  async delete(id: string) {
    const [deleted] = await this.dbInstance.delete(examBlueprints).where(eq(examBlueprints.id, id)).returning();
    return deleted;
  }
}
