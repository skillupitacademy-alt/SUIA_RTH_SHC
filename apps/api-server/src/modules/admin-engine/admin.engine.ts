import { AdminHierarchyEngine } from './admin.hierarchy.engine';
import { AdminQuestionEngine } from './admin.question.engine';
import type { CreateQuestionInput } from './admin.question.engine';
import { AdminAnalyticsEngine } from './admin.analytics.engine';
import { AdminUserEngine } from './admin.user.engine';
import type { UpdateUserInput } from './admin.user.engine';
import { AdminBlueprintEngine } from './admin.blueprint.engine';
import { AuditService } from '../auth/audit.service';
import type { AtomicHierarchyPayload } from '../domain/hierarchy.factory';
import { HierarchyFactory } from '../domain/hierarchy.factory';
import type { domains, subjects, topics, subtopics, skills, examBlueprints } from '@quiz/db';

export type DomainInsert = typeof domains.$inferInsert;
export type SubjectInsert = typeof subjects.$inferInsert;
export type TopicInsert = typeof topics.$inferInsert;
export type SubtopicInsert = typeof subtopics.$inferInsert;
export type SkillInsert = typeof skills.$inferInsert;
export type BlueprintInsert = typeof examBlueprints.$inferInsert;
export { CreateQuestionInput, UpdateUserInput };

export class AdminEngine {
  // --- ANALYTICS & METRICS ---
  static async getPlatformMetrics() { return await AdminAnalyticsEngine.getPlatformMetrics(); }
  static async getExamActivity() { return await AdminAnalyticsEngine.getExamActivity(); }
  static async getEfficiencyAnalytics() { return await AdminAnalyticsEngine.getEfficiencyAnalytics(); }
  static async getPerformanceAnalytics(range: string = '7d') { return await AdminAnalyticsEngine.getPerformanceAnalytics(range); }
  static async getRecentAuditLogs(limit: number = 20) { return await AdminAnalyticsEngine.getRecentAuditLogs(limit); }
  static async getBlueprintMetrics() { return await AdminAnalyticsEngine.getBlueprintMetrics(); }
  static async getContentHealthReport() { return await AdminAnalyticsEngine.getContentHealthReport(); }
  static async getGrowthZones() { return await AdminAnalyticsEngine.getGrowthZones(); }
  static async getRBACMetrics() { return await AdminAnalyticsEngine.getRBACMetrics(); }
  static async getSecuritySignals() { return await AdminAnalyticsEngine.getSecuritySignals(); }
  static async getAccountMetrics() { return await AdminAnalyticsEngine.getAccountMetrics(); }
  static async getLiveSessions() { return await AdminAnalyticsEngine.getLiveSessions(); }
  
  // --- HIERARCHY & CONTENT ---
  static async atomicSeed(_payload: AtomicHierarchyPayload) { return await HierarchyFactory.atomicUpsert(_payload); }
  
  static async getDomains(page: number = 1, limit: number = 20, filters?: { search?: string }) { return await AdminHierarchyEngine.getDomains(page, limit, filters); }
  static async createDomain(data: DomainInsert, adminId: string) { 
    const res = await AdminHierarchyEngine.createDomain(data); 
    await AuditService.log({ userId: adminId, action: 'admin_create_domain', metadata: { domainId: res.id } });
    return res;
  }
  static async updateDomain(id: string, data: Partial<DomainInsert>, adminId: string) { 
    const res = await AdminHierarchyEngine.updateDomain(id, data);
    await AuditService.log({ userId: adminId, action: 'admin_update_domain', metadata: { domainId: id } });
    return res;
  }
  static async deleteDomain(id: string, adminId: string) { 
    const res = await AdminHierarchyEngine.deleteDomain(id);
    await AuditService.log({ userId: adminId, action: 'admin_delete_domain', metadata: { domainId: id } });
    return res;
  }
  static async deleteDomainsBatch(ids: string[], adminId: string) { 
    const res = await AdminHierarchyEngine.deleteDomainsBatch(ids);
    await AuditService.log({ userId: adminId, action: 'admin_batch_delete_domains', metadata: { count: ids.length } });
    return res;
  }
  static async approveDomain(domainId: string, adminId: string) { 
    const res = await AdminHierarchyEngine.approveDomain(domainId);
    await AuditService.log({ userId: adminId, action: 'admin_approve_domain', metadata: { domainId } });
    return res;
  }

  static async getSubjects(page: number = 1, limit: number = 20, filters?: { domainId?: string; search?: string }) { return await AdminHierarchyEngine.getSubjects(page, limit, filters); }
  static async createSubject(data: SubjectInsert, adminId: string) { 
    const res = await AdminHierarchyEngine.createSubject(data);
    await AuditService.log({ userId: adminId, action: 'admin_create_subject', metadata: { subjectId: res.id } });
    return res;
  }
  static async updateSubject(id: string, data: Partial<SubjectInsert>, adminId: string) { 
    const res = await AdminHierarchyEngine.updateSubject(id, data);
    await AuditService.log({ userId: adminId, action: 'admin_update_subject', metadata: { subjectId: id } });
    return res;
  }
  static async deleteSubject(id: string, adminId: string) { 
    const res = await AdminHierarchyEngine.deleteSubject(id);
    await AuditService.log({ userId: adminId, action: 'admin_delete_subject', metadata: { subjectId: id } });
    return res;
  }
  static async deleteSubjectsBatch(ids: string[], adminId: string) { 
    const res = await AdminHierarchyEngine.deleteSubjectsBatch(ids);
    await AuditService.log({ userId: adminId, action: 'admin_batch_delete_subjects', metadata: { count: ids.length } });
    return res;
  }

  static async getTopics(page: number = 1, limit: number = 20, filters?: { subjectId?: string; search?: string }) { return await AdminHierarchyEngine.getTopics(page, limit, filters); }
  static async createTopic(data: TopicInsert, adminId: string) { 
    const res = await AdminHierarchyEngine.createTopic(data);
    await AuditService.log({ userId: adminId, action: 'admin_create_topic', metadata: { topicId: res.id } });
    return res;
  }
  static async updateTopic(id: string, data: Partial<TopicInsert>, adminId: string) { 
    const res = await AdminHierarchyEngine.updateTopic(id, data);
    await AuditService.log({ userId: adminId, action: 'admin_update_topic', metadata: { topicId: id } });
    return res;
  }
  static async deleteTopic(id: string, adminId: string) { 
    const res = await AdminHierarchyEngine.deleteTopic(id);
    await AuditService.log({ userId: adminId, action: 'admin_delete_topic', metadata: { topicId: id } });
    return res;
  }
  static async deleteTopicsBatch(ids: string[], adminId: string) { 
    const res = await AdminHierarchyEngine.deleteTopicsBatch(ids);
    await AuditService.log({ userId: adminId, action: 'admin_batch_delete_topics', metadata: { count: ids.length } });
    return res;
  }
  static async validateTopic(topicId: string) { return await AdminHierarchyEngine.validateTopic(topicId); }

  static async getSubtopics(page: number = 1, limit: number = 20, filters?: { topicId?: string; search?: string }) { return await AdminHierarchyEngine.getSubtopics(page, limit, filters); }
  static async createSubtopic(data: SubtopicInsert, adminId: string) { 
    const res = await AdminHierarchyEngine.createSubtopic(data);
    await AuditService.log({ userId: adminId, action: 'admin_create_subtopic', metadata: { subtopicId: res.id } });
    return res;
  }
  static async updateSubtopic(id: string, data: Partial<SubtopicInsert>, adminId: string) { 
    const res = await AdminHierarchyEngine.updateSubtopic(id, data);
    await AuditService.log({ userId: adminId, action: 'admin_update_subtopic', metadata: { subtopicId: id } });
    return res;
  }
  static async deleteSubtopic(id: string, adminId: string) { 
    const res = await AdminHierarchyEngine.deleteSubtopic(id);
    await AuditService.log({ userId: adminId, action: 'admin_delete_subtopic', metadata: { subtopicId: id } });
    return res;
  }
  static async deleteSubtopicsBatch(ids: string[], adminId: string) { 
    const res = await AdminHierarchyEngine.deleteSubtopicsBatch(ids);
    await AuditService.log({ userId: adminId, action: 'admin_batch_delete_subtopics', metadata: { count: ids.length } });
    return res;
  }

  static async getSkills(page: number = 1, limit: number = 20, filters?: { search?: string }) { return await AdminHierarchyEngine.getSkills(page, limit, filters); }
  static async getTopicSkills(page: number = 1, limit: number = 20) { return await AdminHierarchyEngine.getTopicSkills(page, limit); }
  static async getSkillsByTopic(topicId: string) { return await AdminHierarchyEngine.getSkillsByTopic(topicId); }
  static async mapTopicToSkills(topicId: string, skillIds: string[], adminId: string) { 
    await AdminHierarchyEngine.mapTopicToSkills(topicId, skillIds);
    await AuditService.log({ userId: adminId, action: 'admin_map_topic_skills', metadata: { topicId, skillCount: skillIds.length } });
  }
  static async createSkill(data: SkillInsert, adminId: string) { 
    const res = await AdminHierarchyEngine.createSkill(data);
    await AuditService.log({ userId: adminId, action: 'admin_create_skill', metadata: { skillId: res.id } });
    return res;
  }
  static async updateSkill(id: string, data: Partial<SkillInsert>, adminId: string) { 
    const res = await AdminHierarchyEngine.updateSkill(id, data);
    await AuditService.log({ userId: adminId, action: 'admin_update_skill', metadata: { skillId: id } });
    return res;
  }
  static async deleteSkill(id: string, adminId: string) { 
    const res = await AdminHierarchyEngine.deleteSkill(id);
    await AuditService.log({ userId: adminId, action: 'admin_delete_skill', metadata: { skillId: id } });
    return res;
  }
  static async deleteSkillsBatch(ids: string[], adminId: string) { 
    const res = await AdminHierarchyEngine.deleteSkillsBatch(ids);
    await AuditService.log({ userId: adminId, action: 'admin_batch_delete_skills', metadata: { count: ids.length } });
    return res;
  }

  // --- QUESTION BANK ---
  static async getQuestions(page: number = 1, limit: number = 20, filters?: Record<string, unknown>) { return await AdminQuestionEngine.getQuestions(page, limit, filters); }
  static async createQuestion(data: CreateQuestionInput, adminId: string) { 
    const res = await AdminQuestionEngine.createQuestion(data);
    await AuditService.log({ userId: adminId, action: 'admin_create_question', metadata: { questionId: res.id } });
    return res;
  }
  static async updateQuestion(id: string, data: Partial<CreateQuestionInput>, adminId: string) { 
    const res = await AdminQuestionEngine.updateQuestion(id, data);
    await AuditService.log({ userId: adminId, action: 'admin_update_question', metadata: { questionId: id } });
    return res;
  }
  static async deleteQuestion(id: string, adminId: string) { 
    const res = await AdminQuestionEngine.deleteQuestion(id);
    await AuditService.log({ userId: adminId, action: 'admin_delete_question', metadata: { questionId: id } });
    return res;
  }
  static async deleteQuestionsBatch(ids: string[], adminId: string) { 
    const res = await AdminQuestionEngine.deleteQuestionsBatch(ids);
    await AuditService.log({ userId: adminId, action: 'admin_batch_delete_questions', metadata: { count: ids.length } });
    return res;
  }
  static async publishQuestion(questionId: string, adminId: string) {
    const res = await AdminQuestionEngine.publishQuestion(questionId);
    await AuditService.log({ userId: adminId, action: 'admin_publish_question', metadata: { questionId } });
    return res;
  }
  static async bulkCreateQuestionsWithContext(questions: CreateQuestionInput[], context?: Record<string, unknown>, adminId?: string) { 
    const res = await AdminQuestionEngine.bulkCreateQuestionsWithContext(questions, context, adminId);
    if (adminId !== undefined && adminId !== null && adminId !== '') {
        await AuditService.log({ userId: adminId, action: 'admin_bulk_create_questions', metadata: { count: res.length } });
    }
    return res;
  }

  // --- BLUEPRINTS ---
  static async getBlueprints(page: number = 1, limit: number = 20, filters?: { search?: string }) { return await AdminBlueprintEngine.getBlueprints(page, limit, filters); }
  static async createBlueprint(data: BlueprintInsert) { return await AdminBlueprintEngine.createBlueprint(data); }
  static async updateBlueprint(id: string, data: Partial<BlueprintInsert>) { return await AdminBlueprintEngine.updateBlueprint(id, data); }
  static async deleteBlueprint(id: string) { return await AdminBlueprintEngine.deleteBlueprint(id); }
  static async getBlueprintById(id: string) { return await AdminBlueprintEngine.getBlueprintById(id); }

  // --- USERS & SESSIONS ---
  static async getUsers(page: number = 1, limit: number = 20, status: 'active' | 'deleted' = 'active', filters?: Record<string, unknown>) { return await AdminUserEngine.getUsers(page, limit, status, filters); }
  static async updateUser(id: string, data: UpdateUserInput, adminId: string) { 
    const res = await AdminUserEngine.updateUser(id, data);
    await AuditService.log({ userId: adminId, action: 'admin_update_user', metadata: { targetUserId: id } });
    return res;
  }
  static async deleteUser(id: string, adminId: string) { 
    const res = await AdminUserEngine.deleteUser(id);
    await AuditService.log({ userId: adminId, action: 'admin_delete_user', metadata: { targetUserId: id } });
    return res;
  }
  static async toggleBlockStatus(userId: string, isBlocked: boolean, adminId: string) { 
    const res = await AdminUserEngine.toggleBlockStatus(userId, isBlocked);
    await AuditService.log({ userId: adminId, action: 'admin_toggle_block', metadata: { targetUserId: userId, isBlocked } });
    return res;
  }
}
