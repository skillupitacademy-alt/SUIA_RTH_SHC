import { JobType } from '@quiz/types';

import { AuditService } from "@/modules/auth/audit.service";
import { container } from "@/modules/core/container";
import { DrizzleQuestionRepository } from "@/repositories/implementations/drizzle-question.repository";
import { IQuestionRepository } from "@/repositories/interfaces/question.repository.interface";

import { queueService } from '../core/queue.service';
import { SemanticSearchService } from '../intelligence/semantic-search.service';

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
  constructor(
    private readonly repository: IQuestionRepository = container.get(DrizzleQuestionRepository),
    private readonly auditService = container.get(AuditService)
  ) {}

  async getQuestions(cursor: string | null = null, limit: number = 20, filters?: { 
    domainId?: string; 
    subjectId?: string; 
    topicId?: string; 
    subtopicId?: string; 
    skillIds?: string[]; 
    status?: string; 
    search?: string 
  }) {
    const result = await this.repository.findAll(cursor, limit, filters);
    return {
        questions: result.data,
        total: result.total,
        nextCursor: result.nextCursor,
        limit: result.limit
    };
  }

  async createQuestion(data: CreateQuestionInput, adminId: string) {
    const isDuplicate = await SemanticSearchService.isDuplicate(data.questionText);
    if (isDuplicate) {
        throw new Error('CONCEPTUAL_DUPLICATE: A question with this meaning already exists. Please review existing content.');
    }

    const { db } = await import('@quiz/db');
    return await db.transaction(async (tx) => {
        const questionData = {
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
        };

        const newQuestion = await this.repository.create(questionData, data.skillIds, tx);

        await this.auditService.log({
          userId: adminId,
          action: 'admin_create_question',
          metadata: { questionId: newQuestion.id }
        });

        void queueService.enqueue(JobType.SEMANTIC_INDEXING, {
            questionId: newQuestion.id,
            text: newQuestion.questionText,
            metadata: {
                topicId: newQuestion.topicId,
                difficulty: newQuestion.difficulty
            }
        });

        return newQuestion;
    });
  }

  async updateQuestion(id: string, data: Partial<CreateQuestionInput>, adminId: string) {
      await this.auditService.log({ userId: adminId, action: 'admin_update_question', metadata: { questionId: id } });
      const { db } = await import('@quiz/db');
    return await db.transaction(async (tx) => {
        const questionData = {
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
        };

        return await this.repository.update(id, questionData, data.skillIds, tx);
    });
  }

  async deleteQuestion(id: string, adminId: string) {
      await this.auditService.log({ userId: adminId, action: 'admin_delete_question', metadata: { questionId: id } });
    return await this.repository.delete(id);
  }

  async deleteQuestionsBatch(ids: string[], adminId: string) {
      await this.auditService.log({ userId: adminId, action: 'admin_batch_delete_questions', metadata: { count: ids.length } });
    return await this.repository.deleteBatch(ids);
  }

  async publishQuestion(questionId: string, adminId: string) {
      await this.auditService.log({ userId: adminId, action: 'admin_publish_question', metadata: { questionId } });
    return await this.repository.updateStatus(questionId, 'active');
  }

  async bulkCreateQuestionsWithContext(questions: CreateQuestionInput[], context?: Record<string, unknown>, _adminId?: string, adminId?: string) {
    const results = [];
    const actor = adminId ?? _adminId ?? 'system';
    for (const q of questions) {
        results.push(await this.createQuestion({ ...q, ...context }, actor));
    }
    await this.auditService.log({
      userId: actor,
      action: 'admin_bulk_create_questions',
      metadata: { count: results.length }
    });
    return results;
  }
}
