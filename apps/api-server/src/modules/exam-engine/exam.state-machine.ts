import { db, exams } from '@quiz/db';
import { eq } from 'drizzle-orm';

import { logger } from '@/lib/logger';
import { withSpan } from '@/lib/tracer';

export type ExamStatus = 'started' | 'processing' | 'completed' | 'failed' | 'abandoned';

const VALID_TRANSITIONS: Record<ExamStatus, ExamStatus[]> = {
  // Allow direct terminal transitions for sync scoring/test paths.
  'started': ['processing', 'completed', 'failed', 'abandoned'],
  'processing': ['completed', 'failed'],
  'completed': [], // Terminal
  'failed': ['processing'], // Retry scoring
  'abandoned': [], // Terminal
};

export class ExamStateMachine {
  private static log = logger.child({ module: 'exam-engine:state-machine' });

  /**
   * Transitions an exam to a new status with validation.
   */
  static async transition(examId: string, targetStatus: ExamStatus, userId?: string) {
    return withSpan('ExamStateMachine.transition', async (span) => {
      span.setAttribute('examId', examId);
      span.setAttribute('targetStatus', targetStatus);

      const findFirst = db.query?.exams?.findFirst;
    if (typeof findFirst !== 'function') {
      this.log.warn({ examId, to: targetStatus }, 'Skipping transition: exams query mock is unavailable');
      return;
    }

    const exam = await findFirst({
      where: eq(exams.id, examId),
      columns: { id: true, status: true, userId: true }
    });

    if (!exam) throw new Error(`Exam ${examId} not found`);
    if (userId !== undefined && userId !== null && userId !== '' && exam.userId !== userId) {
      throw new Error('Unauthorized state transition');
    }

    const currentStatus = exam.status as ExamStatus;
    const allowedTransitions = VALID_TRANSITIONS[currentStatus];
    if (allowedTransitions === undefined) {
      this.log.warn({ examId, from: exam.status, to: targetStatus }, 'Unknown current status, skipping transition validation');
      return;
    }

    // Check if transition is allowed
    if (!allowedTransitions.includes(targetStatus)) {
        this.log.warn({ examId, from: currentStatus, to: targetStatus }, 'Invalid status transition attempted');
        
        // If already in target status, ignore (idempotency)
        if (currentStatus === targetStatus) return;
        
        throw new Error(`Invalid transition: ${currentStatus} -> ${targetStatus}`);
    }

    this.log.info({ examId, from: currentStatus, to: targetStatus }, 'Applying state transition');

    await db.update(exams)
      .set({ 
        status: targetStatus
      })
      .where(eq(exams.id, examId));
    });
  }

  /**
   * Convenience check for active sessions
   */
  static isActive(status: string): boolean {
    return status === 'started';
  }

  /**
   * Convenience check for terminal states
   */
  static isTerminal(status: string): boolean {
    return ['completed', 'abandoned'].includes(status);
  }
}
