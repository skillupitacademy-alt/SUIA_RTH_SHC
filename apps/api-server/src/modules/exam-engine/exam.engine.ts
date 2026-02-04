import { db, examQuestions, exams, examBlueprints } from '@quiz/db';
import { eq, and } from 'drizzle-orm';
import { ScoringEngine } from '../scoring-engine/scoring.engine';
import { AnswerEvaluationEngine } from '../answer-engine/answer.engine';

export class ExamEngine {
  /**
   * Handles individual question submission within an exam.
   */
  static async submitAnswer(examId: string, questionId: string, answer: string, userId: string) {
    const exam = await db.query.exams.findFirst({
      where: eq(exams.id, examId),
    });

    if (!exam || exam.status !== 'started') {
      throw new Error('Exam is not active');
    }

    if (exam.userId !== userId) {
      throw new Error('Unauthorized: You do not own this exam session');
    }

    // Timer Logic: Check if exam time has expired
    if (exam.blueprintId) {
        const blueprint = await db.query.examBlueprints.findFirst({
            where: eq(examBlueprints.id, exam.blueprintId)
        });
        
        if (blueprint && blueprint.timeLimit) {
            const timeElapsed = (Date.now() - new Date(exam.startedAt).getTime()) / 1000 / 60; // in minutes
            if (timeElapsed > blueprint.timeLimit) {
                await db.update(exams)
                    .set({ status: 'abandoned' })
                    .where(eq(exams.id, examId));
                throw new Error('Exam time limit exceeded. Session abandoned.');
            }
        }
    }

    const eqRecord = await db.query.examQuestions.findFirst({
      where: and(
        eq(examQuestions.questionId, questionId),
        eq(examQuestions.examId, examId)
      ),
      with: {
        question: true,
      },
    });

    if (!eqRecord) throw new Error('Question not found in this exam');

    const isCorrect = AnswerEvaluationEngine.evaluate(
      eqRecord.question.type as any,
      eqRecord.question.correctAnswer,
      answer
    );

    await db.update(examQuestions)
      .set({ 
        userAnswer: answer,
        isCorrect,
      })
      .where(eq(examQuestions.id, eqRecord.id));

    return { isCorrect };
  }

  /**
   * Finalizes the exam and triggers scoring.
   */
  static async completeExam(examId: string, userId: string) {
    const exam = await db.query.exams.findFirst({
      where: eq(exams.id, examId),
    });

    if (!exam || exam.status === 'completed' || exam.status === 'processing') {
      throw new Error('Exam is already completed/processing or not found');
    }

    if (exam.userId !== userId) {
      throw new Error('Unauthorized: You do not own this exam session');
    }

    // 1. Mark as processing immediately
    await db.update(exams)
      .set({ status: 'processing' as any }) // using any to bypass enum check if types aren't synced yet
      .where(eq(exams.id, examId));

    // 2. Trigger Scoring Engine (Background)
    ScoringEngine.calculateExamResults(examId).catch(err => {
      console.error(`[ExamEngine] Async scoring trigger failed for ${examId}:`, err);
    });

    return { examId, status: 'processing' };
  }
}
