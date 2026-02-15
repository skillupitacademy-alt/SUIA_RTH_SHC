import { db, exams } from '@quiz/db';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';

import { SelectionService } from '../selection-engine/selection.service';

/**
 * QuizEngine handles self-paced, flexible quiz flows.
 * It's lighter than ExamEngine and doesn't require pre-defined blueprints.
 */
export class QuizEngine {
  static async startQuiz(userId: string, options: { 
    topicId?: string; 
    domainId?: string;
    count?: number; 
    difficulty?: 'simple' | 'intermediate' | 'expert' 
  }) {
    // Generate a stable idempotency key for the quiz session
    const syncId = crypto.randomUUID();
    
    // 1. Leverage SelectionService to pick questions
    const examData = await SelectionService.composeExam(
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
        questions: exam.examQuestions.map(eq => ({
            id: eq.question.id,
            text: eq.question.questionText,
            options: eq.question.options,
            type: eq.question.type,
            userAnswer: (eq.userAnswer !== null && eq.userAnswer !== undefined) ? eq.userAnswer : null,
            isCorrect: eq.isCorrect,
            metadata: eq.responseMetadata
        }))
    };
  }
}
