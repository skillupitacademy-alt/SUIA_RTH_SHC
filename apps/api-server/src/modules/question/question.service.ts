import { db, questions } from '@quiz/db';
import { eq, and, inArray, sql, desc } from 'drizzle-orm';

export class QuestionService {
  static async getAllQuestions() {
    return await db.query.questions.findMany({
      orderBy: [desc(questions.createdAt)],
    });
  }
  static async createQuestion(data: any) {
    return await db.insert(questions).values(data).returning();
  }

  static async getQuestionsByTopic(topicId: string) {
    return await db.query.questions.findMany({
      where: eq(questions.topicId, topicId),
    });
  }

  static async bulkCreateQuestions(data: any[]) {
    return await db.insert(questions).values(data).returning();
  }

  static async validateTopicReadiness(topicId: string) {
    const counts = await db
      .select({
        difficulty: questions.difficulty,
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(questions)
      .where(eq(questions.topicId, topicId))
      .groupBy(questions.difficulty);

    const simple = counts.find(c => c.difficulty === 'simple')?.count || 0;
    const intermediate = counts.find(c => c.difficulty === 'intermediate')?.count || 0;
    const expert = counts.find(c => c.difficulty === 'expert')?.count || 0;

    const total = simple + intermediate + expert;
    const isReady = total >= 13 && simple >= 4 && intermediate >= 4 && expert >= 5;

    return {
      topicId,
      total,
      distribution: { simple, intermediate, expert },
      isReady,
      missing: {
        simple: Math.max(0, 4 - simple),
        intermediate: Math.max(0, 4 - intermediate),
        expert: Math.max(0, 5 - expert),
        total: Math.max(0, 13 - total)
      }
    };
  }

  static async updateQuestion(id: string, data: any) {
    return await db.update(questions).set(data).where(eq(questions.id, id)).returning();
  }

  static async deleteQuestion(id: string) {
    return await db.delete(questions).where(eq(questions.id, id)).returning();
  }
}
