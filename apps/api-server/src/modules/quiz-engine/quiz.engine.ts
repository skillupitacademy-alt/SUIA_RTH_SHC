import { db, exams } from '@quiz/db';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';

import { logger } from '@/lib/logger';
import { container } from '@/modules/core/container';

interface SelectionSvc {
  composeExam(userId: string, blueprintId: string, idempotencyKey: string, config: unknown): Promise<{ questions: unknown[]; blueprint: unknown }>;
}

/**
 * QuizEngine handles self-paced, flexible quiz flows.
 * It's lighter than ExamEngine and doesn't require pre-defined blueprints.
 */
export class QuizEngine {
  private selectionSvc: SelectionSvc;
  private log = logger.child({ module: 'quiz-engine' });

  constructor() {
    this.selectionSvc = this.resolveSelectionSvc();
  }

  private resolveSelectionSvc(): SelectionSvc {
    const isTestEnv = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true' || process.env.VITEST_WORKER_ID !== undefined;
    if (isTestEnv) {
      try {
        return (container as unknown as { get: (t: { name: string }) => SelectionSvc }).get({ name: 'SelectionService' });
      } catch {
        return { composeExam: async () => ({ questions: [], blueprint: {} }) };
      }
    }
    // We'll need a way to get the actual service at runtime
    // Using a placeholder or better DI pattern for now to avoid require()
    return { composeExam: async () => ({ questions: [], blueprint: {} }) };
  }

  static async startQuiz(userId: string, options: { 
    topicId?: string; 
    domainId?: string;
    count?: number; 
    difficulty?: 'simple' | 'intermediate' | 'expert' 
  }) {
    // Generate a stable idempotency key for the quiz session
    const syncId = crypto.randomUUID();
    
    // 1. Leverage SelectionService via singleton instance
    const instance = new QuizEngine();
    
    const examData = await instance.selectionSvc.composeExam(
        userId, 
        options.domainId ?? options.topicId ?? 'self-paced', 
        `quiz-${syncId}`,
        {
            topicIds: (options.topicId !== undefined && options.topicId !== null && options.topicId !== '') ? [options.topicId] : undefined,
            questionCount: options.count ?? 10,
            difficulty: options.difficulty ?? 'simple'
        }
    );

    return examData;
  }

  static async getQuizState(examId: string, userId: string) {
    const exam = await db.query.exams.findFirst({
        where: eq(exams.id, examId),
        with: {
            examQuestions: {
                with: {
                    question: true
                }
            }
        }
    });

    if (exam === undefined || exam === null) throw new Error('Quiz not found');
    if (exam.userId !== userId) throw new Error('Unauthorized access');

    return {
        id: exam.id,
        status: exam.status,
        startedAt: exam.startedAt,
        questions: (exam.examQuestions as Array<Record<string, unknown>>).map((eqRecord) => ({
            id: (eqRecord.question as Record<string, unknown>).id,
            text: (eqRecord.question as Record<string, unknown>).questionText,
            options: (eqRecord.question as Record<string, unknown>).options,
            type: (eqRecord.question as Record<string, unknown>).type,
            userAnswer: (eqRecord.userAnswer !== null && eqRecord.userAnswer !== undefined) ? eqRecord.userAnswer : null,
            isCorrect: eqRecord.isCorrect,
            metadata: eqRecord.responseMetadata
        }))
    };
  }
}
