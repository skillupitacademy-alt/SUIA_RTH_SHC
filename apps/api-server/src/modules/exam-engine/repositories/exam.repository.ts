import { db, examQuestions, exams, idempotencyKeys, QUICK_QUERY_TIMEOUT, STANDARD_QUERY_TIMEOUT, withTimeout as dbWithTimeout } from '@quiz/db';
import { and, desc, eq } from 'drizzle-orm';

import { BaseRepository } from '@/modules/core/repositories/base.repository';

export interface Exam {
  id: string;
  userId: string;
  blueprintId: string | null;
  status: "started" | "processing" | "completed" | "abandoned" | "failed";
  durationSeconds: number | null;
  totalScore: number;
  startedAt: Date;
  lastAnsweredAt: Date | null;
  completedAt: Date | null;
  reportMaterialized: unknown;
}

export class ExamRepository extends BaseRepository<Exam, typeof exams> {
  protected table = exams;
  private withTimeoutFn = dbWithTimeout ?? (async <T>(promise: Promise<T>) => promise);

  constructor(dbInstance: typeof db = db) {
    super(dbInstance);
  }

  withDb(dbClient: typeof db): this {
    return new ExamRepository(dbClient) as this;
  }

  async findActiveExam(id: string, userId: string) {
      return await this.withTimeoutFn(
          this.dbInstance.query.exams.findFirst({
            where: and(
                eq(exams.id, id),
                eq(exams.userId, userId)
            )
          }),
          QUICK_QUERY_TIMEOUT,
          'ExamRepository.findActiveExam'
      );
  }

  async findByIdWithBlueprint(id: string) {
    return await this.withTimeoutFn(
      this.dbInstance.query.exams.findFirst({
        where: eq(exams.id, id),
        with: { blueprint: true }
      }),
      QUICK_QUERY_TIMEOUT,
      'ExamRepository.findByIdWithBlueprint'
    );
  }

  async updateLastAnswered(id: string, date: Date = new Date()) {
    await this.withTimeoutFn(
      this.dbInstance.update(exams)
        .set({ lastAnsweredAt: date })
        .where(eq(exams.id, id)),
      QUICK_QUERY_TIMEOUT,
      'ExamRepository.updateLastAnswered'
    );
  }

  async updateStatus(id: string, status: "started" | "processing" | "completed" | "abandoned" | "failed") {
    return await this.withTimeoutFn(
      this.dbInstance.update(exams)
        .set({ status })
        .where(eq(exams.id, id))
        .returning({ id: exams.id }),
      QUICK_QUERY_TIMEOUT,
      'ExamRepository.updateStatus'
    );
  }

  async updateExamQuestionResponse(id: string, data: {
    userAnswer: string;
    isCorrect: boolean;
    responseMetadata: Record<string, unknown>;
  }) {
    await this.withTimeoutFn(
      this.dbInstance.update(examQuestions)
        .set({
          userAnswer: data.userAnswer,
          isCorrect: data.isCorrect,
          responseMetadata: data.responseMetadata
        })
        .where(eq(examQuestions.id, id)),
      QUICK_QUERY_TIMEOUT,
      'ExamRepository.updateExamQuestionResponse'
    );
  }

  async findQuestionByExamAndQuestion(examId: string, questionId: string) {
    return await this.withTimeoutFn(
      this.dbInstance.query.examQuestions.findFirst({
        where: and(
          eq(examQuestions.examId, examId),
          eq(examQuestions.questionId, questionId)
        ),
        with: {
          question: true
        }
      }),
      QUICK_QUERY_TIMEOUT,
      'ExamRepository.findQuestionByExamAndQuestion'
    );
  }

  async findByIdWithQuestions(id: string) {
    return await this.withTimeoutFn(
      this.dbInstance.query.exams.findFirst({
        where: eq(exams.id, id),
        with: {
          examQuestions: {
            with: {
              question: true,
            },
          },
        },
      }),
      STANDARD_QUERY_TIMEOUT,
      'ExamRepository.findByIdWithQuestions'
    );
  }

  async checkIdempotency(userId: string, key: string) {
    return await this.withTimeoutFn(
      this.dbInstance.query.idempotencyKeys.findFirst({
        where: and(
          eq(idempotencyKeys.userId, userId),
          eq(idempotencyKeys.key, key)
        ),
      }),
      QUICK_QUERY_TIMEOUT,
      'ExamRepository.checkIdempotency'
    );
  }

  async createExamWithQuestions(data: {
    userId: string;
    blueprintId: string | null;
    status: 'started';
    durationSeconds: number | null;
    questions: { id: string }[];
    idempotencyKey?: string;
  }) {
    return await this.withTimeoutFn(
      this.dbInstance.transaction(async (tx) => {
        const [exam] = await (tx.insert(exams).values({
          userId: data.userId,
          blueprintId: data.blueprintId,
          status: data.status,
          durationSeconds: data.durationSeconds,
          totalScore: 0,
        }).returning() as unknown as Exam[]);

        const examQuestionsData = data.questions.map((q, index) => ({
          examId: exam.id,
          questionId: q.id,
          order: index + 1,
        }));

        await tx.insert(examQuestions).values(examQuestionsData);

        if (data.idempotencyKey !== undefined && data.idempotencyKey !== null && data.idempotencyKey !== '') {
          await tx.insert(idempotencyKeys).values({
            userId: data.userId,
            key: data.idempotencyKey,
            examId: exam.id,
          });
        }

        return exam;
      }),
      STANDARD_QUERY_TIMEOUT,
      'ExamRepository.createExamWithQuestions'
    );
  }

  async recordIdempotency(data: { userId: string; key: string; examId: string }) {
    await this.withTimeoutFn(
      this.dbInstance.insert(idempotencyKeys).values({
        userId: data.userId,
        key: data.key,
        examId: data.examId,
      }).onConflictDoNothing(),
      QUICK_QUERY_TIMEOUT,
      'ExamRepository.recordIdempotency'
    );
  }

  async findByUserId(userId: string, options: { status?: string; limit?: number } = {}) {
    const statusFilter = (options.status as ("started" | "processing" | "completed" | "abandoned" | "failed") | undefined);
    return await this.withTimeoutFn(
      this.dbInstance.query.exams.findMany({
        where: and(
          eq(exams.userId, userId),
          statusFilter !== undefined && statusFilter !== null
            ? eq(exams.status, statusFilter)
            : undefined
        ),
        limit: options.limit,
        orderBy: [desc(exams.startedAt)],
        with: { blueprint: true }
      }),
      STANDARD_QUERY_TIMEOUT,
      'ExamRepository.findByUserId'
    );
  }

  async updateAnswerByExamAndQuestion(examId: string, questionId: string, answer: string, isCorrect: boolean, metadata: Record<string, unknown>) {
    await this.withTimeoutFn(
      this.dbInstance.update(examQuestions)
        .set({
          userAnswer: answer,
          isCorrect,
          responseMetadata: metadata,
        })
        .where(
          and(
            eq(examQuestions.examId, examId),
            eq(examQuestions.questionId, questionId)
          )
        ),
      QUICK_QUERY_TIMEOUT,
      'ExamRepository.updateAnswerByExamAndQuestion'
    );
  }
}
