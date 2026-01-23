import { db, questions } from '@quiz/db';
import { eq, and, inArray, sql } from 'drizzle-orm';

export class QuestionService {
  static async createQuestion(data: any) {
    return await db.insert(questions).values(data).returning();
  }

  static async getQuestionsByTopic(topicId: string) {
    return await db.query.questions.findMany({
      where: eq(questions.topicId, topicId),
    });
  }

  static async getQuestionCountByDifficulty(topicIds: string[]) {
    return await db
      .select({
        topicId: questions.topicId,
        difficulty: questions.difficulty,
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(questions)
      .where(inArray(questions.topicId, topicIds))
      .groupBy(questions.topicId, questions.difficulty);
  }
}
