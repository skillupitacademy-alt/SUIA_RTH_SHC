import { db, examQuestions, exams, idempotencyKeys } from '@quiz/db';
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

  constructor(dbInstance: typeof db = db) {
    super(dbInstance);
  }

  withDb(dbClient: typeof db): this {
    return new ExamRepository(dbClient) as this;
  }

  async findActiveExam(id: string, userId: string) {
      return await this.dbInstance.query.exams.findFirst({
            where: and(
                eq(exams.id, id),
                eq(exams.userId, userId)
            )
        });
  }

  async findByIdWithBlueprint(id: string) {
    return await this.dbInstance.query.exams.findFirst({
      where: eq(exams.id, id),
      with: { blueprint: true }
    });
  }

  async updateLastAnswered(id: string, date: Date = new Date()) {
    await this.dbInstance.update(exams)
      .set({ lastAnsweredAt: date })
      .where(eq(exams.id, id));
  }

  async updateStatus(id: string, status: "started" | "processing" | "completed" | "abandoned" | "failed") {
    return await this.dbInstance.update(exams)
      .set({ status })
      .where(eq(exams.id, id))
      .returning({ id: exams.id });
  }

  async updateExamQuestionResponse(id: string, data: {
    userAnswer: string;
    isCorrect: boolean;
    responseMetadata: Record<string, unknown>;
  }) {
    await this.dbInstance.update(examQuestions)
      .set({
        userAnswer: data.userAnswer,
        isCorrect: data.isCorrect,
        responseMetadata: data.responseMetadata
      })
      .where(eq(examQuestions.id, id));
  }

  async findByIdWithQuestions(id: string) {
    return await this.dbInstance.query.exams.findFirst({
      where: eq(exams.id, id),
      with: {
        examQuestions: {
          with: {
            question: true,
          },
        },
      },
    });
  }

  async checkIdempotency(userId: string, key: string) {
    return await this.dbInstance.query.idempotencyKeys.findFirst({
      where: and(
        eq(idempotencyKeys.userId, userId),
        eq(idempotencyKeys.key, key)
      ),
    });
  }

  async createExamWithQuestions(data: {
    userId: string;
    blueprintId: string | null;
    status: 'started';
    durationSeconds: number | null;
    questions: { id: string }[];
    idempotencyKey?: string;
  }) {
    return await this.dbInstance.transaction(async (tx) => {
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
    });
  }

  async recordIdempotency(data: { userId: string; key: string; examId: string }) {
    await this.dbInstance.insert(idempotencyKeys).values({
      userId: data.userId,
      key: data.key,
      examId: data.examId,
    }).onConflictDoNothing();
  }

  async findByUserId(userId: string, options: { status?: string; limit?: number } = {}) {
    const statusFilter = (options.status as ("started" | "processing" | "completed" | "abandoned" | "failed") | undefined);
    return await this.dbInstance.query.exams.findMany({
      where: and(
        eq(exams.userId, userId),
        statusFilter !== undefined && statusFilter !== null
          ? eq(exams.status, statusFilter)
          : undefined
      ),
      limit: options.limit,
      orderBy: [desc(exams.startedAt)],
      with: { blueprint: true }
    });
  }
}
