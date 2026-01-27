import { db, exams, examQuestions, questions } from '@quiz/db';
import { eq, and, sql } from 'drizzle-orm';
import { SelectionEngine } from '../selection-engine/selection.service';

export class QuizEngine {
  /**
   * Starts a new quiz session by creating an exam from a blueprint.
   */
  static async startQuiz(
    userId: string, 
    blueprintId: string, 
    config?: { 
      subjectIds?: string[],
      topicIds?: string[], 
      subtopicIds?: string[],
      questionCount?: number, 
      difficulty?: string 
    }
  ) {
    const exam = await SelectionEngine.composeExam(userId, blueprintId, config);
    if (!exam) throw new Error('Failed to compose quiz');
    return exam;
  }

  /**
   * Retrieves the current state of a quiz session.
   */
  static async getQuizState(examId: string) {
    const exam = await db.query.exams.findFirst({
      where: eq(exams.id, examId),
      with: {
        examQuestions: {
          with: {
            question: true,
          },
          orderBy: (eq, { asc }) => [asc(eq.order)],
        },
      },
    });
    
    console.log(`[QuizEngine] Fetching state for examId=${examId}. Found? ${!!exam}`);
    if (exam) {
        console.log(`[QuizEngine] Exam status=${exam.status}, Questions=${exam.examQuestions.length}`);
        if(exam.examQuestions.length > 0) {
             console.log(`[QuizEngine] Sample Q1: ${JSON.stringify(exam.examQuestions[0])}`);
        }
    }

    if (!exam) throw new Error('Quiz not found');

    return {
      id: exam.id,
      status: exam.status,
      startedAt: exam.startedAt,
      completedAt: exam.completedAt,
      totalScore: exam.totalScore,
      questions: exam.examQuestions.map((eq) => ({
        id: eq.id,
        questionId: eq.questionId,
        questionText: eq.question.questionText,
        options: eq.question.options,
        type: eq.question.type,
        userAnswer: eq.userAnswer,
        isAnswered: eq.userAnswer !== null,
        order: eq.order,
      })),
    };
  }
}
