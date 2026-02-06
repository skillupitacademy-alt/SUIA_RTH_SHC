import { db, examQuestions, exams, examBlueprints, idempotencyKeys } from '@quiz/db';
import { eq, and } from 'drizzle-orm';
import { ScoringEngine } from '../scoring-engine/scoring.engine';
import { AnswerEvaluationEngine } from '../answer-engine/answer.engine';
import { SelectionEngine } from '../selection-engine/selection.service';

export class ExamEngine {
  /**
   * Starts a new exam session or resumes an existing one based on idempotency key.
   */
  static async startExam(
    userId: string,
    blueprintOrDomainId: string,
    idempotencyKey?: string,
    config?: any
  ) {
    try {
      return await db.transaction(async (tx) => {
        // 1. Idempotency Check
        if (idempotencyKey) {
          const existingKey = await tx.query.idempotencyKeys.findFirst({
            where: and(
              eq(idempotencyKeys.userId, userId),
              eq(idempotencyKeys.key, idempotencyKey)
            ),
          });

          if (existingKey) {
            // Resume flow...
            const exam = await tx.query.exams.findFirst({
              where: eq(exams.id, existingKey.examId),
              with: {
                examQuestions: {
                  with: {
                    question: true
                  },
                  orderBy: (eqs, { asc }) => [asc(eqs.order)]
                }
              }
            });

            if (exam) {
              return {
                examId: exam.id,
                status: exam.status,
                totalQuestions: exam.examQuestions.length,
                durationSeconds: exam.durationSeconds,
                remainingSeconds: exam.durationSeconds ? 
                  Math.max(0, exam.durationSeconds - Math.floor((Date.now() - exam.startedAt.getTime()) / 1000)) : 
                  null,
                firstQuestion: exam.examQuestions[0]?.question ? {
                  id: exam.examQuestions[0].question.id,
                  questionText: exam.examQuestions[0].question.questionText,
                  options: exam.examQuestions[0].question.options,
                  codeSnippet: exam.examQuestions[0].question.codeSnippet,
                  type: exam.examQuestions[0].question.type,
                  order: exam.examQuestions[0].order
                } : null
              };
            }
          }
        }

        // 2. Selection Phase
        const { questions, blueprint } = await SelectionEngine.composeExam(userId, blueprintOrDomainId, config);

        // 3. Persistence Phase
        const [exam] = await tx.insert(exams).values({
          userId,
          blueprintId: blueprint.id,
          status: 'started',
          durationSeconds: blueprint.timeLimit ? blueprint.timeLimit * 60 : null,
          totalScore: 0,
        }).returning();

        const examQuestionsData = questions.map((q, index) => ({
          examId: exam.id,
          questionId: q.id,
          order: index + 1,
        }));

        await tx.insert(examQuestions).values(examQuestionsData);

        // 4. Record Idempotency Key
        if (idempotencyKey) {
          await tx.insert(idempotencyKeys).values({
            userId,
            key: idempotencyKey,
            examId: exam.id,
          });
        }

        return {
          examId: exam.id,
          status: exam.status,
          totalQuestions: questions.length,
          durationSeconds: exam.durationSeconds,
          remainingSeconds: exam.durationSeconds,
          firstQuestion: {
            id: questions[0].id,
            questionText: questions[0].questionText,
            options: questions[0].options,
            codeSnippet: questions[0].codeSnippet,
            type: questions[0].type,
            order: 1
          }
        };
      });
    } catch (error: any) {
      // Task C: Collision Handling (Postgres 23505 Unique Violation)
      if (error.code === '23505' && error.message.includes('unq_user_key')) {
        console.warn(`[ExamEngine] Idempotency race detected for user ${userId}. Re-fetching session.`);
        // Re-run startExam without a transaction block at the entry (it will hit the "existingKey" check)
        const existingKey = await db.query.idempotencyKeys.findFirst({
          where: and(
            eq(idempotencyKeys.userId, userId),
            eq(idempotencyKeys.key, idempotencyKey!)
          ),
        });
        if (existingKey) {
           // Direct recovery
           const exam = await db.query.exams.findFirst({
            where: eq(exams.id, existingKey.examId),
            with: {
              examQuestions: {
                with: { question: true },
                orderBy: (eqs, { asc }) => [asc(eqs.order)]
              }
            }
          });
          if (exam) {
            return {
              examId: exam.id,
              status: exam.status,
              totalQuestions: exam.examQuestions.length,
              durationSeconds: exam.durationSeconds,
              remainingSeconds: exam.durationSeconds ? 
                Math.max(0, exam.durationSeconds - Math.floor((Date.now() - exam.startedAt.getTime()) / 1000)) : 
                null,
              firstQuestion: exam.examQuestions[0]?.question ? {
                id: exam.examQuestions[0].question.id,
                questionText: exam.examQuestions[0].question.questionText,
                options: exam.examQuestions[0].question.options,
                codeSnippet: exam.examQuestions[0].question.codeSnippet,
                type: exam.examQuestions[0].question.type,
                order: exam.examQuestions[0].order
              } : null
            };
          }
        }
      }
      throw error;
    }
  }

  /**
   * Handles individual question submission within an exam.
   */
  static async submitAnswer(examId: string, questionId: string, answer: string, userId: string) {
    const exam = await db.query.exams.findFirst({
      where: eq(exams.id, examId),
      with: { blueprint: true }
    });

    if (!exam || exam.status !== 'started') {
      throw new Error('Exam is not active');
    }

    if (exam.userId !== userId) {
      throw new Error('Unauthorized: You do not own this exam session');
    }

    // Task D: Timer Logic: Check if exam time has expired
    const startTime = new Date(exam.startedAt).getTime();
    const timeElapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    
    // Priority: snapshot durationSeconds > blueprint timeLimit > default 3600
    const durationSeconds = exam.durationSeconds || (exam.blueprint?.timeLimit ? exam.blueprint.timeLimit * 60 : 3600);

    if (timeElapsedSeconds > durationSeconds) {
        await db.update(exams)
            .set({ status: 'abandoned' })
            .where(eq(exams.id, examId));
        throw new Error('Exam time limit exceeded. Session abandoned.');
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
   * STRICT ORDER:
   * 1. Resolve Exam ID (from ID or Idempotency Key)
   * 2. Strict Ownership Check (Throw if fail) -> Never reveal existence/status to non-owner
   * 3. Idempotency/Status Replay (If already processing/completed, return status)
   * 4. Atomic Transition (started -> processing)
   * 5. Trigger Scoring (Only if atomic transition succeeded)
   */
  static async completeExam(examId: string, userId: string, idempotencyKey?: string) {
    let targetExamId = examId;

    // 1. Idempotency Resolution (Resolve Exam ID from Key if provided)
    if (idempotencyKey) {
        const existingKey = await db.query.idempotencyKeys.findFirst({
            where: and(
                eq(idempotencyKeys.userId, userId),
                eq(idempotencyKeys.key, `submit:${idempotencyKey}`)
            ),
        });
        if (existingKey) {
            targetExamId = existingKey.examId;
        }
    }

    // Fetch Exam state
    const exam = await db.query.exams.findFirst({
      where: eq(exams.id, targetExamId),
    });

    if (!exam) {
      throw new Error('Exam not found');
    }

    // 2. Strict Ownership Check
    if (exam.userId !== userId) {
      throw new Error('Unauthorized: You do not own this exam session');
    }

    // 3. Graceful Replay (Idempotency)
    if (exam.status === 'completed' || exam.status === 'processing') {
        return { examId: targetExamId, status: exam.status };
    }

    // 4. Atomic Transition (started -> processing)
    // Only update if status is currently 'started'. This prevents race conditions.
    const updated = await db.update(exams)
      .set({ 
          status: 'processing' as any,
          completedAt: new Date()
      }) 
      .where(and(
          eq(exams.id, targetExamId),
          eq(exams.status, 'started')
      ))
      .returning({ id: exams.id });

    // 5. Trigger Scoring (Only if we were the ones who transitioned it)
    if (updated.length > 0) {
        // Record Idempotency Key (if provided and we won the race)
        if (idempotencyKey) {
            await db.insert(idempotencyKeys).values({
                userId,
                key: `submit:${idempotencyKey}`,
                examId: targetExamId,
            }).onConflictDoNothing(); // Safe to ignore if key already exists (though unlikely given strict order)
        }

        ScoringEngine.calculateExamResults(targetExamId).catch(err => {
            console.error(`[ExamEngine] Async scoring trigger failed for ${targetExamId}:`, err);
        });
    }

    return { examId: targetExamId, status: 'processing' };
  }
}
