import { db, subjects } from '@quiz/db';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';

import { AuditService } from "@/modules/auth/audit.service";
import { container } from "@/modules/core/container";

export class AdminSubjectEngine {
  static async getSubjects(page: number = 1, limit: number = 20, filters?: { domainId?: string; search?: string }) {
    const offset = (page - 1) * limit;
    const conditions = [];
    if (filters?.domainId !== undefined && filters?.domainId !== null && filters?.domainId !== '') {
        conditions.push(eq(subjects.domainId, filters.domainId));
    }
    if (filters?.search !== undefined && filters?.search !== null && filters?.search.trim() !== '') {
        conditions.push(sql`${subjects.name} ILIKE ${'%' + filters.search + '%'}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db.query.subjects.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: [desc(subjects.createdAt)],
      with: {
        domain: true,
      }
    });

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(subjects)
      .where(whereClause ?? sql`true`);

    const total = Number(count ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return { data, total, page, limit, totalPages };
  }

  static async createSubject(data: typeof subjects.$inferInsert, adminId: string) {
    const [newSub] = await db.insert(subjects).values(data).returning();
    await container.get(AuditService).log({ userId: adminId, action: 'admin_create_subject', metadata: { subjectId: newSub.id } });
    return newSub;
  }

  static async updateSubject(id: string, data: Partial<typeof subjects.$inferInsert>, adminId: string) {
    const [updated] = await db.update(subjects).set(data).where(eq(subjects.id, id)).returning();
    await container.get(AuditService).log({ userId: adminId, action: 'admin_update_subject', metadata: { subjectId: id } });
    return updated;
  }

  static async deleteSubject(id: string, adminId: string) {
      await container.get(AuditService).log({ userId: adminId, action: 'admin_delete_subject', metadata: { subjectId: id } });
    return await db.delete(subjects).where(eq(subjects.id, id)).returning();
  }

  static async deleteSubjectsBatch(ids: string[], adminId: string) {
      await container.get(AuditService).log({ userId: adminId, action: 'admin_batch_delete_subjects', metadata: { count: ids.length } });
    return await db.delete(subjects).where(inArray(subjects.id, ids)).returning();
  }
}
