import { db, questions, domains, subjects, topics } from '@quiz/db';
import { eq, and, sql } from 'drizzle-orm';
import { AuditService } from '../auth/audit.service';

export class AdminEngine {
  /**
   * Publishes a question to the platform.
   */
  static async publishQuestion(questionId: string, adminId: string) {
    const [updated] = await db.update(questions)
      .set({ 
        updatedAt: new Date(),
        // Add a "published" status if we move to a more complex lifecycle
      })
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
   * Validates a topic or subject for readiness.
   */
  static async validateTopic(topicId: string) {
    const questionCount = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(questions)
      .where(eq(questions.topicId, topicId));

    const isReady = questionCount[0].count >= 10; // Rule: Must have 10 questions to be active
    return { topicId, isReady, currentQuestions: questionCount[0].count };
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
}
