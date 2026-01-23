import { db, exams, examQuestions } from '@quiz/db';
import { eq, and, sql, lt } from 'drizzle-orm';
import { ScoringEngine } from '../scoring-engine/scoring.engine';

export class SessionService {
  /**
   * Recovers a session or auto-submits if time has expired.
   */
  static async syncSession(examId: string) {
    const exam = await db.query.exams.findFirst({
      where: eq(exams.id, examId),
      with: {
        blueprint: true,
      },
    });

    if (!exam) throw new Error('Session not found');
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
  static async resumePayload(examId: string) {
    await this.syncSession(examId);
    
    return await db.query.exams.findFirst({
      where: eq(exams.id, examId),
      with: {
        examQuestions: {
          orderBy: (eq, { asc }) => [asc(eq.order)],
          with: { question: true }
        }
      }
    });
  }
}
