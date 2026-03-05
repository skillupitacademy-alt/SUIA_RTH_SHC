import { describe, it, expect, vi } from 'vitest';

import { cacheService } from '@/modules/core/cache.service';
import { PerformanceService } from '@/modules/report-engine/performance.service';
import { ExamEngine } from '../exam.engine';
import { ExamRepository } from '../repositories/exam.repository';
import { AnswerEvaluationEngine } from '@/modules/answer-engine/answer.engine';
import { container } from '@/modules/core/container';

describe('ExamEngine remaining branches', () => {
  it('resumeExamSession returns null firstQuestion when missing question', async () => {
    vi.spyOn(ExamRepository.prototype, 'findByIdWithQuestions').mockResolvedValue({
      id: 'e1',
      status: 'started',
      durationSeconds: 120,
      startedAt: new Date().toISOString(),
      examQuestions: [{ order: 1, question: null }],
    } as any);

    const res = await (container.get(ExamEngine) as any).resumeExamSession('e1');
    expect(res.firstQuestion).toBeNull();
  });

  it('updateExamResponse handles existing metadata timeSpentSeconds path', async () => {
    vi.spyOn(AnswerEvaluationEngine.prototype, 'evaluate').mockReturnValue(true);
    vi.spyOn(ExamRepository.prototype, 'updateExamQuestionResponse').mockResolvedValue(undefined as any);
    vi.spyOn(ExamRepository.prototype, 'updateLastAnswered').mockResolvedValue(undefined as any);

    const eqRecord = {
      id: 'eq1',
      responseMetadata: { timeSpentSeconds: 5, firstAnsweredAt: 'iso' },
      question: { type: 'mcq', correctAnswer: 'A' },
    };

    await (container.get(ExamEngine) as any).updateExamResponse(
      { id: 'e1', startedAt: new Date().toISOString(), lastAnsweredAt: new Date().toISOString() },
      eqRecord,
      'A'
    );
  });

  it('completeExam handles idempotency key remap and zero-updated rows', async () => {
    vi.spyOn(PerformanceService.prototype, 'invalidateCache').mockResolvedValue(undefined as any);
    vi.spyOn(ExamRepository.prototype, 'checkIdempotency').mockResolvedValue({ examId: 'mapped' } as any);
    vi.spyOn(ExamRepository.prototype, 'findById').mockResolvedValue({ id: 'mapped', userId: 'u1', status: 'started' } as any);
    vi.spyOn(ExamRepository.prototype, 'updateStatus').mockResolvedValue([] as any);

    const res = await container.get(ExamEngine).completeExam('orig', 'u1', 'idem');
    expect(res.examId).toBe('mapped');
    expect(res.status).toBe('processing');
  });
});
