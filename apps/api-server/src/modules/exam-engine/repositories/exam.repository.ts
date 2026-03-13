import { db, examBlueprints, examQuestions, exams, idempotencyKeys, questions, QUICK_QUERY_TIMEOUT, STANDARD_QUERY_TIMEOUT, withTimeout as dbWithTimeout } from '@quiz/db';
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
      const rows = await this.withTimeoutFn(
          this.dbInstance.select()
              .from(exams)
              .where(and(
                  eq(exams.id, id),
                  eq(exams.userId, userId)
              ))
              .limit(1),
          QUICK_QUERY_TIMEOUT,
          'ExamRepository.findActiveExam'
      );
      return rows[0] ?? null;
  }

  async findByIdWithBlueprint(id: string) {
    const rows = await this.withTimeoutFn(
      this.dbInstance.select({
        exam: exams,
        blueprint: examBlueprints
      })
      .from(exams)
      .leftJoin(examBlueprints, eq(exams.blueprintId, examBlueprints.id))
      .where(eq(exams.id, id))
      .limit(1),
      QUICK_QUERY_TIMEOUT,
      'ExamRepository.findByIdWithBlueprint'
    );
    if (rows.length === 0) return null;
    return { ...rows[0].exam, blueprint: rows[0].blueprint };
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
    const rows = await this.withTimeoutFn(
      this.dbInstance.select({
        examQuestion: examQuestions,
        question: questions
      })
      .from(examQuestions)
      .innerJoin(questions, eq(examQuestions.questionId, questions.id))
      .where(and(
        eq(examQuestions.examId, examId),
        eq(examQuestions.questionId, questionId)
      ))
      .limit(1),
      QUICK_QUERY_TIMEOUT,
      'ExamRepository.findQuestionByExamAndQuestion'
    );
    if (rows.length === 0) return null;
    return { ...rows[0].examQuestion, question: rows[0].question };
  }

  async findByIdWithQuestions(id: string) {
    const examRows = await this.withTimeoutFn(
        this.dbInstance.select().from(exams).where(eq(exams.id, id)).limit(1),
        STANDARD_QUERY_TIMEOUT,
        'ExamRepository.findByIdWithQuestions.exam'
    );
    if (examRows.length === 0) return null;

    const questionRows = await this.withTimeoutFn(
        this.dbInstance.select({
            examQuestion: examQuestions,
            question: questions
        })
        .from(examQuestions)
        .innerJoin(questions, eq(examQuestions.questionId, questions.id))
        .where(eq(examQuestions.examId, id)),
        STANDARD_QUERY_TIMEOUT,
        'ExamRepository.findByIdWithQuestions.questions'
    );

    return {
        ...examRows[0],
        examQuestions: questionRows.map(r => ({
            ...r.examQuestion,
            question: r.question
        }))
    };
  }

  async checkIdempotency(userId: string, key: string) {
    const rows = await this.withTimeoutFn(
      this.dbInstance.select().from(idempotencyKeys).where(and(
        eq(idempotencyKeys.userId, userId),
        eq(idempotencyKeys.key, key)
      )).limit(1),
      QUICK_QUERY_TIMEOUT,
      'ExamRepository.checkIdempotency'
    );
    return rows[0] ?? null;
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
    const rows = await this.withTimeoutFn(
      this.dbInstance.select({
        exam: exams,
        blueprint: examBlueprints
      })
      .from(exams)
      .leftJoin(examBlueprints, eq(exams.blueprintId, examBlueprints.id))
      .where(and(
        eq(exams.userId, userId),
        statusFilter !== undefined && statusFilter !== null
          ? eq(exams.status, statusFilter)
          : undefined
      ))
      .limit(options.limit ?? 50)
      .orderBy(desc(exams.startedAt)),
      STANDARD_QUERY_TIMEOUT,
      'ExamRepository.findByUserId'
    );
    return rows.map(r => ({ ...r.exam, blueprint: r.blueprint }));
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
