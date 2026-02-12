import type { examBlueprints } from '@quiz/db';
import { db, examQuestions, exams, idempotencyKeys } from '@quiz/db';
import { eq, and } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';
import { ScoringEngine } from '../scoring-engine/scoring.engine';
import { AnswerEvaluationEngine } from '../answer-engine/answer.engine';
import { cacheService } from '../core/cache.service';
import { SelectionService } from '../selection-engine/selection.service';

export interface StartExamConfig {
  subjectId?: string;
  subjectIds?: string[];
  topics?: string[];
  topicIds?: string[];
  subtopicIds?: string[];
  questionCount?: number;
  difficulty?: string;
}

export class ExamEngine {
  /**
   * Starts a new exam session or resumes an existing one based on idempotency key.
   */
  static async startExam(
    userId: string,
    blueprintOrDomainId: string,
    idempotencyKey?: string,
    config?: StartExamConfig
  ) {
    try {
      return await db.transaction(async (tx) => {
        // 1. Idempotency Check
        if (idempotencyKey !== undefined && idempotencyKey !== null && idempotencyKey !== '') {
          const existingKey = await tx.query.idempotencyKeys.findFirst({
            where: and(
              eq(idempotencyKeys.userId, userId),
              eq(idempotencyKeys.key, idempotencyKey)
            ),
          });

          if (existingKey) {
            return await this.resumeExamSession(tx, existingKey.examId);
          }
        }

        // 2. Selection Phase
        const { questions, blueprint } = await SelectionService.composeExam(userId, blueprintOrDomainId, (idempotencyKey !== undefined && idempotencyKey !== null && idempotencyKey !== '') ? idempotencyKey : 'no-key', config);

        // 3. Persistence Phase
        const [exam] = await tx.insert(exams).values({
          userId,
          blueprintId: blueprint.id,
          status: 'started',
          durationSeconds: (blueprint.timeLimit !== undefined && blueprint.timeLimit !== null) ? blueprint.timeLimit * 60 : null,
          totalScore: 0,
        }).returning();

        const examQuestionsData = (questions as { id: string }[]).map((q: { id: string }, index: number) => ({
          examId: exam.id,
          questionId: q.id,
          order: index + 1,
        }));

        await tx.insert(examQuestions).values(examQuestionsData);

        // 4. Record Idempotency Key
        if (idempotencyKey !== undefined && idempotencyKey !== null && idempotencyKey !== '') {
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
    } catch (_error: unknown) {
      const isPostgresError = typeof _error === 'object' && _error !== null && 'code' in _error && 'message' in _error;
      if (isPostgresError && (_error as {code: string; message: string}).code === '23505' && (_error as {code: string; message: string}).message.includes('unq_user_key')) {
        return await this.handleRaceCondition(userId, idempotencyKey!);
      }
      throw _error;
    }
  }

  private static async resumeExamSession(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], examId: string) {
    const exam = await tx.query.exams.findFirst({
      where: eq(exams.id, examId),
      with: {
        examQuestions: {
          with: {
            question: true
          },
          orderBy: (eqs, { asc }) => [asc(eqs.order)]
        }
      }
    });

    if (exam !== undefined) {
      const now = Date.now();
      const startedAt = new Date(exam.startedAt).getTime();
      const remainingSeconds = exam.durationSeconds !== null ? 
          Math.max(0, exam.durationSeconds - Math.floor((now - startedAt) / 1000)) : 
          null;

      return {
        examId: exam.id,
        status: exam.status,
        totalQuestions: exam.examQuestions.length,
        durationSeconds: exam.durationSeconds,
        remainingSeconds,
        firstQuestion: (exam.examQuestions[0]?.question !== undefined && exam.examQuestions[0]?.question !== null) ? {
          id: exam.examQuestions[0].question.id,
          questionText: exam.examQuestions[0].question.questionText,
          options: exam.examQuestions[0].question.options,
          codeSnippet: exam.examQuestions[0].question.codeSnippet,
          type: exam.examQuestions[0].question.type,
          order: exam.examQuestions[0].order
        } : null
      };
    }
    throw new Error('Exam session resolution failed');
  }

  private static async handleRaceCondition(userId: string, idempotencyKey: string) {
    const existingKey = await db.query.idempotencyKeys.findFirst({
      where: and(
        eq(idempotencyKeys.userId, userId),
        eq(idempotencyKeys.key, idempotencyKey)
      ),
    });
    if (existingKey !== undefined) {
       const exam = await db.query.exams.findFirst({
        where: eq(exams.id, existingKey.examId),
        with: {
          examQuestions: {
            with: { question: true },
            orderBy: (eqs, { asc }) => [asc(eqs.order)]
          }
        }
      });
      if (exam !== undefined) {
        const now = Date.now();
        const startedAt = new Date(exam.startedAt).getTime();
        const remainingSeconds = exam.durationSeconds !== null ? 
            Math.max(0, exam.durationSeconds - Math.floor((now - startedAt) / 1000)) : 
            null;

        return {
          examId: exam.id,
          status: exam.status,
          totalQuestions: exam.examQuestions.length,
          durationSeconds: exam.durationSeconds,
          remainingSeconds,
          firstQuestion: (exam.examQuestions[0]?.question !== undefined && exam.examQuestions[0]?.question !== null) ? {
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
    throw new Error('Collision recovery failed');
  }

  /**
   * Handles individual question submission within an exam.
   */
  static async submitAnswer(examId: string, questionId: string, answer: string, userId: string, idempotencyKey?: string) {
    return await db.transaction(async (tx) => {
        return await this.executeSubmitAnswer(tx, examId, questionId, answer, userId, idempotencyKey);
    });
  }

  private static async executeSubmitAnswer(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], examId: string, questionId: string, answer: string, userId: string, idempotencyKey?: string) {
    if (idempotencyKey !== undefined && idempotencyKey !== null && idempotencyKey !== '') {
        const existingKey = await tx.query.idempotencyKeys.findFirst({
            where: and(eq(idempotencyKeys.userId, userId), eq(idempotencyKeys.key, `answer:${idempotencyKey}`)),
        });
        if (existingKey !== undefined) return; 
    }

    const exam = await this.getAndCacheActiveExam(userId, examId);
    if (exam.status !== 'started') throw new Error('Exam is not active');
    if (exam.userId !== userId) throw new Error('Unauthorized');

    this.checkExamTimeLimit(exam);

    const eqRecord = await tx.query.examQuestions.findFirst({
        where: and(eq(examQuestions.questionId, questionId), eq(examQuestions.examId, examId)),
        with: { question: true },
    });
    if (eqRecord === undefined) throw new Error('Question not found');

    await this.updateExamResponse(tx, exam, eqRecord, answer);

    if (idempotencyKey !== undefined && idempotencyKey !== null && idempotencyKey !== '') {
        await tx.insert(idempotencyKeys).values({ userId, key: `answer:${idempotencyKey}`, examId: examId });
    }
  }

  private static async getAndCacheActiveExam(userId: string, examId: string) {
    const cacheKey = `exam-header:${userId}:${examId}`;
    type Exam = InferSelectModel<typeof exams> & { blueprint?: InferSelectModel<typeof examBlueprints> | null };
    let exam: Exam | null = (await cacheService.get<Exam>(cacheKey).catch(() => null)) ?? null;

    if (exam === null) {
      const dbExam = await db.query.exams.findFirst({ where: eq(exams.id, examId), with: { blueprint: true } });
      exam = dbExam ? (dbExam as unknown as Exam) : null;
      if (exam !== null) await cacheService.set(cacheKey, exam, 1000 * 60 * 2).catch(() => null);
    }
    if (exam === null) throw new Error('Session not found');
    return exam;
  }

  private static checkExamTimeLimit(exam: InferSelectModel<typeof exams> & { blueprint?: InferSelectModel<typeof examBlueprints> | null }) {
    const startTime = new Date(exam.startedAt).getTime();
    const timeElapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    const limit = (exam.blueprint?.timeLimit !== undefined && exam.blueprint?.timeLimit !== null && exam.blueprint?.timeLimit > 0) 
        ? exam.blueprint.timeLimit * 60 
        : 3600;
    const durationSeconds = exam.durationSeconds ?? limit;

    if (timeElapsedSeconds > durationSeconds) {
        throw new Error('Time limit exceeded');
    }
  }

  private static async updateExamResponse(
    tx: Parameters<Parameters<typeof db.transaction>[0]>[0], 
    exam: InferSelectModel<typeof exams>, 
    eqRecord: { 
        id: string; 
        responseMetadata: unknown; 
        question: { 
            type: string; 
            correctAnswer: string; 
        } 
    }, 
    answer: string
  ) {
    const isCorrect = AnswerEvaluationEngine.evaluate(eqRecord.question.type as "mcq" | "code_mcq", eqRecord.question.correctAnswer, answer);
    const now = new Date();
    const lastTime = exam.lastAnsweredAt ? new Date(exam.lastAnsweredAt).getTime() : new Date(exam.startedAt).getTime();
    const existingMetadata = (eqRecord.responseMetadata as Record<string, unknown> | null) ?? {};
    const timeSpentSeconds = existingMetadata.timeSpentSeconds !== undefined ? existingMetadata.timeSpentSeconds : Math.max(0, Math.floor((now.getTime() - lastTime) / 1000));

    await tx.update(examQuestions).set({ 
        userAnswer: answer, isCorrect, 
        responseMetadata: { ...existingMetadata, timeSpentSeconds, firstAnsweredAt: existingMetadata.firstAnsweredAt ?? now.toISOString() } 
    }).where(eq(examQuestions.id, eqRecord.id));

    await tx.update(exams).set({ lastAnsweredAt: now }).where(eq(exams.id, exam.id));
  }

  /**
   * Finalizes the exam and triggers scoring.
   */
  static async completeExam(examId: string, userId: string, idempotencyKey?: string) {
    let targetExamId = examId;
    if (idempotencyKey !== undefined && idempotencyKey !== null && idempotencyKey !== '') {
        const existingKey = await db.query.idempotencyKeys.findFirst({
            where: and(eq(idempotencyKeys.userId, userId), eq(idempotencyKeys.key, `submit:${idempotencyKey}`)),
        });
        if (existingKey) targetExamId = existingKey.examId;
    }

    const fullExam = await db.query.exams.findFirst({ where: eq(exams.id, targetExamId) });
    if (!fullExam) throw new Error('Exam not found');
    if (fullExam.userId !== userId) throw new Error('Unauthorized');

    if (['completed', 'processing', 'failed', 'abandoned'].includes(fullExam.status)) {
        return { examId: targetExamId, status: fullExam.status };
    }

    const updated = await db.update(exams).set({ status: 'processing' })
      .where(and(eq(exams.id, targetExamId), eq(exams.status, 'started')))
      .returning({ id: exams.id });

    if (updated.length > 0) {
        if (idempotencyKey !== undefined && idempotencyKey !== null && idempotencyKey !== '') {
            await db.insert(idempotencyKeys).values({ userId, key: `submit:${idempotencyKey}`, examId: targetExamId }).onConflictDoNothing();
        }
        ScoringEngine.calculateExamResults(targetExamId).catch(err => {
            console.error(`[ExamEngine] Scoring failed for ${targetExamId}:`, err);
        });
    }

    return { examId: targetExamId, status: 'processing' };
  }
}
