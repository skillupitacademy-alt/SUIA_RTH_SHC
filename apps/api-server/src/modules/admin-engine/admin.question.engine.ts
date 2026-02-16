import { db, questions, questionSkills } from '@quiz/db';
import { and, desc, eq, inArray,sql } from 'drizzle-orm';

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface CreateQuestionInput {
  topicId: string;
  subtopicId?: string;
  skillId?: string;
  skillIds?: string[];
  difficulty?: 'simple' | 'intermediate' | 'expert';
  type?: string;
  mappingType?: 'conceptual' | 'technical' | 'practical';
  questionText: string;
  options: (string | Partial<QuestionOption>)[];
  correctAnswer?: string;
  explanation?: string;
  codeSnippet?: string | null;
  estimatedTime?: number;
  tags?: string[];
  skillWeight?: number;
  status?: 'active' | 'inactive' | 'draft';
}

export class AdminQuestionEngine {
  static async getQuestions(page: number = 1, limit: number = 20, filters?: { 
    domainId?: string; 
    subjectId?: string; 
    topicId?: string; 
    subtopicId?: string; 
    skillIds?: string[]; 
    status?: string; 
    search?: string 
  }) {
    const offset = (page - 1) * limit;
    const conditions = [];

    if (filters?.subtopicId !== undefined && filters?.subtopicId !== null && filters?.subtopicId !== '') {
        conditions.push(eq(questions.subtopicId, filters.subtopicId));
    } else if (filters?.topicId !== undefined && filters?.topicId !== null && filters?.topicId !== '') {
        conditions.push(eq(questions.topicId, filters.topicId));
    }

    if (filters?.status !== undefined && filters?.status !== null && filters?.status !== '') {
        conditions.push(eq(questions.status, filters.status as "active" | "inactive" | "draft"));
    }

    if (filters?.search !== undefined && filters?.search !== null && filters?.search.trim() !== '') {
        conditions.push(sql`${questions.questionText} ILIKE ${'%' + filters.search + '%'}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const res = await db.query.questions.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: [desc(questions.updatedAt)]
    });

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(questions)
      .where(whereClause ?? sql`true`);

    const total = Number(count ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return { 
      questions: res, 
      total, 
      page, 
      limit, 
      totalPages 
    };
  }

  static async createQuestion(data: CreateQuestionInput) {
    return await db.transaction(async (tx) => {
        const [newQuestion] = await tx.insert(questions).values({
            topicId: data.topicId,
            subtopicId: data.subtopicId,
            difficulty: (data.difficulty ?? "intermediate") as "simple" | "intermediate" | "expert",
            questionText: data.questionText,
            options: data.options,
            correctAnswer: data.correctAnswer ?? "No correct answer provided",
            type: (data.type ?? "mcq") as "mcq" | "code_mcq",
            explanation: data.explanation,
            codeSnippet: data.codeSnippet,
            status: (data.status ?? "active") as "active" | "inactive" | "draft"
        }).returning();

        if (data.skillIds && data.skillIds.length > 0) {
            await tx.insert(questionSkills).values(data.skillIds.map(sid => ({
                questionId: newQuestion.id,
                skillId: sid
            })));
        }

        return newQuestion;
    });
  }

  static async updateQuestion(id: string, data: Partial<CreateQuestionInput>) {
    return await db.transaction(async (tx) => {
        const [updated] = await tx.update(questions).set({
            topicId: data.topicId,
            subtopicId: data.subtopicId,
            difficulty: data.difficulty as "simple" | "intermediate" | "expert" | undefined,
            questionText: data.questionText,
            options: data.options,
            correctAnswer: data.correctAnswer,
            type: data.type as "mcq" | "code_mcq" | undefined,
            explanation: data.explanation,
            codeSnippet: data.codeSnippet,
            status: data.status as "active" | "inactive" | "draft" | undefined
        }).where(eq(questions.id, id)).returning();

        if (data.skillIds) {
            await tx.delete(questionSkills).where(eq(questionSkills.questionId, id));
            if (data.skillIds.length > 0) {
                await tx.insert(questionSkills).values(data.skillIds.map(sid => ({
                    questionId: id,
                    skillId: sid
                })));
            }
        }

        return updated;
    });
  }

  static async deleteQuestion(id: string) {
    return await db.update(questions).set({ status: 'inactive' }).where(eq(questions.id, id)).returning();
  }

  static async deleteQuestionsBatch(ids: string[]) {
    return await db.update(questions).set({ status: 'inactive' }).where(inArray(questions.id, ids)).returning();
  }

  static async publishQuestion(questionId: string) {
    return await db.update(questions).set({ status: 'active' }).where(eq(questions.id, questionId)).returning();
  }

  static async bulkCreateQuestionsWithContext(questions: CreateQuestionInput[], context?: Record<string, unknown>, _adminId?: string) {
    // Placeholder for bulk create with context
    const results = [];
    for (const q of questions) {
        results.push(await this.createQuestion({ ...q, ...context }));
    }
    return results;
  }
}
