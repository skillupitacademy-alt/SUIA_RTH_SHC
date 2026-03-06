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

  override async updateStatus(id: string, status: "started" | "processing" | "completed" | "abandoned" | "failed") {
    this.auditLog.info({ examId: id, newStatus: status, timestamp: new Date() }, 'AUDIT: Exam status transition');
    return this.baseRepo.updateStatus(id, status);
  }

  override async updateExamQuestionResponse(id: string, data: {
    userAnswer: string;
    isCorrect: boolean;
    responseMetadata: Record<string, unknown>;
  }) {
    // Specifically log if an answer was changed or flagged (metadata dependent)
    this.auditLog.debug({ examQuestionId: id, isCorrect: data.isCorrect }, 'AUDIT: Question response recorded');
    return this.baseRepo.updateExamQuestionResponse(id, data);
  }

  // Delegate other methods to baseRepo if needed, 
  // though since we extend ExamRepository, it's easier to just wrap the key methods.
}
