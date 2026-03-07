import { describe, it, expect, vi } from 'vitest';
import { AuditLoggingExamRepository } from '@/modules/exam-engine/audit-logging.decorator';

vi.mock('@/lib/logger', () => ({ logger: { child: vi.fn(() => ({ info: vi.fn(), debug: vi.fn() })) } }));

class FakeRepo {
  updateStatus = vi.fn(async () => 'updated');
  updateExamQuestionResponse = vi.fn(async () => 'logged');
}

describe('AuditLoggingExamRepository coverage', () => {
  it('logs and delegates status update', async () => {
    const base = new FakeRepo();
    const repo = new AuditLoggingExamRepository(base as any);
    const res = await repo.updateStatus('e1', 'processing');
    expect(res).toBe('updated');
    expect(base.updateStatus).toHaveBeenCalledWith('e1', 'processing');
  });

  it('logs question response update', async () => {
    const base = new FakeRepo();
    const repo = new AuditLoggingExamRepository(base as any);
    const res = await repo.updateExamQuestionResponse('eq1', { userAnswer: 'A', isCorrect: true, responseMetadata: {} });
    expect(res).toBe('logged');
    expect(base.updateExamQuestionResponse).toHaveBeenCalled();
  });

  it('delegates findActiveExam', async () => {
    const base = new FakeRepo();
    base.findActiveExam = vi.fn(async (id, userId) => ({ id, userId }));
    const repo = new AuditLoggingExamRepository(base as any);
    const res = await repo.findActiveExam('e1', 'u1');
    expect(res).toEqual({ id: 'e1', userId: 'u1' });
    expect(base.findActiveExam).toHaveBeenCalledWith('e1', 'u1');
  });
});
