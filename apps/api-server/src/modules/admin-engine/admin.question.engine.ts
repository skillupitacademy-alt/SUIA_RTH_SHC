import { db } from '@quiz/db';
import { JobType } from '@quiz/types';

import { conflict } from "@/lib/api-error";
import { AuditService } from "@/modules/auth/audit.service";
import { container } from "@/modules/core/container";
import { DrizzleQuestionRepository } from "@/repositories/implementations/drizzle-question.repository";
import { IQuestionRepository } from "@/repositories/interfaces/question.repository.interface";

import { queueService } from '../core/queue.service';
import { DuplicateDetector } from '../question/duplicate-detector';
import { type BackendQuestionType, normalizeQuestionOptions, normalizeQuestionType } from '../question/question-contract';
import { computeCodeHash, computeQuestionHash, normalizeConceptKey, normalizeObjectiveKey } from '../question/question-hash';



export interface QuestionOption {
  id: string;
  text?: string;
  code?: string;
  label?: string;
  isCorrect?: boolean;
}

export interface CreateQuestionInput {
  topicId: string;
  subtopicId?: string;
  skillId?: string;
  skillIds?: string[];
  difficulty?: 'simple' | 'intermediate' | 'expert';
  type?: BackendQuestionType;
  mappingType?: 'conceptual' | 'technical' | 'practical';
  questionText: string;
  options: (string | Partial<QuestionOption>)[];
  correctAnswer?: string;
  explanation?: string;
  codeSnippet?: string | null;
  conceptKey?: string;
  objectiveKey?: string;
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

  withDb(dbClient: typeof db): AdminQuestionEngine {
    return new AdminQuestionEngine(this.repository.withDb(dbClient), this.auditService);
  }

  async getQuestions(cursor: string | null = null, limit: number = 20, filters?: { 
    domainId?: string; 
    subjectId?: string; 
    topicId?: string; 
    subtopicId?: string; 
    skillIds?: string[]; 
    status?: string; 
    search?: string;
    fields?: string;
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
    // Layered duplicate enforcement (exact hash → code → concept → vector → judge).
    const verdict = await DuplicateDetector.evaluate(
      {
        questionText: data.questionText,
        codeSnippet: data.codeSnippet,
        conceptKey: (data as CreateQuestionInput & { conceptKey?: string }).conceptKey,
        objectiveKey: data.objectiveKey,
        type: normalizeQuestionType(data.type),
        correctAnswer: data.correctAnswer,
      },
      data.topicId
    );

    if (verdict.status === 'duplicate') {
      throw conflict(
        `A question with this meaning already exists (${verdict.reason}). Please review existing content.`,
        'CONFLICT',
        {
          status: verdict.status,
          level: verdict.level,
          reason: verdict.reason,
          similarity: verdict.similarity,
          matchedQuestionId: verdict.signals.matchedQuestionId ?? null,
        }
      );
    }
    if (verdict.status === 'review') {
      throw conflict(
        `Question flagged for review (${verdict.reason}). Resolve in the Review Console before saving.`,
        'CONFLICT',
        {
          status: verdict.status,
          level: verdict.level,
          reason: verdict.reason,
          similarity: verdict.similarity,
          matchedQuestionId: verdict.signals.matchedQuestionId ?? null,
        }
      );
    }

    const conceptKey = (data as CreateQuestionInput & { conceptKey?: string }).conceptKey ?? null;
    const objectiveKey = data.objectiveKey ?? null;
    const codeSnippet = data.codeSnippet ?? null;

    const { db } = await import('@quiz/db');
    return await db.transaction(async (tx) => {
        const questionData = {
            topicId: data.topicId,
            subtopicId: data.subtopicId,
            difficulty: (data.difficulty ?? "intermediate") as "simple" | "intermediate" | "expert",
            questionText: data.questionText,
            options: normalizeQuestionOptions(data.options),
            correctAnswer: data.correctAnswer ?? "No correct answer provided",
            type: normalizeQuestionType(data.type),
            explanation: data.explanation,
            codeSnippet,
            // Duplicate-detection layer (see packages/db/migrations/0027)
            questionHash: computeQuestionHash(data.questionText),
            codeHash: computeCodeHash(codeSnippet),
            conceptKey: conceptKey !== null && conceptKey.trim() !== '' ? normalizeConceptKey(conceptKey) : null,
            objectiveKey: objectiveKey !== null && objectiveKey.trim() !== '' ? normalizeObjectiveKey(objectiveKey) : null,
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
                difficulty: newQuestion.difficulty,
                type: questionData.type,
                codeSnippet,
                correctAnswer: questionData.correctAnswer,
                conceptKey: questionData.conceptKey,
                objectiveKey: questionData.objectiveKey,
            }
        });

        return newQuestion;
    });
  }

  async updateQuestion(id: string, data: Partial<CreateQuestionInput>, adminId: string) {
      await this.auditService.log({ userId: adminId, action: 'admin_update_question', metadata: { questionId: id } });
      const { db } = await import('@quiz/db');
    return await db.transaction(async (tx) => {
        const nextCodeSnippet = data.codeSnippet === undefined ? undefined : (data.codeSnippet ?? null);
        const questionData = {
            topicId: data.topicId,
            subtopicId: data.subtopicId,
            difficulty: data.difficulty as "simple" | "intermediate" | "expert" | undefined,
            questionText: data.questionText,
            options: data.options !== undefined ? normalizeQuestionOptions(data.options) : undefined,
            correctAnswer: data.correctAnswer,
            type: data.type !== undefined ? normalizeQuestionType(data.type) : undefined,
            explanation: data.explanation,
            codeSnippet: data.codeSnippet,
            questionHash: data.questionText !== undefined ? computeQuestionHash(data.questionText) : undefined,
            codeHash: nextCodeSnippet !== undefined ? computeCodeHash(nextCodeSnippet) : undefined,
            conceptKey: data.conceptKey !== undefined && data.conceptKey.trim() !== '' ? normalizeConceptKey(data.conceptKey) : undefined,
            objectiveKey: data.objectiveKey !== undefined && data.objectiveKey.trim() !== '' ? normalizeObjectiveKey(data.objectiveKey) : undefined,
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
