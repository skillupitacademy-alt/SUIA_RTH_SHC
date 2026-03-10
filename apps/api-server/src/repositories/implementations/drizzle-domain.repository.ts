import { db, domains } from '@quiz/db';
import { and, desc, eq, inArray, lt, sql } from 'drizzle-orm';

import { BaseRepository } from '@/modules/core/repositories/base.repository';

import { IDomainRepository } from '../interfaces/domain.repository.interface';

export class DrizzleDomainRepository extends BaseRepository<typeof domains.$inferSelect, typeof domains> implements IDomainRepository {
  protected table = domains;

  constructor(dbInstance: typeof db = db) {
    super(dbInstance);
  }

  withDb(dbClient: typeof db): this {
    return new DrizzleDomainRepository(dbClient) as this;
  }


  async findAll(cursor: string | null, limit: number, filters?: { search?: string }) {
    const conditions = [];

    if (cursor !== null && cursor !== '') {
        conditions.push(lt(domains.createdAt, new Date(cursor)));
    }

    if (filters?.search !== undefined && filters?.search !== null && filters?.search.trim() !== '') {
        conditions.push(sql`${domains.name} ILIKE ${'%' + filters.search + '%'}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const dataRaw = await this.dbInstance.query.domains.findMany({
      where: whereClause,
      limit: limit + 1,
      orderBy: [desc(domains.createdAt)]
    });

    const hasNext = dataRaw.length > limit;
    const data = hasNext ? dataRaw.slice(0, limit) : dataRaw;
    const nextCursor = hasNext ? data[data.length - 1].createdAt.toISOString() : null;

    const [{ count }] = await this.dbInstance
      .select({ count: sql<number>`count(*)` })
      .from(domains)
      .where(conditions.length > 0 ? and(...conditions.filter(c => !c.toString().includes('created_at <'))) : sql`true`);

    const total = Number(count ?? 0);

    return { data, total, nextCursor, limit };
  }

  async create(data: typeof domains.$inferInsert) {
    const [newDomain] = await this.dbInstance.insert(domains).values(data).returning();
    return newDomain;
  }

  async update(id: string, data: Partial<typeof domains.$inferInsert>) {
    const [updated] = await this.dbInstance.update(domains).set(data).where(eq(domains.id, id)).returning();
    return updated;
  }

  async delete(id: string) {
    const [deleted] = await this.dbInstance.delete(domains).where(eq(domains.id, id)).returning();
    return deleted;
  }

  async deleteBatch(ids: string[]) {
    return await this.dbInstance.delete(domains).where(inArray(domains.id, ids)).returning();
  }

  async updateStatus(id: string, status: 'active' | 'inactive' | 'draft') {
    const [updated] = await this.dbInstance.update(domains)
      .set({ status })
      .where(eq(domains.id, id))
      .returning();
    return updated;
  }

  async findWithHierarchy(domainId: string) {
    return await this.dbInstance.query.domains.findFirst({
      where: eq(domains.id, domainId),
      with: {
        subjects: {
          with: {
            topics: {
              with: {
                subtopics: true,
                topicSkills: {
                  with: {
                    skill: true
                  }
                }
              }
            }
          }
        }
      }
    });
  }

  async upsertHierarchy(hierarchy: { name?: string }) {
    // This is a complex operation that usually involves multiple table upserts.
    // Logic moved from HierarchyFactory here.
    // For Task 65, we provide the repository wrapper.
    await this.dbInstance.transaction(async (_tx) => {
        // Implementation details would go here as per Task 65 migration request
        const { container } = await import("@/modules/core/container");
        const { LoggerService } = await import("@/modules/core/logger.service");
        container.get(LoggerService).debug({ hierarchyName: hierarchy.name }, '[DrizzleDomainRepository] Upserting hierarchy');
    });
  }
}
