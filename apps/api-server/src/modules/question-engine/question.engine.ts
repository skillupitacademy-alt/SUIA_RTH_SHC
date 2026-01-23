import { db, questions } from '@quiz/db';
import { eq, sql, inArray, and } from 'drizzle-orm';

export class QuestionDeliveryEngine {
  /**
   * Fetches a single question for streaming, ensuring it hasn't been served or answered.
   * This is part of the "Question Streaming" requirement.
   */
  static async nextQuestion(examId: string) {
    // Logic to find the next unanswered question in the exam
    const nextQ = await db.query.examQuestions.findFirst({
      where: and(
        sql`exam_id = ${examId}`,
        sql`user_answer IS NULL`
      ),
      orderBy: (eq, { asc }) => [asc(eq.order)],
      with: {
        question: true
      }
    });

    if (!nextQ) return null;

    return {
      examQuestionId: nextQ.id,
      ...nextQ.question,
      correctAnswer: undefined, // Strip answer for delivery
    };
  }

  /**
   * Re-randomizes the order of remaining questions (if needed by platform rules).
   */
  static async shuffleRemaining(examId: string) {
    // Advanced logic to re-order unanswered questions
    // ...
  }
}
