import { db, domains } from '@quiz/db';
import { desc, eq, inArray, sql } from 'drizzle-orm';

export class AdminDomainEngine {
  static async getDomains(page: number = 1, limit: number = 20, filters?: { search?: string }) {
    const offset = (page - 1) * limit;
    let whereClause = undefined;
    if (filters?.search !== undefined && filters?.search !== null && filters?.search.trim() !== '') {
        whereClause = sql`${domains.name} ILIKE ${'%' + filters.search + '%'}`;
    }

    const data = await db.query.domains.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: [desc(domains.createdAt)]
    });

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(domains)
      .where(whereClause ?? sql`true`);

    const total = Number(count ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return { data, total, page, limit, totalPages };
  }

  static async createDomain(data: typeof domains.$inferInsert) {
    const [newDomain] = await db.insert(domains).values(data).returning();
    return newDomain;
  }

  static async updateDomain(id: string, data: Partial<typeof domains.$inferInsert>) {
    const [updated] = await db.update(domains).set(data).where(eq(domains.id, id)).returning();
    return updated;
  }

  static async deleteDomain(id: string) {
    const [deleted] = await db.delete(domains).where(eq(domains.id, id)).returning();
    return deleted;
  }

  static async deleteDomainsBatch(ids: string[]) {
    return await db.delete(domains).where(inArray(domains.id, ids)).returning();
  }

  static async approveDomain(domainId: string) {
    const [updated] = await db.update(domains)
      .set({ status: 'active' })
      .where(eq(domains.id, domainId))
      .returning();
    return updated;
  }
}
