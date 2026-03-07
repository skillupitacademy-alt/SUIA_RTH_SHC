import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  examsFindFirstMock,
  updateWhereMock,
  updateSetMock,
  updateMock,
  txInsertMock,
  txInsertValuesMock,
  txInsertReturningMock,
  transactionMock,
  composeExamMock,
} = vi.hoisted(() => {
  const _examsFindFirstMock = vi.fn();
  const _updateWhereMock = vi.fn().mockResolvedValue(undefined);
  const _updateSetMock = vi.fn(() => ({ where: _updateWhereMock }));
  const _updateMock = vi.fn(() => ({ set: _updateSetMock }));

  const _txInsertReturningMock = vi.fn();
  const _txInsertValuesMock = vi.fn(() => ({ returning: _txInsertReturningMock }));
  const _txInsertMock = vi.fn(() => ({ values: _txInsertValuesMock }));
  const _transactionMock = vi.fn(async (cb: (tx: any) => unknown) => cb({ insert: _txInsertMock }));

  return {
    examsFindFirstMock: _examsFindFirstMock,
    updateWhereMock: _updateWhereMock,
    updateSetMock: _updateSetMock,
    updateMock: _updateMock,
    txInsertMock: _txInsertMock,
    txInsertValuesMock: _txInsertValuesMock,
    txInsertReturningMock: _txInsertReturningMock,
    transactionMock: _transactionMock,
    composeExamMock: vi.fn(),
  };
});

vi.mock('@quiz/db', () => ({
  STANDARD_QUERY_TIMEOUT: 15000,
  QUICK_QUERY_TIMEOUT: 5000,
  REPORT_QUERY_TIMEOUT: 30000,
  MIGRATION_TIMEOUT: 120000,
  withTimeout: vi.fn(async (promise: Promise<any>) => promise),
  db: {
    query: {
      exams: { findFirst: examsFindFirstMock },
    },
    update: updateMock,
    transaction: transactionMock,
  },
  exams: { id: 'id' },
  examQuestions: { id: 'id' },
  idempotencyKeys: { id: 'id' },
}));

vi.mock('@/modules/core/container', () => ({
  container: {
    get: vi.fn((token: { name?: string }) => {
      if (token?.name === 'SelectionService') {
        return { composeExam: composeExamMock };
      }
      if (token?.name === 'ExamRepository') {
        return {
          createExamWithQuestions: vi.fn().mockResolvedValue({ id: 'exam-1' }),
        };
      }
      return {};
    }),
  },
}));

import { ExamBuilder } from '../exam.builder';
import { ExamStateMachine } from '../exam.state-machine';
import { ExamRepository } from '../repositories/exam.repository';

describe('Exam builder/state/repository tails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    txInsertReturningMock.mockResolvedValue([{ id: 'ex-1' }]);
    composeExamMock.mockResolvedValue({
      blueprint: { id: 'bp-1', timeLimit: 10 },
      questions: [{ id: 'q1' }],
    });
  });

  it('ExamBuilder throws for missing required fields and invalid compose result', async () => {
    const builder = new ExamBuilder();
    await expect(builder.build()).rejects.toThrow('required');

    const invalidBuilder = new ExamBuilder().forUser('u1').withBlueprint('bp1');
    composeExamMock.mockResolvedValueOnce({ blueprint: { id: 'bp-1', timeLimit: 10 } });
    await expect(invalidBuilder.build()).rejects.toThrow('Failed to compose exam');
  });

  it('ExamStateMachine handles invalid transition branches and helpers', async () => {
    examsFindFirstMock.mockResolvedValue({ id: 'e1', status: 'started', userId: 'u1' });
    await expect(ExamStateMachine.transition('e1', 'completed', 'u1')).resolves.toBeUndefined();

    examsFindFirstMock.mockResolvedValueOnce({ id: 'e2', status: 'completed', userId: 'u1' });
    await expect(ExamStateMachine.transition('e2', 'completed', 'u1')).resolves.toBeUndefined();

    examsFindFirstMock.mockResolvedValueOnce({ id: 'e3', status: 'completed', userId: 'u1' });
    await expect(ExamStateMachine.transition('e3', 'processing', 'u1')).rejects.toThrow('Invalid transition');

    expect(ExamStateMachine.isActive('started')).toBe(true);
    expect(ExamStateMachine.isActive('processing')).toBe(false);
    expect(ExamStateMachine.isTerminal('completed')).toBe(true);
    expect(ExamStateMachine.isTerminal('failed')).toBe(false);
  });

  it('ExamStateMachine rejects unauthorized transition attempts', async () => {
    examsFindFirstMock.mockResolvedValue({ id: 'e9', status: 'started', userId: 'owner-1' });
    await expect(ExamStateMachine.transition('e9', 'processing', 'other-user')).rejects.toThrow('Unauthorized');
  });

  it('ExamRepository writes idempotency mapping when key is provided', async () => {
    const repo = new ExamRepository();
    await repo.createExamWithQuestions({
      userId: 'u1',
      blueprintId: 'bp1',
      status: 'started',
      durationSeconds: 60,
      questions: [{ id: 'q1' }, { id: 'q2' }],
      idempotencyKey: 'idem-1',
    });

    expect(txInsertMock).toHaveBeenCalledTimes(3);
    expect(txInsertValuesMock).toHaveBeenCalled();
  });
});


