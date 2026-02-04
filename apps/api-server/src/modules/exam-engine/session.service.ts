import { db, exams, examQuestions } from '@quiz/db';
import { eq, and, sql, lt } from 'drizzle-orm';
import { cacheService } from '../core/cache.service';
import { ScoringEngine } from '../scoring-engine/scoring.engine';


export class SessionService {
  /**
   * Recovers a session or auto-submits if time has expired.
   */
  static async syncSession(examId: string, userId: string) {
    const cacheKey = `exam-header:${userId}:${examId}`;
    let exam: any = null;

    try {
      exam = await cacheService.get(cacheKey);
    } catch (e) {
      console.warn('[Session] Cache lookup failed', e);
    }

    if (!exam) {
      exam = await db.query.exams.findFirst({
        where: eq(exams.id, examId),
        with: {
          blueprint: true,
        },
      });

      if (exam) {
        try {
          await cacheService.set(cacheKey, exam, 1000 * 60 * 2); // 2 min TTL for active session meta
        } catch (e) {
          console.warn('[Session] Cache storage failed', e);
        }
      }
    }

    if (!exam) throw new Error('Session not found');
    
    // STRICT OWNERSHIP CHECK: Enforce even on cache hits
    if (exam.userId !== userId) {
      throw new Error('Unauthorized: You do not own this exam session');
    }

    if (exam.status === 'completed') return exam;

    const timeElapsed = (Date.now() - new Date(exam.startedAt).getTime()) / 60000;
    const timeLimit = exam.blueprint?.timeLimit || 60; // Default 60 mins

    if (timeElapsed > timeLimit) {
      // Auto-submit
      await ScoringEngine.calculateExamResults(examId);
      return await db.query.exams.findFirst({ where: eq(exams.id, examId) });
    }

    return exam;
  }

  /**
   * Resumes a session from the last unanswered question.
   */
  static async resumePayload(examId: string, userId: string) {
    await this.syncSession(examId, userId);
    
    const exam = await db.query.exams.findFirst({
      where: and(eq(exams.id, examId), eq(exams.userId, userId)),
      with: {
        examQuestions: {
          orderBy: (eq, { asc }) => [asc(eq.order)],
          with: { question: true }
        }
      }
    });

    return exam;
  }
}
