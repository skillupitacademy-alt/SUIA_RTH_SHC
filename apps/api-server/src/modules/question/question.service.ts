import { db, questions, questionSkills } from '@quiz/db';
import { desc,eq, inArray, sql } from 'drizzle-orm';

export class QuestionService {
  static async getAllQuestions() {
    return await db.query.questions.findMany({
      orderBy: [desc(questions.createdAt)],
    });
  }

  static async createQuestion(data: {
    topicId: string;
    subtopicId?: string;
    difficulty: "simple" | "intermediate" | "expert";
    type: "mcq" | "code_mcq";
    questionText: string;
    options: unknown;
    correctAnswer: string;
    explanation?: string;
    codeSnippet?: string;
    metadata?: unknown;
    status?: "active" | "inactive" | "draft";
  }, skillIds: string[] = []) {
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

  static async bulkCreateQuestions(questionsList: {
    topicId: string;
    subtopicId?: string;
    difficulty: "simple" | "intermediate" | "expert";
    type: "mcq" | "code_mcq";
    questionText: string;
    options: unknown;
    correctAnswer: string;
    explanation?: string;
    codeSnippet?: string;
    metadata?: unknown;
    status?: "active" | "inactive" | "draft";
  }[], mappings: { questionIndex: number, skillIds: string[] }[]) {
    // 1. Insert All Questions
    const insertedQuestions = await db.insert(questions).values(questionsList).returning();
    
    // 2. Map inserted IDs back to skills based on index order
    const skillInserts: { questionId: string; skillId: string }[] = [];
    
    mappings.forEach(m => {
        const questionId = insertedQuestions[m.questionIndex]?.id;
        if (questionId !== undefined && m.skillIds.length > 0) {
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

    const simpleCount = (counts.find(c => c.difficulty === 'simple')?.count !== undefined) ? counts.find(c => c.difficulty === 'simple')!.count : 0;
    const intermediateCount = (counts.find(c => c.difficulty === 'intermediate')?.count !== undefined) ? counts.find(c => c.difficulty === 'intermediate')!.count : 0;
    const expertCount = (counts.find(c => c.difficulty === 'expert')?.count !== undefined) ? counts.find(c => c.difficulty === 'expert')!.count : 0;

    const total = simpleCount + intermediateCount + expertCount;
    const isReady = total >= 13 && simpleCount >= 4 && intermediateCount >= 4 && expertCount >= 5;

    return {
      topicId,
      total,
      distribution: { simple: simpleCount, intermediate: intermediateCount, expert: expertCount },
      isReady,
      missing: {
        simple: Math.max(0, 4 - simpleCount),
        intermediate: Math.max(0, 4 - intermediateCount),
        expert: Math.max(0, 5 - expertCount),
        total: Math.max(0, 13 - total)
      }
    };
  }

  static async updateQuestion(id: string, data: Partial<{
    topicId: string;
    subtopicId?: string;
    difficulty: "simple" | "intermediate" | "expert";
    type: "mcq" | "code_mcq";
    questionText: string;
    options: unknown;
    correctAnswer: string;
    explanation?: string;
    codeSnippet?: string;
    metadata?: unknown;
    status?: "active" | "inactive" | "draft";
  }>, skillIds?: string[]) {
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
