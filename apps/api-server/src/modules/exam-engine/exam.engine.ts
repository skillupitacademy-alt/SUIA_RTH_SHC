import type { examBlueprints } from '@quiz/db';
import { exams } from '@quiz/db';
import { JobType } from '@quiz/types';
import type { InferSelectModel } from 'drizzle-orm';

import { logger } from '@/lib/logger';
import { AnswerEvaluationEngine } from '@/modules/answer-engine/answer.engine';
import { cacheService } from '@/modules/core/cache.service';
import { SelectionService } from '@/modules/selection-engine/selection.service';
import { JobOrchestrator } from '@/modules/system/job-orchestrator';
import { JobsService } from '@/modules/system/jobs.service';

import { PerformanceService } from '../report-engine/performance.service';
import { ExamRepository } from './repositories/exam.repository';

const examRepo = new ExamRepository();

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
      // 1. Idempotency Check
      if (idempotencyKey !== undefined && idempotencyKey !== null && idempotencyKey !== '') {
        const existingKey = await examRepo.checkIdempotency(userId, idempotencyKey);

        if (existingKey) {
          return await this.resumeExamSession(existingKey.examId);
        }
      }

      // 2. Selection Phase
      const { questions, blueprint } = await SelectionService.composeExam(userId, blueprintOrDomainId, (idempotencyKey !== undefined && idempotencyKey !== null && idempotencyKey !== '') ? idempotencyKey : 'no-key', config);

      // 3. Persistence Phase (Handled by Repository Transactionally)
      const exam = await examRepo.createExamWithQuestions({
          userId,
          blueprintId: blueprint.id === 'transient' ? null : blueprint.id,
          status: 'started',
          durationSeconds: (blueprint.timeLimit !== undefined && blueprint.timeLimit !== null) ? blueprint.timeLimit * 60 : null,
          questions: questions as { id: string }[],
          idempotencyKey: idempotencyKey ?? undefined
      });

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
    } catch (_error: unknown) {
      const isPostgresError = typeof _error === 'object' && _error !== null && 'code' in _error && 'message' in _error;
      if (isPostgresError && (_error as {code: string; message: string}).code === '23505' && (_error as {code: string; message: string}).message.includes('unq_user_key')) {
        return await this.handleRaceCondition(userId, idempotencyKey!);
      }
      throw _error;
    }
  }

  private static async resumeExamSession(examId: string) {
    const exam = await examRepo.findByIdWithQuestions(examId);

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
    const existingKey = await examRepo.checkIdempotency(userId, idempotencyKey);
    if (existingKey !== undefined) {
       return await this.resumeExamSession(existingKey.examId);
    }
    throw new Error('Collision recovery failed');
  }

  /**
   * Handles individual question submission within an exam.
   */
  static async submitAnswer(examId: string, questionId: string, answer: string, userId: string, idempotencyKey?: string) {
    // Phase 5: Offload high-frequency idempotency to Redis
    if (idempotencyKey !== undefined && idempotencyKey !== null && idempotencyKey !== '') {
        const cacheKey = `idem:ans:${userId}:${idempotencyKey}`;
        const existing = await cacheService.get(cacheKey).catch(() => null);
        if (existing !== null) return; 
    }

    const exam = await this.getAndCacheActiveExam(userId, examId);
    if (exam.status !== 'started') throw new Error('Exam is not active');
    if (exam.userId !== userId) throw new Error('Unauthorized');

    this.checkExamTimeLimit(exam);

    // Phase 3: Hyper-Scale Live State. Instead of immediate Postgres write, we stage in Redis.
    const liveStateKey = `exam-state:${examId}`;
    const answerPayload = {
        questionId,
        answer,
        timestamp: new Date().toISOString(),
        idempotencyKey: idempotencyKey ?? null
    };

    // Store in a Redis Hash for O(1) attribute access per question
    await cacheService.set(`${liveStateKey}:q:${questionId}`, answerPayload, 1000 * 60 * 60 * 2).catch(() => null);
    
    // We still update the 'lastAnsweredAt' in Postgres to keep session alive
    await examRepo.updateLastAnswered(examId);

    if (idempotencyKey !== undefined && idempotencyKey !== null && idempotencyKey !== '') {
        await cacheService.set(`idem:ans:${userId}:${idempotencyKey}`, { used: true }, 1000 * 60 * 60 * 24).catch(() => null);
    }
  }

  private static async getAndCacheActiveExam(userId: string, examId: string) {
    const cacheKey = `exam-header:${userId}:${examId}`;
    type ExamWithBlueprint = InferSelectModel<typeof exams> & { blueprint?: InferSelectModel<typeof examBlueprints> | null };
    let exam: ExamWithBlueprint | null = (await cacheService.get<ExamWithBlueprint>(cacheKey).catch(() => null)) ?? null;

    if (exam === null) {
      const dbExam = await examRepo.findByIdWithBlueprint(examId);
      exam = dbExam ?? null;
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
    exam: InferSelectModel<typeof exams>, 
    eqRecord: { 
        id: string; 
        responseMetadata: Record<string, unknown> | null; 
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

    await examRepo.updateExamQuestionResponse(eqRecord.id, { 
        userAnswer: answer, isCorrect, 
        responseMetadata: { ...existingMetadata, timeSpentSeconds, firstAnsweredAt: existingMetadata.firstAnsweredAt ?? now.toISOString() } 
    });

    await examRepo.updateLastAnswered(exam.id, now);
  }

  /**
   * Finalizes the exam and triggers scoring.
   */
  static async completeExam(examId: string, userId: string, idempotencyKey?: string) {
    let targetExamId = examId;
    if (idempotencyKey !== undefined && idempotencyKey !== null && idempotencyKey !== '') {
        const existingKey = await examRepo.checkIdempotency(userId, `submit:${idempotencyKey}`);
        if (existingKey) targetExamId = existingKey.examId;
    }

    // Phase 1: Invalidate cache immediately on submission
    await PerformanceService.invalidateCache(targetExamId);

    const fullExam = await examRepo.findById(targetExamId);
    if (!fullExam) throw new Error('Exam not found');
    if (fullExam.userId !== userId) throw new Error('Unauthorized');

    if (['completed', 'processing', 'failed', 'abandoned'].includes(fullExam.status)) {
        return { examId: targetExamId, status: fullExam.status };
    }

    const updated = await examRepo.updateStatus(targetExamId, 'processing');

    let jobId: string | undefined;

    if (updated.length > 0) {
        // Phase 3: Flush stored answers from Redis to Postgres
        try {
            const liveStatePrefix = `exam-state:${targetExamId}:q:`;
            
            const examWithQuestions = await examRepo.findByIdWithQuestions(targetExamId);

            if (examWithQuestions?.examQuestions) {
                // Use the main DB instance for the batch update
                for (const eqRecord of examWithQuestions.examQuestions) {
                    const cached = await cacheService.get<{ answer: string }>(`${liveStatePrefix}${eqRecord.questionId}`);
                    if (cached !== null && cached !== undefined && cached.answer !== undefined && cached.answer !== null && cached.answer !== '') {
                        await this.updateExamResponse(
                          fullExam,
                          {
                            id: eqRecord.id,
                            responseMetadata: (eqRecord.responseMetadata as Record<string, unknown> | null) ?? null,
                            question: {
                              type: eqRecord.question.type,
                              correctAnswer: eqRecord.question.correctAnswer,
                            },
                          },
                          cached.answer
                        );
                    }
                }
            }
        } catch (e) {
            logger.error({ err: e, examId: targetExamId }, '[ExamEngine] Failed to flush Redis answers to DB');
        }

        if (idempotencyKey !== undefined && idempotencyKey !== null && idempotencyKey !== '') {
            await examRepo.recordIdempotency({ userId, key: `submit:${idempotencyKey}`, examId: targetExamId });
        }
        const job = await JobsService.createJob({
            userId,
            type: JobType.EXAM_SCORING,
            payload: { examId: targetExamId }
        });
        jobId = job.id;
        
        // Phase 2: Hyper-Scale Async via Message Queue (QStash)
        const isQueueEnabled = process.env.QSTASH_TOKEN !== undefined;
        
        if (isQueueEnabled) {
            const { queueService } = await import('../core/queue.service');
            const enqueued = await queueService.enqueue(JobType.EXAM_SCORING, { jobId: job.id, userId, examId: targetExamId });
            
            if (!enqueued.success) {
                // Fallback to local async if queue fails
                void JobOrchestrator.runJob(job.id, userId);
            }
        } else {
            // Local Async Fallback (Standard Node process)
            void JobOrchestrator.runJob(job.id, userId);
        }
    }


    return { examId: targetExamId, status: 'processing', jobId };
  }
}
