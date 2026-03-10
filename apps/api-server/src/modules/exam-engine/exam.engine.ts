import { db, examBlueprints, examQuestions, exams, idempotencyKeys, QUICK_QUERY_TIMEOUT, STANDARD_QUERY_TIMEOUT, withTimeout as dbWithTimeout } from '@quiz/db';
import { eq, type InferSelectModel } from 'drizzle-orm';

import { TOKENS } from '@/lib/app.container';
import { eventBus } from '@/lib/event-bus';
import { AppEvents, type ExamStartedPayload } from '@/lib/events';
import { logger } from '@/lib/logger';
import { cacheService } from '@/modules/core/cache.service';
import { container } from '@/modules/core/container';
import { SelectionService } from '@/modules/selection-engine/selection.service';

import { PerformanceService } from '../report-engine/performance.service';
import { ExamBuilder } from './exam.builder';
import { ExamSaga } from './exam.saga';
import { ExamStateMachine } from './exam.state-machine';
import { ExamRepository } from './repositories/exam.repository';

const withTimeout = dbWithTimeout ?? (async <T>(promise: Promise<T>) => promise);

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
  private static singleton: ExamEngine | null = null;
  private examRepo: ExamRepository;
  private selectionService: SelectionService;
  private performanceService: PerformanceService;

  constructor() {
    this.examRepo = container.get<ExamRepository>(TOKENS.AuditLoggingExamRepo);
    this.selectionService = container.get<SelectionService>(TOKENS.SelectionService);
    this.performanceService = container.get<PerformanceService>(TOKENS.PerformanceService);
  }

  private static getInstance() {
    if (this.singleton === null) this.singleton = new ExamEngine();
    return this.singleton;
  }

  /**
   * Starts a new exam session or resumes an existing one based on idempotency key.
   */
  static async startExam(
    userId: string,
    blueprintOrDomainId: string,
    idempotencyKey?: string,
    config?: StartExamConfig
  ) {
    return this.getInstance().startExam(userId, blueprintOrDomainId, idempotencyKey, config);
  }

  async startExam(
    userId: string,
    blueprintOrDomainId: string,
    idempotencyKey?: string,
    config?: StartExamConfig
  ) {
    try {
      // 1. Idempotency Check
      if (idempotencyKey !== undefined && idempotencyKey !== null && idempotencyKey !== '') {
        const existingKey = await this.examRepo.checkIdempotency(userId, idempotencyKey);
        if (existingKey) {
          return await this.resumeExamSession(existingKey.examId);
        }
      }

      // 2. Build using ExamBuilder
      const { exam, questions } = await withTimeout(
        new ExamBuilder()
          .forUser(userId)
          .withBlueprint(blueprintOrDomainId)
          .withIdempotency(idempotencyKey)
          .withConfig(config)
          .build(),
        STANDARD_QUERY_TIMEOUT,
        'ExamEngine.startExam.build'
      );

      // 3. Emit Event
      void eventBus.emitEvent(AppEvents.EXAM_STARTED, {
        examId: exam.id,
        userId,
        blueprintId: blueprintOrDomainId,
        questionCount: questions.length,
        startedAt: new Date(exam.startedAt),
      } satisfies ExamStartedPayload);

      return {
        examId: exam.id,
        status: exam.status,
        totalQuestions: questions.length,
        durationSeconds: exam.durationSeconds,
        remainingSeconds: exam.durationSeconds,
        firstQuestion: questions.length > 0
          ? {
              id: questions[0].id,
              questionText: questions[0].questionText,
              options: questions[0].options,
              codeSnippet: questions[0].codeSnippet,
              type: questions[0].type,
              order: 1
            }
          : null
      };
    } catch (_error: unknown) {
      const isPostgresError = typeof _error === 'object' && _error !== null && 'code' in _error && 'message' in _error;
      if (isPostgresError && (_error as {code: string; message: string}).code === '23505' && (_error as {code: string; message: string}).message.includes('unq_user_key')) {
        return await this.handleRaceCondition(userId, idempotencyKey!);
      }
      throw _error;
    }
  }

  private async resumeExamSession(examId: string) {
    const exam = await this.examRepo.findByIdWithQuestions(examId);

    if (exam !== undefined && exam !== null) {
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
        firstQuestion: (exam.examQuestions.length > 0 && exam.examQuestions[0]?.question !== undefined && exam.examQuestions[0]?.question !== null)
          ? {
              id: exam.examQuestions[0].question.id,
              questionText: exam.examQuestions[0].question.questionText,
              options: exam.examQuestions[0].question.options,
              codeSnippet: exam.examQuestions[0].question.codeSnippet,
              type: exam.examQuestions[0].question.type,
              order: exam.examQuestions[0].order
            }
          : null
      };
    }
    throw new Error('Exam session resolution failed');
  }

  private async handleRaceCondition(userId: string, idempotencyKey: string) {
    const existingKey = await this.examRepo.checkIdempotency(userId, idempotencyKey);
    if (existingKey) {
       return await this.resumeExamSession(existingKey.examId);
    }
    throw new Error('Collision recovery failed');
  }

  // --- Static facades for legacy tests ---
  static submitAnswer(
    examId: string,
    questionId: string,
    answer: string,
    userId: string,
    idempotencyKey?: string
  ) {
    return this.getInstance().submitAnswer(examId, questionId, answer, userId, idempotencyKey);
  }

  static completeExam(examId: string, userId: string, idempotencyKey?: string) {
    return this.getInstance().completeExam(examId, userId, idempotencyKey);
  }

  static setInstance(mock: ExamEngine) {
    this.singleton = mock;
  }

  async submitAnswer(examId: string, questionId: string, answer: string, userId: string, idempotencyKey?: string) {
    if (idempotencyKey !== undefined && idempotencyKey !== null && idempotencyKey !== '') {
        const cacheKey = `idem:ans:${userId}:${idempotencyKey}`;
        const existing = await cacheService.get(cacheKey).catch(() => null);
        if (existing !== null) return; 
    }

    const exam = await this.getAndCacheActiveExam(userId, examId);
    if (exam.status !== 'started') throw new Error('Exam is not active');
    if (exam.userId !== userId) throw new Error('Unauthorized');

    this.checkExamTimeLimit(exam);

    const liveStateKey = `exam-state:${examId}`;
    const answerPayload = {
        questionId,
        answer,
        timestamp: new Date().toISOString(),
        idempotencyKey: idempotencyKey ?? null
    };

    await cacheService.set(`${liveStateKey}:q:${questionId}`, answerPayload, 1000 * 60 * 60 * 2).catch(() => null);
    
    await withTimeout(
      this.examRepo.updateLastAnswered(examId),
      QUICK_QUERY_TIMEOUT,
      'ExamEngine.updateLastAnswered'
    );

    if (idempotencyKey !== undefined && idempotencyKey !== null && idempotencyKey !== '') {
        await cacheService.set(`idem:ans:${userId}:${idempotencyKey}`, { used: true }, 1000 * 60 * 60 * 24).catch(() => null);
    }
  }

  private async getAndCacheActiveExam(userId: string, examId: string) {
    const cacheKey = `exam-header:${userId}:${examId}`;
    type ExamWithBlueprint = InferSelectModel<typeof exams> & { blueprint?: InferSelectModel<typeof examBlueprints> | null };
    let exam: ExamWithBlueprint | null = (await cacheService.get<ExamWithBlueprint>(cacheKey).catch(() => null)) ?? null;

    if (exam === null) {
      const dbExam = await withTimeout(
        this.examRepo.findByIdWithBlueprint(examId),
        QUICK_QUERY_TIMEOUT,
        'ExamEngine.fetchActiveExam'
      );
      exam = (dbExam as ExamWithBlueprint) ?? null;
      if (exam !== null) await cacheService.set(cacheKey, exam, 1000 * 60 * 2).catch(() => null);
    }
    if (exam === null) throw new Error('Session not found');
    return exam;
  }

  private checkExamTimeLimit(exam: InferSelectModel<typeof exams> & { blueprint?: InferSelectModel<typeof examBlueprints> | null }) {
    const startTime = new Date(exam.startedAt).getTime();
    const timeElapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    const limit = exam.blueprint?.timeLimit != null
        ? exam.blueprint.timeLimit * 60 
        : 3600;
    const durationSeconds = exam.durationSeconds ?? limit;

    if (timeElapsedSeconds > durationSeconds) {
        throw new Error('Time limit exceeded');
    }
  }

  async completeExam(examId: string, userId: string, idempotencyKey?: string) {
    let targetExamId = examId;
    if (idempotencyKey !== undefined && idempotencyKey !== null && idempotencyKey !== '') {
        const existingKey = await this.examRepo.checkIdempotency(userId, `submit:${idempotencyKey}`);
        if (existingKey) targetExamId = existingKey.examId;
    }

    await this.performanceService.invalidateCache(targetExamId);

    const fullExam = await this.examRepo.findById(targetExamId);
    if (!fullExam) throw new Error('Exam not found');
    if (fullExam.userId !== userId) throw new Error('Unauthorized');

    if (['completed', 'processing', 'failed', 'abandoned'].includes(fullExam.status)) {
        return { examId: targetExamId, status: fullExam.status };
    }

    // Use State Machine (Task 62)
    await ExamStateMachine.transition(targetExamId, 'processing', userId);
    
    let jobId: string | undefined;

    await db.transaction(async (tx) => {
        // Double check status inside transaction for safety
        const txExam = await tx.query.exams.findFirst({
            where: eq(exams.id, targetExamId),
            columns: { status: true }
        });
        
        if (txExam?.status === 'processing') {
            // Phase 3: Flush stored answers from Redis to Postgres
            try {
                const liveStatePrefix = `exam-state:${targetExamId}:q:`;
                
                const examWithQuestions = await withTimeout(
                    tx.query.exams.findFirst({
                        where: eq(exams.id, targetExamId),
                        with: {
                            examQuestions: {
                                with: {
                                    question: true,
                                },
                            },
                        },
                    }),
                    STANDARD_QUERY_TIMEOUT,
                    'ExamEngine.completeExam.fetchQuestions'
                );

                const examQuestionsList = examWithQuestions?.examQuestions ?? [];
                if (examQuestionsList.length > 0) {
                    for (const eqRecord of examQuestionsList) {
                        const cached = await cacheService.get<{ answer: string }>(`${liveStatePrefix}${eqRecord.questionId}`).catch(() => null);
                        const cachedAnswer = cached?.answer ?? null;
                        if (cachedAnswer !== null && cachedAnswer !== '') {
                            const now = new Date();
                            const lastTime = fullExam.lastAnsweredAt ? new Date(fullExam.lastAnsweredAt).getTime() : new Date(fullExam.startedAt).getTime();
                            const existingMetadata = (eqRecord.responseMetadata as Record<string, unknown> | null) ?? {};
                            const timeSpentSeconds = existingMetadata.timeSpentSeconds ?? Math.max(0, Math.floor((now.getTime() - lastTime) / 1000));

                            await tx.update(examQuestions)
                              .set({
                                userAnswer: cachedAnswer, 
                                responseMetadata: { ...existingMetadata, timeSpentSeconds, firstAnsweredAt: existingMetadata.firstAnsweredAt ?? now.toISOString() } 
                              })
                              .where(eq(examQuestions.id, eqRecord.id));
                        }
                    }
                }
                
                await tx.update(exams)
                  .set({ lastAnsweredAt: new Date() })
                  .where(eq(exams.id, targetExamId));

            } catch (e) {
                logger.error({ err: e, examId: targetExamId }, '[ExamEngine] Failed to flush Redis answers to DB');
                throw e; 
            }

            if (idempotencyKey !== undefined && idempotencyKey !== null && idempotencyKey !== '') {
                await tx.insert(idempotencyKeys).values({ userId, key: `submit:${idempotencyKey}`, examId: targetExamId }).onConflictDoNothing();
            }
            
            jobId = await ExamSaga.start(targetExamId, userId);
        }
    });

    return { examId: targetExamId, status: 'processing', jobId };
  }
}
