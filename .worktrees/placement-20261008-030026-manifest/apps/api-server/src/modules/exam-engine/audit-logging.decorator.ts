import { logger } from '@/lib/logger';

import { ExamRepository } from './repositories/exam.repository';

/**
 * Decorator for ExamRepository to add Audit Logging side-effects.
 * Following the Decorator pattern while maintaining the same interface.
 */
export class AuditLoggingExamRepository extends ExamRepository {
  private auditLog = logger.child({ module: 'exam-engine:audit' });

  constructor(private readonly baseRepo: ExamRepository) {
      super();
  }

  override async findById(id: string) {
    return this.baseRepo.findById(id);
  }

  override async findActiveExam(id: string, userId: string) {
    return this.baseRepo.findActiveExam(id, userId);
  }

  override async findByIdWithBlueprint(id: string) {
    return this.baseRepo.findByIdWithBlueprint(id);
  }

  override async findByIdWithQuestions(id: string) {
    return this.baseRepo.findByIdWithQuestions(id);
  }

  override async updateLastAnswered(id: string, date: Date = new Date()) {
    return this.baseRepo.updateLastAnswered(id, date);
  }

  override async updateStatus(id: string, status: "started" | "processing" | "completed" | "abandoned" | "failed") {
    this.auditLog.info({ examId: id, newStatus: status, timestamp: new Date() }, 'AUDIT: Exam status transition');
    return this.baseRepo.updateStatus(id, status);
  }

  override async updateExamQuestionResponse(id: string, data: {
    userAnswer: string;
    isCorrect: boolean;
    responseMetadata: Record<string, unknown>;
  }) {
    this.auditLog.debug({ examQuestionId: id, isCorrect: data.isCorrect }, 'AUDIT: Question response recorded');
    return this.baseRepo.updateExamQuestionResponse(id, data);
  }

  override async checkIdempotency(userId: string, key: string) {
    return this.baseRepo.checkIdempotency(userId, key);
  }

  override async createExamWithQuestions(
    data: Parameters<ExamRepository['createExamWithQuestions']>[0]
  ) {
    return this.baseRepo.createExamWithQuestions(data);
  }

  override async recordIdempotency(data: { userId: string; key: string; examId: string }) {
    return this.baseRepo.recordIdempotency(data);
  }
}
