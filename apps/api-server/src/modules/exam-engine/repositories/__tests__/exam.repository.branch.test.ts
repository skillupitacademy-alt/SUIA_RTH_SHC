import { describe, expect, it, vi } from 'vitest';

vi.mock('@quiz/db', () => {
  const returning = (val: any) => vi.fn().mockResolvedValue([val]);

  const update = vi.fn(() => ({
    set: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: returning({ id: 'exam1' }),
      })),
    })),
  }));

  const insert = vi.fn(() => ({
    values: vi.fn(() => ({
      returning: returning({ id: 'exam1', questionId: 'q1', order: 1 }),
      onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
    })),
  }));

  const query = {
    exams: {
      findFirst: vi.fn().mockResolvedValue({ id: 'exam1', status: 'started', examId: 'exam1' }),
    },
    idempotencyKeys: {
      findFirst: vi.fn().mockResolvedValue(null),
    },
  };

  const transaction = vi.fn(async (cb: any) => cb({ insert, update }));

  const db = { update, insert, query, transaction } as any;

  return {
    db,
    exams: { id: 'exams.id', status: 'exams.status', userId: 'exams.userId' } as any,
    examQuestions: { id: 'eq.id' } as any,
    idempotencyKeys: { userId: 'ik.userId', key: 'ik.key', examId: 'ik.examId' } as any,
  };
});

import { ExamRepository } from '../exam.repository';

describe('ExamRepository branch coverage', () => {
  it('updateStatus and findActiveExam return values', async () => {
    const repo = new ExamRepository();
    const updated = await repo.updateStatus('exam1', 'processing');
    expect(updated[0]?.id).toBe('exam1');

    const active = await repo.findActiveExam('exam1', 'u1');
    expect(active?.id).toBe('exam1');
  });

  it('createExamWithQuestions handles idempotency key and question insert', async () => {
    const repo = new ExamRepository();
    const exam = await repo.createExamWithQuestions({
      userId: 'u1',
      blueprintId: 'b1',
      status: 'started',
      durationSeconds: 60,
      questions: [{ id: 'q1' }],
      idempotencyKey: 'idem',
    });
    expect(exam.id).toBe('exam1');
  });

  it('createExamWithQuestions skips idempotency insert when key empty and recordIdempotency writes row', async () => {
    const repo = new ExamRepository();
    await expect(
      repo.createExamWithQuestions({
        userId: 'u1',
        blueprintId: null,
        status: 'started',
        durationSeconds: null,
        questions: [{ id: 'q2' }],
        idempotencyKey: '',
      }),
    ).resolves.toMatchObject({ id: 'exam1' });

    await expect(repo.recordIdempotency({ userId: 'u1', key: 'k', examId: 'exam1' })).resolves.toBeUndefined();
  });
});
