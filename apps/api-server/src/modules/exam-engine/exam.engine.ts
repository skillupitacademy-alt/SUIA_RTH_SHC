import { db, examBlueprints, examQuestions, exams, idempotencyKeys, QUICK_QUERY_TIMEOUT, STANDARD_QUERY_TIMEOUT, withTimeout as dbWithTimeout } from '@quiz/db';
import { eq, type InferSelectModel } from 'drizzle-orm';

import { eventBus } from '@/lib/event-bus';
import { AppEvents, type ExamStartedPayload } from '@/lib/events';
import { logger } from '@/lib/logger';
import { container } from '@/modules/core/container';
import { getDisplayType, normalizeQuestionOptions, normalizeQuestionType, parseAnswer } from '@/modules/question/question-contract';
import { SelectionService } from '@/modules/selection-engine/selection.service';

import type { AnswerEvaluationEngine } from '../answer-engine/answer.engine';
import type { CacheValue } from '../core/cache.service';
import { PerformanceService } from '../report-engine/performance.service';
import { ExamBuilder } from './exam.builder';
import { ExamRepository } from './repositories/exam.repository';

const withTimeout = dbWithTimeout ?? (async <T>(promise: Promise<T>) => promise);
export const __withTimeout = withTimeout;

const TOKENS = {
  SelectionService: 'ISelectionService',
  PerformanceService: 'IPerformanceService',
  AuditLoggingExamRepo: 'AuditLoggingExamRepository',
} as const;

type ExamWithQuestions = NonNullable<Awaited<ReturnType<ExamRepository['findByIdWithQuestions']>>>;
type ExamHeader = Pick<InferSelectModel<typeof exams>, 'id' | 'status' | 'userId' | 'startedAt' | 'lastAnsweredAt'>;
type ExamRepoWithFindById = { findById?: (id: string) => Promise<ExamHeader | null | undefined> };
type ScorableQuestion = {
  type: string;
  correctAnswer: string;
  options?: unknown;
};

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
  private log = logger.child({ module: 'exam-engine' });
  private examRepo: ExamRepository;
  private selectionService: SelectionService;
  private performanceService: PerformanceService;
  private answerEvaluation?: AnswerEvaluationEngine;
  private cacheInstance?: {
    get<T extends CacheValue>(key: string): Promise<T | null>;
    set(key: string, value: CacheValue, ttl?: number): Promise<void>;
    del(key: string): Promise<void>;
  };

  constructor() {
    this.examRepo = this.resolveToken(
      TOKENS.AuditLoggingExamRepo,
      () => new ExamRepository(),
      (value) => typeof (value as ExamRepository).checkIdempotency === 'function'
    );
    this.selectionService = this.resolveToken(
      TOKENS.SelectionService,
      () => new SelectionService(),
      (value) => typeof (value as SelectionService).composeExam === 'function'
    );
    this.performanceService = this.resolveToken(
      TOKENS.PerformanceService,
      () => new PerformanceService(),
      (value) => typeof (value as PerformanceService).invalidateCache === 'function'
    );
    this.answerEvaluation = undefined;
  }

  private resolveToken<T>(token: string, fallback: () => T, validate?: (value: T) => boolean): T {
    try {
      const resolved = container.get<T>(token);
      if (resolved === undefined || resolved === null) return fallback();
      if (validate && !validate(resolved)) return fallback();
      return resolved;
    } catch {
      return fallback();
    }
  }

  private async getCache() {
    if (this.cacheInstance !== undefined) return this.cacheInstance;
    const { cacheService } = await import('@/modules/core/cache.service');
    this.cacheInstance = cacheService;
    return this.cacheInstance;
  }

  private static getInstance() {
    if (this.singleton === null) this.singleton = new ExamEngine();
    return this.singleton;
  }

  private resolveAnswerForScoring(question: ScorableQuestion, answer: string): string {
    const normalizedType = normalizeQuestionType(question.type);
    const normalizedOptions = normalizeQuestionOptions(question.options);

    if (normalizedOptions.length === 0) {
      return normalizedType === 'multi_select' ? parseAnswer(answer).join(',') : answer.trim();
    }

    const answerIds = normalizedType === 'multi_select' ? parseAnswer(answer) : [answer.trim()];
    const optionById = new Map(normalizedOptions.map((option) => [option.id.toLowerCase(), option]));
    const optionByLabel = new Map(
      normalizedOptions
        .filter((option) => typeof option.label === 'string' && option.label.trim() !== '')
        .map((option) => [option.label!.toLowerCase(), option])
    );

    const resolvedAnswers = answerIds.map((answerId) => {
      const key = answerId.toLowerCase();
      const option = optionById.get(key) ?? optionByLabel.get(key);
      return option?.text ?? option?.code ?? option?.label ?? answerId;
    });

    return resolvedAnswers.join(',');
  }

  private resolveCorrectAnswerForScoring(question: ScorableQuestion): string {
    const normalizedOptions = normalizeQuestionOptions(question.options);
    const flaggedCorrect = normalizedOptions
      .filter((option) => option.isCorrect === true)
      .map((option) => option.text ?? option.code ?? option.label ?? option.id);

    return flaggedCorrect.length > 0 ? flaggedCorrect.join(',') : question.correctAnswer;
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
        if (existingKey !== null && existingKey !== undefined) {
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
              options: normalizeQuestionOptions(questions[0].options),
              codeSnippet: questions[0].codeSnippet,
              type: normalizeQuestionType(questions[0].type),
              questionType: normalizeQuestionType(questions[0].type),
              displayType: getDisplayType({
                questionText: questions[0].questionText,
                codeSnippet: questions[0].codeSnippet,
              }),
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
              options: normalizeQuestionOptions(exam.examQuestions[0].question.options),
              codeSnippet: exam.examQuestions[0].question.codeSnippet,
              type: normalizeQuestionType(exam.examQuestions[0].question.type),
              questionType: normalizeQuestionType(exam.examQuestions[0].question.type),
              displayType: getDisplayType({
                questionText: exam.examQuestions[0].question.questionText,
                codeSnippet: exam.examQuestions[0].question.codeSnippet,
              }),
              order: exam.examQuestions[0].order
            }
          : null
      };
    }
    throw new Error('Exam session resolution failed');
  }

  private async handleRaceCondition(userId: string, idempotencyKey: string) {
    const existingKey = await this.examRepo.checkIdempotency(userId, idempotencyKey);
    if (existingKey !== null && existingKey !== undefined) {
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
        const cache = await this.getCache();
        const existing = await cache.get(cacheKey).catch(() => null);
        if (existing !== null) return; 
    }

    const exam = await this.getAndCacheActiveExam(userId, examId);
    if (exam.status !== 'started') throw new Error('Exam is not active');
    if (exam.userId !== userId) throw new Error('Unauthorized');

    this.checkExamTimeLimit(exam);
    const normalizedAnswer = parseAnswer(answer).join(',');

    const liveStateKey = `exam-state:${examId}`;
    const answerPayload = {
        questionId,
        answer: normalizedAnswer,
        timestamp: new Date().toISOString(),
        idempotencyKey: idempotencyKey ?? null
    };

    // Save to Redis for fast retrieval
    {
      const cache = await this.getCache();
      await cache.set(`${liveStateKey}:q:${questionId}`, answerPayload, 1000 * 60 * 60 * 2).catch(() => null);
    }
    
    // CRITICAL FIX: Save answer to database immediately (not just Redis)
    // Fetch the exam question with question details
    const examQuestion = await this.examRepo.findQuestionByExamAndQuestion(examId, questionId);
    if (examQuestion) {
      await this.updateExamResponse(
        {
          id: examId,
          startedAt: exam.startedAt,
          lastAnsweredAt: exam.lastAnsweredAt ?? null
        },
        {
          id: examQuestion.id,
          responseMetadata: (examQuestion.responseMetadata as Record<string, unknown> | null) ?? null,
          question: examQuestion.question as ScorableQuestion
        },
        normalizedAnswer
      );
    }
    
    await withTimeout(
      this.examRepo.updateLastAnswered(examId),
      QUICK_QUERY_TIMEOUT,
      'ExamEngine.updateLastAnswered'
    );

    if (idempotencyKey !== undefined && idempotencyKey !== null && idempotencyKey !== '') {
        const cache = await this.getCache();
        await cache.set(`idem:ans:${userId}:${idempotencyKey}`, { used: true }, 1000 * 60 * 60 * 24).catch(() => null);
    }
  }

  async updateExamResponse(
    exam: { id: string; startedAt: string | Date; lastAnsweredAt?: string | Date | null },
    eqRecord: { id: string; responseMetadata?: Record<string, unknown> | null; question: ScorableQuestion },
    answer: string
  ) {
    const { AnswerEvaluationEngine } = await import('@/modules/answer-engine/answer.engine');
    if (this.answerEvaluation === undefined) {
      try {
        this.answerEvaluation = container.get(AnswerEvaluationEngine);
      } catch {
        this.answerEvaluation = new AnswerEvaluationEngine();
      }
    }

    const now = new Date();
    const startedAt = new Date(exam.startedAt).getTime();
    const lastAnsweredAt = (exam.lastAnsweredAt !== null && exam.lastAnsweredAt !== undefined) ? new Date(exam.lastAnsweredAt).getTime() : startedAt;
    const existingMetadata = (eqRecord.responseMetadata as Record<string, unknown> | null) ?? {};
    const timeSpentSeconds = typeof existingMetadata.timeSpentSeconds === 'number' ? existingMetadata.timeSpentSeconds : Math.max(0, Math.floor((now.getTime() - lastAnsweredAt) / 1000));
    const firstAnsweredAt = existingMetadata.firstAnsweredAt ?? now.toISOString();
    const normalizedType = normalizeQuestionType(eqRecord.question.type);
    const normalizedAnswer = normalizedType === 'multi_select' ? parseAnswer(answer).join(',') : answer.trim();
    const scoringAnswer = this.resolveAnswerForScoring(eqRecord.question, normalizedAnswer);
    const scoringCorrectAnswer = this.resolveCorrectAnswerForScoring(eqRecord.question);
    const isCorrect = this.answerEvaluation.evaluate(normalizedType, scoringCorrectAnswer, scoringAnswer);

    await this.examRepo.updateExamQuestionResponse(eqRecord.id, {
      userAnswer: normalizedAnswer,
      isCorrect,
      responseMetadata: { ...existingMetadata, timeSpentSeconds, firstAnsweredAt }
    });
    await this.examRepo.updateLastAnswered(exam.id);
  }

  private async getAndCacheActiveExam(userId: string, examId: string) {
    const cacheKey = `exam-header:${userId}:${examId}`;
    type ExamWithBlueprint = InferSelectModel<typeof exams> & { blueprint?: InferSelectModel<typeof examBlueprints> | null };
    const cache = await this.getCache();
    let exam: ExamWithBlueprint | null = (await cache.get<ExamWithBlueprint>(cacheKey).catch(() => null)) ?? null;

    if (exam === null) {
      const dbExam = await withTimeout(
        this.examRepo.findByIdWithBlueprint(examId),
        QUICK_QUERY_TIMEOUT,
        'ExamEngine.fetchActiveExam'
      );
      exam = (dbExam as ExamWithBlueprint) ?? null;
      if (exam !== null) await cache.set(cacheKey, exam, 1000 * 60 * 2).catch(() => null);
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
    const startTimestamp = Date.now();
    const queuesEnabled = process.env.QUEUE_ENABLED === 'true';
    const isTestEnv = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true' || process.env.VITEST_WORKER_ID !== undefined;
    
    let jobId: string | undefined;
    
    if (!queuesEnabled && !isTestEnv) {
      this.log.warn({ examId }, 'QUEUE_DISABLED: skipping queue side-effects');
    }

    let targetExamId = examId;
    if (idempotencyKey !== undefined && idempotencyKey !== null && idempotencyKey !== '') {
        try {
          if (typeof this.examRepo.checkIdempotency === 'function') {
            const existingKey = await this.examRepo.checkIdempotency(userId, `submit:${idempotencyKey}`);
            if (existingKey !== null && existingKey !== undefined) targetExamId = existingKey.examId;
          }
        } catch {
          // Best-effort idempotency 
        }
    }

    await this.performanceService.invalidateCache(targetExamId);

    
    // Phase 1: Fetch Exam & Questions (Outside Transaction)
    let examWithQuestions = await withTimeout(
      this.examRepo.findByIdWithQuestions(targetExamId),
      STANDARD_QUERY_TIMEOUT,
      'ExamEngine.completeExam.fetchMetadata'
    );
    const repoWithFindById = this.examRepo as ExamRepoWithFindById;
    if (!examWithQuestions && typeof repoWithFindById.findById === 'function') {
      const header = await repoWithFindById.findById(targetExamId);
      if (header !== undefined && header !== null) {
        examWithQuestions = { ...header, examQuestions: [] } as unknown as ExamWithQuestions;
      }
    }
    if (!examWithQuestions) {
      const rows = await db.select({
        id: exams.id,
        status: exams.status,
        userId: exams.userId,
        startedAt: exams.startedAt,
        lastAnsweredAt: exams.lastAnsweredAt,
      }).from(exams).where(eq(exams.id, targetExamId)).limit(1);
      
      if (rows.length > 0) {
        const row = rows[0];
        examWithQuestions = {
          ...row,
          startedAt: row.startedAt ?? new Date(),
          lastAnsweredAt: row.lastAnsweredAt ?? null,
          examQuestions: [],
        } as unknown as ExamWithQuestions;
      }
    }

    if (examWithQuestions === null || examWithQuestions === undefined) throw new Error('Exam not found');
    if (examWithQuestions.userId !== null && examWithQuestions.userId !== undefined && examWithQuestions.userId !== '' && userId !== examWithQuestions.userId) {
      throw new Error('Unauthorized');
    }
    if (['completed', 'processing', 'failed', 'abandoned'].includes(examWithQuestions.status)) {
        return { examId: targetExamId, status: examWithQuestions.status };
    }

    const examQuestionsList = examWithQuestions.examQuestions ?? [];
    
    // Phase 2: Parallel Redis Fetch (OUTSIDE any transaction)
    const liveStatePrefix = `exam-state:${targetExamId}:q:`;
    const cache = await this.getCache();
    
    const answersToFlush = await Promise.all(
        examQuestionsList.map(async (eqRecord) => {
            const cached = await cache.get<{ answer: string }>(`${liveStatePrefix}${eqRecord.questionId}`).catch(() => null);
            return { eqRecord, cachedAnswer: cached?.answer ?? null };
        })
    );

    // Phase 3: Fast Atomic DB Updates inside Transaction
    try {
        await db.transaction(async (tx) => {
            // Standard query builder (Immune to fullSchema TypeErrors during bundling)
            const rows = await tx.select({ status: exams.status })
                .from(exams)
                .where(eq(exams.id, targetExamId))
                .limit(1);
            
            const txStatusCheck = rows[0] ?? null;
            
            if (txStatusCheck?.status === 'processing' || txStatusCheck?.status === 'completed') return;

            for (const { eqRecord, cachedAnswer } of answersToFlush) {
                if (cachedAnswer !== null && cachedAnswer !== '') {
                    const now = new Date();
                    const startedAt = examWithQuestions.startedAt !== null && examWithQuestions.startedAt !== undefined
                      ? new Date(examWithQuestions.startedAt)
                      : new Date();
                    const lastTime = examWithQuestions.lastAnsweredAt 
                        ? new Date(examWithQuestions.lastAnsweredAt).getTime() 
                        : startedAt.getTime();
                    
                    interface ResponseMetadata {
                        timeSpentSeconds?: number;
                        firstAnsweredAt?: string;
                    }
                    
                    const existingMetadata = (eqRecord.responseMetadata as ResponseMetadata | null) ?? {};
                    const timeSpentSeconds = existingMetadata.timeSpentSeconds ?? Math.max(0, Math.floor((now.getTime() - lastTime) / 1000));

                    await tx.update(examQuestions)
                        .set({
                            userAnswer: cachedAnswer, 
                            isCorrect: null, 
                            responseMetadata: { 
                                ...existingMetadata, 
                                timeSpentSeconds, 
                                firstAnsweredAt: existingMetadata.firstAnsweredAt ?? now.toISOString() 
                            } 
                        })
                        .where(eq(examQuestions.id, eqRecord.id));
                }
            }
            
            await tx.update(exams)
                .set({ status: 'processing', lastAnsweredAt: new Date() })
                .where(eq(exams.id, targetExamId));

            if (idempotencyKey !== undefined && idempotencyKey !== null && idempotencyKey !== '') {
                await tx.insert(idempotencyKeys)
                    .values({ userId, key: `submit:${idempotencyKey}`, examId: targetExamId })
                    .onConflictDoNothing();
            }
        });

        const durationMs = Date.now() - startTimestamp;
        this.log.info({ examId: targetExamId, durationMs }, '[ExamEngine] Submission transaction completed');

    } catch (e) {
        this.log.error({ err: e, examId: targetExamId }, '[ExamEngine] Fatal transaction collapse in completeExam');
        throw e;
    }

    if (jobId === undefined) {
      const useQstash = typeof process.env.QSTASH_TOKEN === 'string' && process.env.QSTASH_TOKEN.trim() !== '';
      if (queuesEnabled) {
        const { ExamSaga } = await import('./exam.saga');
        jobId = await ExamSaga.start(targetExamId, userId);
      } else if (isTestEnv || useQstash) {
        const { JobsService } = await import('@/modules/system/jobs.service');
        const { JobOrchestrator } = await import('@/modules/system/job-orchestrator');
        const { JobType } = await import('@quiz/types');
        const job = await JobsService.createJob({
          userId,
          type: JobType.EXAM_SAGA,
          payload: { examId: targetExamId },
        });
        jobId = job?.id;
        if (!jobId) {
          this.log.warn({ examId: targetExamId, userId }, '[ExamEngine] Failed to create saga job');
          return { examId: targetExamId, status: 'processing', jobId };
        }
        if (useQstash) {
          const { queueService } = await import('@/modules/core/queue.service');
          const enqueueResult = await queueService.enqueue('exam_saga', { jobId, userId, examId: targetExamId });
          if (!enqueueResult.success) {
            void JobOrchestrator.runJob(jobId, userId);
          }
        } else {
          void JobOrchestrator.runJob(jobId, userId);
        }
      } else {
        const { ScoringEngine } = await import('@/modules/scoring-engine/scoring.engine');
        try {
          await ScoringEngine.calculateExamResults(targetExamId);
          return { examId: targetExamId, status: 'completed', jobId };
        } catch (error) {
          this.log.error({ err: error, examId: targetExamId }, '[ExamEngine] Inline scoring fallback failed');
        }
      }
    }

    return { examId: targetExamId, status: 'processing', jobId };
  }
}
