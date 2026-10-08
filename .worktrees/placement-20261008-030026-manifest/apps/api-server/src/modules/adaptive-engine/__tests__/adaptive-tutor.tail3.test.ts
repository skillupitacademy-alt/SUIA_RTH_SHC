import { describe, it, expect, vi, beforeEach } from 'vitest';

const { topicFindFirst, userFindFirst, insertValues, insertMock } = vi.hoisted(() => {
  const topicFindFirst = vi.fn();
  const userFindFirst = vi.fn();
  const insertValues = vi.fn().mockResolvedValue(undefined);
  const insertMock = vi.fn().mockReturnValue({ values: insertValues });
  return { topicFindFirst, userFindFirst, insertValues, insertMock };
});

// Mock DB so requestMasterNotes can run without real database
vi.mock('@quiz/db', () => ({
  STANDARD_QUERY_TIMEOUT: 15000,
  QUICK_QUERY_TIMEOUT: 5000,
  REPORT_QUERY_TIMEOUT: 30000,
  MIGRATION_TIMEOUT: 120000,
  withTimeout: vi.fn(async (promise: Promise<any>) => promise),
  db: {
    query: {
      topics: { findFirst: topicFindFirst },
      users: { findFirst: userFindFirst },
    },
    insert: insertMock,
  },
  notifications: {},
  topics: {},
  users: {},
}));

import { AdaptiveTutorService } from '../adaptive-tutor.service';

describe('AdaptiveTutorService.requestMasterNotes success path', () => {
  beforeEach(() => {
    topicFindFirst.mockResolvedValue({
      id: 't1',
      name: 'Algebra',
      detailedNotesPath: '/notes/algebra.pdf',
    });
    userFindFirst.mockResolvedValue({ id: 'u1', email: 'user@example.com' });
    insertValues.mockClear();
    insertMock.mockClear();
  });

  it('returns true and creates notification when topic has notes', async () => {
    const res = await AdaptiveTutorService.requestMasterNotes('u1', 't1');
    expect(res).toBe(true);
    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(insertValues).toHaveBeenCalledTimes(1);
  });

  it('returns false when topic missing notes', async () => {
    topicFindFirst.mockResolvedValueOnce({ id: 't2', name: 'Calc', detailedNotesPath: '' });
    const res = await AdaptiveTutorService.requestMasterNotes('u1', 't2');
    expect(res).toBe(false);
    expect(insertMock).not.toHaveBeenCalled();
  });
});


