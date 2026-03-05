import { db, domains } from '@quiz/db';
import { desc, eq, inArray, sql } from 'drizzle-orm';

import { AuditService } from "@/modules/auth/audit.service";
import { container } from "@/modules/core/container";

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

  static async createDomain(data: typeof domains.$inferInsert, adminId: string) {
    const [newDomain] = await db.insert(domains).values(data).returning();
    await container.get(AuditService).log({ userId: adminId, action: 'admin_create_domain', metadata: { domainId: newDomain.id } });
    return newDomain;
  }

  static async updateDomain(id: string, data: Partial<typeof domains.$inferInsert>, adminId: string) {
    const [updated] = await db.update(domains).set(data).where(eq(domains.id, id)).returning();
    await container.get(AuditService).log({ userId: adminId, action: 'admin_update_domain', metadata: { domainId: id } });
    return updated;
  }

  static async deleteDomain(id: string, adminId: string) {
    const [deleted] = await db.delete(domains).where(eq(domains.id, id)).returning();
      await container.get(AuditService).log({ userId: adminId, action: 'admin_delete_domain', metadata: { domainId: id } });
    return deleted;
  }

  static async deleteDomainsBatch(ids: string[], adminId: string) {
      await container.get(AuditService).log({ userId: adminId, action: 'admin_batch_delete_domains', metadata: { count: ids.length } });
    return await db.delete(domains).where(inArray(domains.id, ids)).returning();
  }

  static async approveDomain(domainId: string, adminId: string) {
    const [updated] = await db.update(domains)
      .set({ status: 'active' })
      .where(eq(domains.id, domainId))
      .returning();
      await container.get(AuditService).log({ userId: adminId, action: 'admin_approve_domain', metadata: { domainId } });
    return updated;
  }
}
