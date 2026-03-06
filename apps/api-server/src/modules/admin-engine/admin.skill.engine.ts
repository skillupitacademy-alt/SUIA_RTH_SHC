import { skills } from '@quiz/db';

import { AuditService } from "@/modules/auth/audit.service";
import { container } from "@/modules/core/container";
import { DrizzleSkillRepository } from "@/repositories/implementations/drizzle-skill.repository";
import { ISkillRepository } from "@/repositories/interfaces/skill.repository.interface";

export class AdminSkillEngine {
  constructor(
    private readonly repository: ISkillRepository = container.get(DrizzleSkillRepository),
    private readonly auditService = container.get(AuditService)
  ) {}

  async getSkills(page: number = 1, limit: number = 20, filters?: { search?: string }) {
    return await this.repository.findAll(page, limit, filters);
  }

  async createSkill(data: typeof skills.$inferInsert, adminId: string) {
    const newSkill = await this.repository.create(data);
    await this.auditService.log({ userId: adminId, action: 'admin_create_skill', metadata: { skillId: newSkill.id } });
    return newSkill;
  }

  async updateSkill(id: string, data: Partial<typeof skills.$inferInsert>, adminId: string) {
    const updated = await this.repository.update(id, data);
    await this.auditService.log({ userId: adminId, action: 'admin_update_skill', metadata: { skillId: id } });
    return updated;
  }

  async deleteSkill(id: string, adminId: string) {
    await this.auditService.log({ userId: adminId, action: 'admin_delete_skill', metadata: { skillId: id } });
    return await this.repository.delete(id);
  }

  async deleteSkillsBatch(ids: string[], adminId: string) {
    await this.auditService.log({ userId: adminId, action: 'admin_batch_delete_skills', metadata: { count: ids.length } });
    return await this.repository.deleteBatch(ids);
  }

  async getTopicSkills(page: number = 1, limit: number = 20) {
    return await this.repository.getTopicSkills(page, limit);
  }

  async getSkillsByTopic(topicId: string) {
    return await this.repository.getSkillsByTopic(topicId);
  }

  async mapTopicToSkills(topicId: string, skillIds: string[], adminId: string) {
    await this.auditService.log({ userId: adminId, action: 'admin_map_topic_skills', metadata: { topicId, skillCount: skillIds.length } });
    return await this.repository.mapTopicToSkills(topicId, skillIds);
  }
}
