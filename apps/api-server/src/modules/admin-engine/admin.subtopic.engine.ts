import { db, subtopics } from '@quiz/db';

import { AuditService } from "@/modules/auth/audit.service";
import { container } from "@/modules/core/container";
import { DrizzleSubtopicRepository } from "@/repositories/implementations/drizzle-subtopic.repository";
import { ISubtopicRepository } from "@/repositories/interfaces/subtopic.repository.interface";

export class AdminSubtopicEngine {
  constructor(
    private readonly repository: ISubtopicRepository = container.get(DrizzleSubtopicRepository),
    private readonly auditService = container.get(AuditService)
  ) {}

  withDb(dbClient: typeof db): AdminSubtopicEngine {
    return new AdminSubtopicEngine(this.repository.withDb(dbClient), this.auditService);
  }

  async getSubtopics(cursor: string | null = null, limit: number = 20, filters?: { topicId?: string; search?: string }) {
    const result = await this.repository.findAll(cursor, limit, filters);
    return {
        subtopics: result.data,
        total: result.total,
        nextCursor: result.nextCursor,
        limit: result.limit
    };
  }

  async createSubtopic(data: typeof subtopics.$inferInsert, adminId: string) {
    const res = await this.repository.create(data);
    await this.auditService.log({ userId: adminId, action: 'admin_create_subtopic', metadata: { subtopicId: res.id } });
    return res;
  }

  async updateSubtopic(id: string, data: Partial<typeof subtopics.$inferInsert>, adminId: string) {
    const res = await this.repository.update(id, data);
    await this.auditService.log({ userId: adminId, action: 'admin_update_subtopic', metadata: { subtopicId: id } });
    return res;
  }

  async deleteSubtopic(id: string, adminId: string) {
    const res = await this.repository.delete(id);
    await this.auditService.log({ userId: adminId, action: 'admin_delete_subtopic', metadata: { subtopicId: id } });
    return res;
  }

  async deleteSubtopicsBatch(ids: string[], adminId: string) {
    const res = await this.repository.deleteBatch(ids);
    await this.auditService.log({ userId: adminId, action: 'admin_batch_delete_subtopics', metadata: { count: ids.length } });
    return res;
  }
}
