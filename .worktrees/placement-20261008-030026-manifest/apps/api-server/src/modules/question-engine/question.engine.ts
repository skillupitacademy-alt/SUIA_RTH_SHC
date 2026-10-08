import { db, questions } from '@quiz/db';
import { and, eq, sql } from 'drizzle-orm';

export class QuestionDeliveryEngine {
  /**
   * Strategically fetches the next question based on exam state.
   * (Stub for Adaptive Logic Integration)
   */
  static async getNextQuestion(examId: string, _userId: string): Promise<{ id: string; text: string; options: unknown; type: string; difficulty: string } | null> {
    const nextQ = await db.query.questions.findFirst({
        where: and(
            eq(questions.status, 'active'),
            sql`${questions.id} NOT IN (
                SELECT question_id FROM exam_questions WHERE exam_id = ${examId}
            )`
        )
    });

    if (nextQ === undefined || nextQ === null) return null;

    return {
        id: nextQ.id,
        text: nextQ.questionText,
        options: nextQ.options,
        type: nextQ.type,
        difficulty: nextQ.difficulty
    };
  }
  /**
   * Re-randomizes the order of remaining questions (if needed by platform rules).
   */
  static async shuffleRemaining(_examId: string) {
    // Advanced logic to re-order unanswered questions
    // ...
  }
}
