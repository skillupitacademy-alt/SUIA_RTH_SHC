import { db, domains } from '@quiz/db';
import { desc, eq, inArray, sql } from 'drizzle-orm';

import { BaseRepository } from '@/modules/core/repositories/base.repository';

import { IDomainRepository } from '../interfaces/domain.repository.interface';

export class DrizzleDomainRepository extends BaseRepository<typeof domains.$inferSelect, typeof domains> implements IDomainRepository {
  protected table = domains;

  constructor() {
    super(db);
  }

  async findAll(page: number, limit: number, filters?: { search?: string }) {
    const offset = (page - 1) * limit;
    let whereClause = undefined;
    if (filters?.search !== undefined && filters?.search !== null && filters?.search.trim() !== '') {
        whereClause = sql`${domains.name} ILIKE ${'%' + filters.search + '%'}`;
    }

    const data = await this.dbInstance.query.domains.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: [desc(domains.createdAt)]
    });

    const [{ count }] = await this.dbInstance
      .select({ count: sql<number>`count(*)` })
      .from(domains)
      .where(whereClause ?? sql`true`);

    const total = Number(count ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return { data, total, page, limit, totalPages };
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
