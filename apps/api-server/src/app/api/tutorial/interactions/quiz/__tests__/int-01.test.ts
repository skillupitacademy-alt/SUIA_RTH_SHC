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
  quizAnswers: {
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

describe('INT-01 / INT-01b: Authoritative Quiz Scoring & Tamper Resistance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.dbSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });
    mocks.dbInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'answer-1' }]),
      }),
    });
    mocks.updateProgressForSection.mockResolvedValue(undefined);
  });

  it('requires authenticated user (rejects unauthenticated requests)', async () => {
    mocks.getAuthenticatedUserIdAsync.mockResolvedValueOnce(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );

    const req = new NextRequest('http://localhost/api/tutorial/interactions/quiz', {
      method: 'POST',
      body: JSON.stringify({
        sectionId: 'sec-1',
        questionId: 'q-1',
        selectedAnswer: 'A',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('scores using authoritative section answer', async () => {
    mocks.getAuthenticatedUserIdAsync.mockResolvedValueOnce('user-123');
    mocks.getTutorialSection.mockResolvedValueOnce({
      id: 'sec-1',
      content: { questions: [{ id: 'q-1', correctAnswer: 'B' }] },
    });
    mocks.extractCorrectAnswerFromContent.mockReturnValueOnce('B');

    const req = new NextRequest('http://localhost/api/tutorial/interactions/quiz', {
      method: 'POST',
      body: JSON.stringify({
        sectionId: 'sec-1',
        questionId: 'q-1',
        selectedAnswer: 'B',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.isCorrect).toBe(true);
    expect(body.answerId).toBe('answer-1');
  });

  it('ignores a malicious client correctAnswer and marks wrong answer incorrect', async () => {
    mocks.getAuthenticatedUserIdAsync.mockResolvedValueOnce('user-123');
    mocks.getTutorialSection.mockResolvedValueOnce({
      id: 'sec-1',
      content: { questions: [{ id: 'q-1', correctAnswer: 'B' }] },
    });
    // Authoritative answer is 'B'
    mocks.extractCorrectAnswerFromContent.mockReturnValueOnce('B');

    // Attacker sends selectedAnswer: 'A' but maliciously specifies client correctAnswer: 'A'
    const req = new NextRequest('http://localhost/api/tutorial/interactions/quiz', {
      method: 'POST',
      body: JSON.stringify({
        sectionId: 'sec-1',
        questionId: 'q-1',
        selectedAnswer: 'A',
        correctAnswer: 'A', // Tamper attempt
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    // Must be false because server's authoritative answer is 'B', not 'A'
    expect(body.isCorrect).toBe(false);
  });

  it('returns 422 when question has no authoritative correctAnswer', async () => {
    mocks.getAuthenticatedUserIdAsync.mockResolvedValueOnce('user-123');
    mocks.getTutorialSection.mockResolvedValueOnce({
      id: 'sec-1',
      content: { questions: [] },
    });
    // Section has no authoritative answer for question
    mocks.extractCorrectAnswerFromContent.mockReturnValueOnce(null);

    const req = new NextRequest('http://localhost/api/tutorial/interactions/quiz', {
      method: 'POST',
      body: JSON.stringify({
        sectionId: 'sec-1',
        questionId: 'unconfigured-q',
        selectedAnswer: 'A',
        correctAnswer: 'A', // Client tries to supply answer
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toBe('QUIZ_CONFIGURATION_ERROR');
    expect(body.message).toContain('authoritative answer is unavailable');
  });

  it('does not use another users previous answer as scoring authority', async () => {
    mocks.getAuthenticatedUserIdAsync.mockResolvedValueOnce('user-attacker');
    mocks.getTutorialSection.mockResolvedValueOnce({
      id: 'sec-1',
      content: { questions: [] },
    });
    mocks.extractCorrectAnswerFromContent.mockReturnValueOnce(null);

    const req = new NextRequest('http://localhost/api/tutorial/interactions/quiz', {
      method: 'POST',
      body: JSON.stringify({
        sectionId: 'sec-1',
        questionId: 'q-1',
        selectedAnswer: 'C',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toBe('QUIZ_CONFIGURATION_ERROR');
  });

  it('does not use the current users previous answer as scoring authority', async () => {
    mocks.getAuthenticatedUserIdAsync.mockResolvedValueOnce('user-123');
    mocks.getTutorialSection.mockResolvedValueOnce({
      id: 'sec-1',
      content: { questions: [] },
    });
    mocks.extractCorrectAnswerFromContent.mockReturnValueOnce(null);

    const req = new NextRequest('http://localhost/api/tutorial/interactions/quiz', {
      method: 'POST',
      body: JSON.stringify({
        sectionId: 'sec-1',
        questionId: 'q-1',
        selectedAnswer: 'D',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toBe('QUIZ_CONFIGURATION_ERROR');
  });

  it('does not expose the authoritative correctAnswer unnecessarily in response', async () => {
    mocks.getAuthenticatedUserIdAsync.mockResolvedValueOnce('user-123');
    mocks.getTutorialSection.mockResolvedValueOnce({
      id: 'sec-1',
      content: { questions: [{ id: 'q-1', correctAnswer: 'B' }] },
    });
    mocks.extractCorrectAnswerFromContent.mockReturnValueOnce('B');

    const req = new NextRequest('http://localhost/api/tutorial/interactions/quiz', {
      method: 'POST',
      body: JSON.stringify({
        sectionId: 'sec-1',
        questionId: 'q-1',
        selectedAnswer: 'C',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.isCorrect).toBe(false);
    // Response should only contain interaction results, not reveal secret answers unnecessarily
    expect(body.correctAnswer).toBeUndefined();
  });
});
