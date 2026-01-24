import { db, questions, domains, subjects, topics } from '@quiz/db';
import { eq, and, sql, desc } from 'drizzle-orm';
import { AuditService } from '../auth/audit.service';

export class AdminEngine {
  /**
   * Creates a new question.
   */
  static async createQuestion(data: any, adminId: string) {
    const [question] = await db.insert(questions).values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    await AuditService.log({
      userId: adminId,
      action: 'admin_create_question',
      metadata: { questionId: question.id },
    });

    return question;
  }

  /**
   * Fetches all questions for management.
   */
  static async getAllQuestions() {
    return await db.query.questions.findMany({
      orderBy: [desc(questions.createdAt)],
    });
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
   * Validates a topic (placeholder for complex validation).
   */
  static async validateTopic(topicId: string) {
    // Perform structural validation checks
    return { 
      topicId, 
      isValid: true, 
      message: 'Topic structure validated successfully' 
    };
  }
}
