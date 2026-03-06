import { topics } from '@quiz/db';

import { AuditService } from "@/modules/auth/audit.service";
import { container } from "@/modules/core/container";
import { DrizzleTopicRepository } from "@/repositories/implementations/drizzle-topic.repository";
import { ITopicRepository } from "@/repositories/interfaces/topic.repository.interface";

export class AdminTopicEngine {
  constructor(
    private readonly repository: ITopicRepository = container.get(DrizzleTopicRepository),
    private readonly auditService = container.get(AuditService)
  ) {}

  async getTopics(page: number = 1, limit: number = 20, filters?: { subjectId?: string; search?: string }) {
    return await this.repository.findAll(page, limit, filters);
  }

  async createTopic(data: typeof topics.$inferInsert, adminId: string) {
    const newTopic = await this.repository.create(data);
    await this.auditService.log({ userId: adminId, action: 'admin_create_topic', metadata: { topicId: newTopic.id } });
    return newTopic;
  }

  async updateTopic(id: string, data: Partial<typeof topics.$inferInsert>, adminId: string) {
    const updated = await this.repository.update(id, data);
    await this.auditService.log({ userId: adminId, action: 'admin_update_topic', metadata: { topicId: id } });
    return updated;
  }

  async deleteTopic(id: string, adminId: string) {
    await this.auditService.log({ userId: adminId, action: 'admin_delete_topic', metadata: { topicId: id } });
    return await this.repository.delete(id);
  }

  async deleteTopicsBatch(ids: string[], adminId: string) {
    await this.auditService.log({ userId: adminId, action: 'admin_batch_delete_topics', metadata: { count: ids.length } });
    return await this.repository.deleteBatch(ids);
  }

  async validateTopic(_topicId: string) {
    // Placeholder for topic validation logic
    return { valid: true, issues: [] };
  }
}
