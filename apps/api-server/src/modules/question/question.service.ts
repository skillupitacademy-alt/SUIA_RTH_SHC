import { db, questions, questionSkills } from '@quiz/db';
import { eq, and, inArray, sql, desc } from 'drizzle-orm';

export class QuestionService {
  static async getAllQuestions() {
    return await db.query.questions.findMany({
      orderBy: [desc(questions.createdAt)],
    });
  }

  static async createQuestion(data: any, skillIds: string[] = []) {
    // 1. Insert Question
    const [insertedQuestion] = await db.insert(questions).values(data).returning();

    // 2. Insert Skills (if any)
    if (skillIds.length > 0) {
      await db.insert(questionSkills).values(
        skillIds.map(skillId => ({
          questionId: insertedQuestion.id,
          skillId
        }))
      );
    }

    return [insertedQuestion];
  }

  static async getQuestionsByTopic(topicId: string) {
    return await db.query.questions.findMany({
      where: eq(questions.topicId, topicId),
    });
  }

  static async bulkCreateQuestions(questionsList: any[], mappings: { questionIndex: number, skillIds: string[] }[]) {
    // 1. Insert All Questions
    const insertedQuestions = await db.insert(questions).values(questionsList).returning();
    
    // 2. Map inserted IDs back to skills based on index order
    const skillInserts: any[] = [];
    
    mappings.forEach(m => {
        const questionId = insertedQuestions[m.questionIndex]?.id;
        if (questionId && m.skillIds.length > 0) {
            m.skillIds.forEach(skillId => {
                skillInserts.push({ questionId, skillId });
            });
        }
    });

    if (skillInserts.length > 0) {
        await db.insert(questionSkills).values(skillInserts);
    }

    return insertedQuestions;
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

  static async updateQuestion(id: string, data: any, skillIds?: string[]) {
    // 1. Update Question
    const [updatedQuestion] = await db.update(questions)
      .set(data)
      .where(eq(questions.id, id))
      .returning();

    // 2. Sync Skills if provided
    if (skillIds !== undefined) {
      // Delete existing associations
      await db.delete(questionSkills).where(eq(questionSkills.questionId, id));

      // Insert new ones
      if (skillIds.length > 0) {
        await db.insert(questionSkills).values(
          skillIds.map(skillId => ({
            questionId: id,
            skillId
          }))
        );
      }
    }

    return [updatedQuestion];
  }

  static async deleteQuestion(id: string) {
    return await db.delete(questions).where(eq(questions.id, id)).returning();
  }

  static async deleteQuestionsBatch(ids: string[]) {
    return await db.delete(questions).where(inArray(questions.id, ids)).returning();
  }
}
