import { describe, it, expect, beforeEach, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const questionsFindMany = vi.fn();
  const selectWhereMock = vi.fn();
  const insertReturning = vi.fn();
  const insertValues = vi.fn(() => ({ returning: insertReturning }));
  const insertMock = vi.fn(() => ({ values: insertValues }));
  const updateReturning = vi.fn();
  const updateWhere = vi.fn(() => ({ returning: updateReturning }));
  const updateSet = vi.fn(() => ({ where: updateWhere }));
  const updateMock = vi.fn(() => ({ set: updateSet }));
  const deleteReturning = vi.fn();
  const deleteWhere = vi.fn(() => ({ returning: deleteReturning }));
  const deleteMock = vi.fn(() => ({ where: deleteWhere }));

  return {
    questionsFindMany,
    selectWhereMock,
    insertReturning,
    insertValues,
    insertMock,
    updateReturning,
    updateWhere,
    updateSet,
    updateMock,
    deleteReturning,
    deleteWhere,
    deleteMock,
  };
});

vi.mock('@quiz/db', () => {
  const now = new Date();
  const questions = {
    id: 'q.id',
    updatedAt: 'q.updatedAt',
    subtopicId: 'q.subtopicId',
    topicId: 'q.topicId',
    status: 'q.status',
    questionText: 'q.questionText',
  } as any;
  const questionSkills = { questionId: 'qs.questionId', skillId: 'qs.skillId' } as any;

  return {
    db: {
      query: { questions: { findMany: mocks.questionsFindMany } },
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: mocks.selectWhereMock })) })),
      insert: mocks.insertMock,
      update: mocks.updateMock,
      delete: mocks.deleteMock,
    },
    questions,
    questionSkills,
  };
});

import { DrizzleQuestionRepository } from '../drizzle-question.repository';

describe('DrizzleQuestionRepository', () => {
  const repo = new DrizzleQuestionRepository();

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.selectWhereMock.mockResolvedValue([{ count: 3 }]);
  });

  it('findAll applies filters, pagination, and search', async () => {
    // Return limit + 1 rows to exercise hasNext slice
    const rows = Array.from({ length: 3 }, (_, i) => ({ id: `q${i}`, updatedAt: new Date(`2026-01-0${i + 1}`) }));
    mocks.questionsFindMany.mockResolvedValue(rows);

    const res = await repo.findAll(new Date().toISOString(), 2, { subtopicId: 'st1', status: 'active', search: 'algebra' });
    expect(res.total).toBe(3);
    expect(res.data.length).toBe(2); // sliced
    expect(res.nextCursor).toBe(`${rows[1].updatedAt.toISOString()}|${rows[1].id}`);
  });

  it('findAll falls back to topic filter when subtopicId missing', async () => {
    mocks.questionsFindMany.mockResolvedValue([{ id: 'q1', updatedAt: new Date() }]);
    const res = await repo.findAll(null, 10, { topicId: 't1' });
    expect(res.limit).toBe(10);
    expect(res.nextCursor).toBeNull();
  });

  it('create inserts question and questionSkills when provided', async () => {
    const inserted = { id: 'new-q' };
    mocks.insertReturning.mockResolvedValue([inserted]);
    const result = await repo.create({ questionText: 'q' } as any, ['s1', 's2']);
    expect(result).toEqual(inserted);
    expect(mocks.insertValues).toHaveBeenCalled(); // questions
  });

  it('update replaces skills when list provided', async () => {
    mocks.updateReturning.mockResolvedValue([{ id: 'upd' }]);
    const res = await repo.update('qid', { questionText: 'n' } as any, ['s1']);
    expect(res).toEqual({ id: 'upd' });
    expect(mocks.deleteMock).toHaveBeenCalled(); // delete old skills
    expect(mocks.insertMock).toHaveBeenCalled(); // insert new skills
  });

  it('delete and status helpers propagate responses', async () => {
    mocks.updateReturning.mockResolvedValueOnce([{ id: 'status-id' }]); // updateStatus
    mocks.updateReturning.mockResolvedValueOnce([{ id: 'del-id' }]); // delete
    mocks.updateReturning.mockResolvedValueOnce([{ id: 'del2' }]); // deleteBatch

    await expect(repo.updateStatus('qid', 'inactive')).resolves.toEqual({ id: 'status-id' });
    await expect(repo.delete('qid')).resolves.toEqual({ id: 'del-id' });
    await expect(repo.deleteBatch(['a', 'b'])).resolves.toEqual([{ id: 'del2' }]);
  });
});
