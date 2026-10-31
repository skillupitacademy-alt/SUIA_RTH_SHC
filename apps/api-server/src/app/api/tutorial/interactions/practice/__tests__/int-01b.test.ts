import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getAuthenticatedUserIdAsync: vi.fn(),
  getTutorialSection: vi.fn(),
  extractCorrectAnswerFromContent: vi.fn(),
  updateProgressForSection: vi.fn(),
  dbInsert: vi.fn(),
  dbSelect: vi.fn(),
}));

vi.mock('@quiz/db-tutorial', () => ({
  db: {
    insert: mocks.dbInsert,
    select: mocks.dbSelect,
  },
  practiceTestAnswers: {
    id: 'id',
    userId: 'userId',
    questionId: 'questionId',
  },
}));

vi.mock('../../_shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../_shared')>();
  return {
    ...actual,
    getAuthenticatedUserIdAsync: mocks.getAuthenticatedUserIdAsync,
    getTutorialSection: mocks.getTutorialSection,
    extractCorrectAnswerFromContent: mocks.extractCorrectAnswerFromContent,
    updateProgressForSection: mocks.updateProgressForSection,
  };
});

import { POST } from '../route';

describe('INT-01b: Authoritative Practice Scoring & Tamper Resistance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.dbSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });
    mocks.dbInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'practice-ans-1' }]),
      }),
    });
    mocks.updateProgressForSection.mockResolvedValue(undefined);
  });

  it('requires authenticated user (rejects unauthenticated requests)', async () => {
    mocks.getAuthenticatedUserIdAsync.mockResolvedValueOnce(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );

    const req = new NextRequest('http://localhost/api/tutorial/interactions/practice', {
      method: 'POST',
      body: JSON.stringify({
        sectionId: 'sec-practice',
        questionId: 'pq-1',
        selectedAnswer: 'A',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('scores practice question using authoritative section answer', async () => {
    mocks.getAuthenticatedUserIdAsync.mockResolvedValueOnce('user-practice-1');
    mocks.getTutorialSection.mockResolvedValueOnce({
      id: 'sec-practice',
      content: { questions: [{ id: 'pq-1', correctAnswer: 'C' }] },
    });
    mocks.extractCorrectAnswerFromContent.mockReturnValueOnce('C');

    const req = new NextRequest('http://localhost/api/tutorial/interactions/practice', {
      method: 'POST',
      body: JSON.stringify({
        sectionId: 'sec-practice',
        questionId: 'pq-1',
        selectedAnswer: 'C',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.isCorrect).toBe(true);
    expect(body.answerId).toBe('practice-ans-1');
  });

  it('ignores client correctAnswer tampering in practice submission', async () => {
    mocks.getAuthenticatedUserIdAsync.mockResolvedValueOnce('user-practice-1');
    mocks.getTutorialSection.mockResolvedValueOnce({
      id: 'sec-practice',
      content: { questions: [{ id: 'pq-1', correctAnswer: 'D' }] },
    });
    mocks.extractCorrectAnswerFromContent.mockReturnValueOnce('D');

    // Attacker selects 'A' and tries to claim correctAnswer is 'A'
    const req = new NextRequest('http://localhost/api/tutorial/interactions/practice', {
      method: 'POST',
      body: JSON.stringify({
        sectionId: 'sec-practice',
        questionId: 'pq-1',
        selectedAnswer: 'A',
        correctAnswer: 'A',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.isCorrect).toBe(false);
  });

  it('returns 422 PRACTICE_CONFIGURATION_ERROR when question lacks authoritative answer', async () => {
    mocks.getAuthenticatedUserIdAsync.mockResolvedValueOnce('user-practice-1');
    mocks.getTutorialSection.mockResolvedValueOnce({
      id: 'sec-practice',
      content: { questions: [] },
    });
    mocks.extractCorrectAnswerFromContent.mockReturnValueOnce(null);

    const req = new NextRequest('http://localhost/api/tutorial/interactions/practice', {
      method: 'POST',
      body: JSON.stringify({
        sectionId: 'sec-practice',
        questionId: 'pq-unconfigured',
        selectedAnswer: 'A',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toBe('PRACTICE_CONFIGURATION_ERROR');
    expect(body.message).toContain('authoritative answer is unavailable');
  });
});
