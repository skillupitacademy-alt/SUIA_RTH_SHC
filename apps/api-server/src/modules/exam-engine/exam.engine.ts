import { db, examQuestions, exams } from '@quiz/db';
import { eq, and } from 'drizzle-orm';
import { ScoringService } from '../scoring/scoring.service';
import { AnswerEvaluationEngine } from '../answer-engine/answer.engine';

export class ExamEngine {
  /**
   * Handles individual question submission within an exam.
   */
  static async submitAnswer(examId: string, examQuestionId: string, answer: string) {
    const exam = await db.query.exams.findFirst({
      where: eq(exams.id, examId),
    });

    if (!exam || exam.status !== 'started') {
      throw new Error('Exam is not active');
    }

    const eqRecord = await db.query.examQuestions.findFirst({
      where: and(
        eq(examQuestions.id, examQuestionId),
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
        updatedAt: new Date(),
      })
      .where(eq(examQuestions.id, examQuestionId));

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
    const finalScore = await ScoringService.calculateExamResults(examId);

    return { examId, finalScore };
  }
}
