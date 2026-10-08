import { db, subjects } from '@quiz/db';

import { AuditService } from "@/modules/auth/audit.service";
import { container } from "@/modules/core/container";
import { DrizzleSubjectRepository } from "@/repositories/implementations/drizzle-subject.repository";
import { ISubjectRepository } from "@/repositories/interfaces/subject.repository.interface";

export class AdminSubjectEngine {
  constructor(
    private readonly repository: ISubjectRepository = container.get(DrizzleSubjectRepository),
    private readonly auditService = container.get(AuditService)
  ) {}

  withDb(dbClient: typeof db): AdminSubjectEngine {
    return new AdminSubjectEngine(this.repository.withDb(dbClient), this.auditService);
  }

  async getSubjects(cursor: string | null = null, limit: number = 20, filters?: { domainId?: string; search?: string }) {
    const result = await this.repository.findAll(cursor, limit, filters);
    return {
        subjects: result.data,
        total: result.total,
        nextCursor: result.nextCursor,
        limit: result.limit
    };
  }

  async createSubject(data: typeof subjects.$inferInsert, adminId: string) {
    const newSub = await this.repository.create(data);
    await this.auditService.log({ userId: adminId, action: 'admin_create_subject', metadata: { subjectId: newSub.id } });
    return newSub;
  }

  async updateSubject(id: string, data: Partial<typeof subjects.$inferInsert>, adminId: string) {
    const updated = await this.repository.update(id, data);
    await this.auditService.log({ userId: adminId, action: 'admin_update_subject', metadata: { subjectId: id } });
    return updated;
  }

  async deleteSubject(id: string, adminId: string) {
    await this.auditService.log({ userId: adminId, action: 'admin_delete_subject', metadata: { subjectId: id } });
    return await this.repository.delete(id);
  }

  async deleteSubjectsBatch(ids: string[], adminId: string) {
    await this.auditService.log({ userId: adminId, action: 'admin_batch_delete_subjects', metadata: { count: ids.length } });
    return await this.repository.deleteBatch(ids);
  }
}
