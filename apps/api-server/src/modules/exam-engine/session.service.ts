import type { examBlueprints } from '@quiz/db';
import { db, exams } from '@quiz/db';
import { and, eq } from 'drizzle-orm';

import { logger } from '@/lib/logger';
import { cacheService } from '@/modules/core/cache.service';
import { container } from '@/modules/core/container';
import { ScoringEngine } from '@/modules/scoring-engine/scoring.engine';


export class SessionService {
  /**
   * Recovers a session or auto-submits if time has expired.
   */
  static async syncSession(examId: string, userId: string) {
    const cacheKey = `exam-header:${userId}:${examId}`;
    let exam: (Awaited<ReturnType<typeof db.query.exams.findFirst>> & { blueprint?: typeof examBlueprints.$inferSelect | null }) | null = null;

    try {
      exam = await cacheService.get(cacheKey) as typeof exam;
    } catch (e) {
      logger.warn({ err: e }, '[Session] Cache lookup failed');
    }

    if (exam === null || exam === undefined) {
      exam = await db.query.exams.findFirst({
        where: eq(exams.id, examId),
        with: {
          blueprint: true,
        },
      }) ?? null;

      if (exam) {
        try {
          await cacheService.set(cacheKey, exam, 1000 * 60 * 2); // 2 min TTL for active session meta
        } catch (e) {
          logger.warn({ err: e }, '[Session] Cache storage failed');
        }
      }
    }

    if (!exam) throw new Error('Session not found');
    
    // STRICT OWNERSHIP CHECK: Enforce even on cache hits
    if (exam.userId !== userId) {
      throw new Error('Unauthorized: You do not own this exam session');
    }

    if (exam.status === 'completed') return exam;

    const startTime = new Date(exam.startedAt).getTime();
    const timeElapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    
    // Task D: Prioritize durationSeconds
    const durationSeconds = (exam.durationSeconds !== null && exam.durationSeconds !== undefined) ? exam.durationSeconds : ((exam.blueprint?.timeLimit !== undefined && exam.blueprint?.timeLimit !== null) ? (exam.blueprint.timeLimit * 60) : 3600);

    if (timeElapsedSeconds > durationSeconds) {
      // Auto-submit: Mark as processing and trigger scoring (non-blocking)
      await db.update(exams)
        .set({ status: 'processing' as 'started' | 'processing' | 'completed' | 'abandoned' | 'failed' })
        .where(eq(exams.id, examId));

      container.get(ScoringEngine).calculateExamResults(examId).catch(_err => {
        logger.error({ err: _err, examId }, '[SessionService] Async auto-submit scoring failed');
      });

      // Return the updated status immediately
      return { ...exam, status: 'processing' };
    }

    return exam;
  }

  /**
   * Resumes a session from the last unanswered question.
   * Task A: Returns a sanitized "student-safe" _payload.
   */
  static async resumePayload(examId: string, userId: string) {
    const exam = await this.syncSession(examId, userId);
    
    // Fetch full state for internal calculations but sanitize before returning
    const fullExam = await db.query.exams.findFirst({
      where: and(eq(exams.id, examId), eq(exams.userId, userId)),
      with: {
        examQuestions: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          orderBy: (eqAny: any, helpers: any) => [helpers.asc(eqAny.order)],
          with: { question: true }
        }
      }
    });

    if (!fullExam) throw new Error('Exam state lost');

    // Calculate progress
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const answeredCount = fullExam.examQuestions.filter((q: any) => q.userAnswer !== null).length;
    
    // Find first unanswered question
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const firstUnanswered = fullExam.examQuestions.find((q: any) => q.userAnswer === null);
    const currentEq = firstUnanswered ?? (fullExam.examQuestions.length > 0 ? fullExam.examQuestions[fullExam.examQuestions.length - 1] : null);

    const startTime = new Date(fullExam.startedAt).getTime();
    const timeElapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    const durationSeconds = (fullExam.durationSeconds !== null && fullExam.durationSeconds !== undefined) ? fullExam.durationSeconds : ((exam.blueprint?.timeLimit !== undefined && exam.blueprint?.timeLimit !== null) ? (exam.blueprint.timeLimit * 60) : 3600);

    return {
      examId: fullExam.id,
      // Mapped legacy fields for ExamInterface.tsx compatibility
      id: fullExam.id,
      startedAt: fullExam.startedAt,
      status: fullExam.status,
      remainingTimeSeconds: Math.max(0, durationSeconds - timeElapsedSeconds),
      progress: {
        totalQuestions: fullExam.examQuestions.length,
        answeredCount,
      },
      // Full question list (sanitized)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      questions: fullExam.examQuestions.map((eq: any) => ({
        id: eq.question.id,
        questionId: eq.question.id, // Explicitly provide questionId for ExamInterface mapping
        text: eq.question.questionText, 
        questionText: eq.question.questionText,
        options: eq.question.options,
        codeSnippet: eq.question.codeSnippet,
        type: eq.question.type,
        difficulty: eq.question.difficulty,
        userAnswer: eq.userAnswer,
        order: eq.order
      })),
      currentQuestion: (currentEq !== undefined && currentEq !== null) ? {
        id: currentEq.question.id,
        questionText: currentEq.question.questionText,
        options: currentEq.question.options,
        codeSnippet: currentEq.question.codeSnippet,
        type: currentEq.question.type,
        difficulty: currentEq.question.difficulty,
        topicId: currentEq.question.topicId,
        subtopicId: currentEq.question.subtopicId,
        order: currentEq.order
      } : null
    };
  }
}
