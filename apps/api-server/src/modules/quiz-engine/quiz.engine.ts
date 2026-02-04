import { db, exams, examQuestions, questions } from '@quiz/db';
import { eq, and, sql } from 'drizzle-orm';
import { SelectionEngine } from '../selection-engine/selection.service';
import { SessionService } from '../exam-engine/session.service';


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
  static async getQuizState(examId: string, userId: string) {
    // benefit from cache + ownership validation
    const header = await SessionService.syncSession(examId, userId);

    if (header.userId !== userId) {
      throw new Error('Unauthorized: You do not own this quiz session');
    }


    // Secondary fetch with relations if authorized
    const fullExam = await db.query.exams.findFirst({
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
    
    if (!fullExam) throw new Error('Quiz not found');

    return {
      id: fullExam.id,
      status: fullExam.status,
      startedAt: fullExam.startedAt,
      completedAt: fullExam.completedAt,
      totalScore: fullExam.totalScore,
      questions: fullExam.examQuestions.map((eq) => ({
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
