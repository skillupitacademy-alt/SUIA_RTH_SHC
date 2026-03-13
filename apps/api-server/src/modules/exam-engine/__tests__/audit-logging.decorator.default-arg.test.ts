import { describe, expect, it, vi } from 'vitest';

import { AuditLoggingExamRepository } from '../audit-logging.decorator';
import type { ExamRepository } from '../repositories/exam.repository';

describe('AuditLoggingExamRepository default args', () => {
  it('uses the default date when updateLastAnswered is called without one', async () => {
    const baseRepo = {
      updateLastAnswered: vi.fn().mockResolvedValue(undefined)
    } as unknown as ExamRepository;

    const repo = new AuditLoggingExamRepository(baseRepo);
    await repo.updateLastAnswered('exam-1');

    expect(baseRepo.updateLastAnswered).toHaveBeenCalledTimes(1);
    const dateArg = baseRepo.updateLastAnswered.mock.calls[0]?.[1];
    expect(dateArg).toBeInstanceOf(Date);
  });
});
