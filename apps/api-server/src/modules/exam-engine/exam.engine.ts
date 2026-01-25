import { db, examQuestions, exams } from '@quiz/db';
import { eq, and } from 'drizzle-orm';
import { ScoringEngine } from '../scoring-engine/scoring.engine';
import { AnswerEvaluationEngine } from '../answer-engine/answer.engine';

export class ExamEngine {
  /**
   * Handles individual question submission within an exam.
   */
  static async submitAnswer(examId: string, questionId: string, answer: string) {
    const exam = await db.query.exams.findFirst({
      where: eq(exams.id, examId),
    });

    if (!exam || exam.status !== 'started') {
      throw new Error('Exam is not active');
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
  static async completeExam(examId: string) {
    const exam = await db.query.exams.findFirst({
      where: eq(exams.id, examId),
    });

    if (!exam || exam.status === 'completed') {
      throw new Error('Exam is already completed or not found');
    }

    // Trigger Scoring Engine (calculated in previous phase)
    const finalScore = await ScoringEngine.calculateExamResults(examId);

    return { examId, finalScore };
  }
}
