import { db, questions, domains, subjects, topics, skills } from '@quiz/db';
import { eq, and, sql, desc } from 'drizzle-orm';
import { AuditService } from '../auth/audit.service';
import { QuestionService } from '../question/question.service';
import { DomainService, SubjectService, TopicService } from '../domain/domain.service';
import { SkillService } from '../domain/skill.service';

export class AdminEngine {
  /**
   * Creates a new question.
   */
  static async createQuestion(data: any, adminId: string) {
    const question = await QuestionService.createQuestion(data);

    await AuditService.log({
      userId: adminId,
      action: 'admin_create_question',
      metadata: { questionId: question[0].id },
    });

    return question[0];
  }

  /**
   * Bulk creates questions.
   */
  static async bulkCreateQuestions(data: any[], adminId: string) {
    const created = await QuestionService.bulkCreateQuestions(data);

    await AuditService.log({
      userId: adminId,
      action: 'admin_bulk_create_questions',
      metadata: { count: created.length },
    });

    return created;
  }

  /**
   * Fetches all questions for management.
   */
  static async getAllQuestions() {
    return await QuestionService.getAllQuestions();
  }

  /**
   * Domain Management
   */
  static async createDomain(data: any, adminId: string) {
    const result = await DomainService.createDomain(data);
    await AuditService.log({ userId: adminId, action: 'admin_create_domain', metadata: { domainId: result[0].id } });
    return result[0];
  }

  static async updateDomain(id: string, data: any, adminId: string) {
    const result = await DomainService.updateDomain(id, data);
    await AuditService.log({ userId: adminId, action: 'admin_update_domain', metadata: { domainId: id } });
    return result[0];
  }

  static async deleteDomain(id: string, adminId: string) {
    const result = await DomainService.deleteDomain(id);
    await AuditService.log({ userId: adminId, action: 'admin_delete_domain', metadata: { domainId: id } });
    return result;
  }

  /**
   * Approves a new domain for public visibility.
   */
  static async approveDomain(domainId: string, adminId: string) {
    const [updated] = await db.update(domains)
      .set({ status: 'active' })
      .where(eq(domains.id, domainId))
      .returning();

    await AuditService.log({
      userId: adminId,
      action: 'admin_approve_domain',
      metadata: { domainId },
    });

    return updated;
  }

  /**
   * Fetches high-level platform metrics for admin dashboard.
   */
  static async getPlatformMetrics() {
    const [userCount] = await db.select({ count: sql`count(*)` }).from(sql`users`);
    const [examCount] = await db.select({ count: sql`count(*)` }).from(sql`exams`);
    const [questionCount] = await db.select({ count: sql`count(*)` }).from(questions);
    
    return {
      totalUsers: Number(userCount?.count || 0),
      totalExams: Number(examCount?.count || 0),
      totalQuestions: Number(questionCount?.count || 0),
      systemLoad: '0.8%',
      uptime: '99.99%',
    };
  }

  static async getDomains() {
    return await db.query.domains.findMany();
  }

  static async getSubjects() {
    return await db.query.subjects.findMany();
  }

  static async getTopics() {
    return await db.query.topics.findMany();
  }

  /**
   * Publishes a question.
   */
  static async publishQuestion(questionId: string, adminId: string) {
    const [updated] = await db.update(questions)
      .set({ status: 'active' })
      .where(eq(questions.id, questionId))
      .returning();

    await AuditService.log({
      userId: adminId,
      action: 'admin_publish_question',
      metadata: { questionId },
    });

    return updated;
  }

  /**
   * Validates a topic based on the 13-question distribution rule.
   */
  static async validateTopic(topicId: string) {
    return await QuestionService.validateTopicReadiness(topicId);
  }

  // --- SUBJECT MANAGEMENT ---
  static async createSubject(data: any, adminId: string) {
    const result = await SubjectService.createSubject(data);
    await AuditService.log({ userId: adminId, action: 'admin_create_subject', metadata: { subjectId: result[0].id } });
    return result[0];
  }

  static async updateSubject(id: string, data: any, adminId: string) {
    const result = await SubjectService.updateSubject(id, data);
    await AuditService.log({ userId: adminId, action: 'admin_update_subject', metadata: { subjectId: id } });
    return result[0];
  }

  static async deleteSubject(id: string, adminId: string) {
    const result = await SubjectService.deleteSubject(id);
    await AuditService.log({ userId: adminId, action: 'admin_delete_subject', metadata: { subjectId: id } });
    return result;
  }

  // --- TOPIC MANAGEMENT ---
  static async createTopic(data: any, adminId: string) {
    const result = await TopicService.createTopic(data);
    await AuditService.log({ userId: adminId, action: 'admin_create_topic', metadata: { topicId: result[0].id } });
    return result[0];
  }

  static async updateTopic(id: string, data: any, adminId: string) {
    const result = await TopicService.updateTopic(id, data);
    await AuditService.log({ userId: adminId, action: 'admin_update_topic', metadata: { topicId: id } });
    return result[0];
  }

  static async deleteTopic(id: string, adminId: string) {
    const result = await TopicService.deleteTopic(id);
    await AuditService.log({ userId: adminId, action: 'admin_delete_topic', metadata: { topicId: id } });
    return result;
  }

  // --- SUBTOPIC MANAGEMENT ---
  static async createSubtopic(data: any, adminId: string) {
    const result = await TopicService.createSubtopic(data);
    await AuditService.log({ userId: adminId, action: 'admin_create_subtopic', metadata: { subtopicId: result[0].id } });
    return result[0];
  }

  static async updateSubtopic(id: string, data: any, adminId: string) {
    const result = await TopicService.updateSubtopic(id, data);
    await AuditService.log({ userId: adminId, action: 'admin_update_subtopic', metadata: { subtopicId: id } });
    return result[0];
  }

  static async deleteSubtopic(id: string, adminId: string) {
    const result = await TopicService.deleteSubtopic(id);
    await AuditService.log({ userId: adminId, action: 'admin_delete_subtopic', metadata: { subtopicId: id } });
    return result;
  }

  // --- SKILL MANAGEMENT ---
  static async createSkill(data: any, adminId: string) {
    const result = await SkillService.createSkill(data);
    await AuditService.log({ userId: adminId, action: 'admin_create_skill', metadata: { skillId: result[0].id } });
    return result[0];
  }

  static async updateSkill(id: string, data: any, adminId: string) {
    const result = await db.update(skills).set(data).where(eq(skills.id, id)).returning();
    await AuditService.log({ userId: adminId, action: 'admin_update_skill', metadata: { skillId: id } });
    return result[0];
  }

  static async deleteSkill(id: string, adminId: string) {
    const result = await SkillService.deleteSkill(id);
    await AuditService.log({ userId: adminId, action: 'admin_delete_skill', metadata: { skillId: id } });
    return result;
  }

  static async mapTopicToSkills(topicId: string, skillIds: string[], adminId: string) {
    const result = await SkillService.mapTopicToSkills(topicId, skillIds);
    await AuditService.log({ userId: adminId, action: 'admin_map_topic_skills', metadata: { topicId, skillIds } });
    return result;
  }
}
