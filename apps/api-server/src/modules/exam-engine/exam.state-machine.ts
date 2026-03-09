/**
 * Formal Exam State Machine
 * Centralises all lifecycle transitions for exam sessions.
 * No other code should directly mutate exam.status — use this machine.
 */

import { db, exams } from '@quiz/db';
import { eq } from 'drizzle-orm';

export type ExamStatus =
  | 'pending'
  | 'started'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'abandoned'
  | 'expired';

/** All legal state transitions: from → allowed targets */
const TRANSITIONS: Record<ExamStatus, ExamStatus[]> = {
  pending:     ['started', 'failed'],
  started:     ['processing', 'failed', 'abandoned', 'expired'],
  processing:  ['completed', 'failed'],
  completed:   [],           // terminal
  failed:      [],           // terminal
  abandoned:   [],           // terminal
  expired:     [],           // terminal
};

export class ExamStateMachine {
  private status: ExamStatus;

  constructor(currentStatus: ExamStatus) {
    this.status = currentStatus;
  }

  /** Returns the current exam status */
  getStatus(): ExamStatus {
    return this.status;
  }

  /** Returns true if transitioning from current status to `next` is legal */
  canTransition(next: ExamStatus): boolean {
    return TRANSITIONS[this.status].includes(next);
  }

  /**
   * Internal pure transition check.
   * Throws ExamTransitionError if the transition is illegal.
   */
  assertTransition(next: ExamStatus): void {
    if (!this.canTransition(next)) {
      throw new ExamTransitionError(
        `Invalid exam transition: ${this.status} → ${next}`
      );
    }
  }

  /**
   * Convenience: is the exam in a terminal (non-modifiable) state?
   */
  isTerminal(): boolean {
    return TRANSITIONS[this.status].length === 0;
  }

  /** Static factory — creates machine from a raw status string (e.g. from DB) */
  static from(rawStatus: string): ExamStateMachine {
    return new ExamStateMachine(rawStatus as ExamStatus);
  }

  /**
   * Performs a transition in the database.
   * Validates the transition before saving.
   *
   * @param examId The exam ID
   * @param nextStatus The target status
   * @param updatedBy Optional userId triggering the transition (for audit)
   * @param tx Optional transaction block to run the update within
   */
  static async transition(
    examId: string,
    nextStatus: ExamStatus,
    updatedBy?: string,
    tx?: Pick<typeof db, 'query' | 'update'>
  ): Promise<ExamStatus> {
    const client = tx ?? db;
    
    // Fetch current state
    const exam = await client.query.exams.findFirst({
        where: eq(exams.id, examId),
        columns: { status: true }
    }) as { status: ExamStatus } | undefined;

    if (exam === undefined) {
        throw new Error(`Cannot transition missing exam ${examId}`);
    }

    const machine = ExamStateMachine.from(exam.status);
    machine.assertTransition(nextStatus);

    // Persist only statuses supported by the DB enum
    if (nextStatus === 'pending' || nextStatus === 'expired') {
      throw new ExamTransitionError(`Status ${nextStatus} cannot be persisted`);
    }

    // Update state
    await client.update(exams)
        .set({ status: nextStatus })
        .where(eq(exams.id, examId));

    return nextStatus;
  }
}

export class ExamTransitionError extends Error {
  readonly code = 'INVALID_EXAM_TRANSITION';
  constructor(message: string) {
    super(message);
    this.name = 'ExamTransitionError';
  }
}
