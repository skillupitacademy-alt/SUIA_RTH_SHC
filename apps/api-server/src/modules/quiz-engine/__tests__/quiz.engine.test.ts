import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  composeExam: vi.fn(),
  findExam: vi.fn(),
}));

vi.mock('@/modules/core/container', () => ({
  container: {
    get: vi.fn((svc: unknown) => {
      if ((svc as any).name === 'SelectionService') return { composeExam: h.composeExam };
      return undefined;
    }),
  },
}));

vi.mock('@quiz/db', () => ({
  db: {
    query: {
      exams: { findFirst: h.findExam },
    },
  },
  exams: { id: 'id' },
}));

vi.mock('crypto', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    default: {
      ...(actual as any).default,
      randomUUID: vi.fn(() => 'uuid-1'),
    },
    randomUUID: vi.fn(() => 'uuid-1'),
  };
});

describe('QuizEngine (unit)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('delegates question selection to SelectionService and returns shaped exam', async () => {
    const { QuizEngine } = await import('@/modules/quiz-engine/quiz.engine');
    h.composeExam.mockResolvedValue({ questions: [{ id: 'q1' }], blueprint: { id: 'bp' } });

    const res = await QuizEngine.startQuiz('u1', { topicId: 't1', count: 3 });

    expect(h.composeExam).toHaveBeenCalledWith('u1', 't1', 'quiz-uuid-1', {
      topicIds: ['t1'],
      questionCount: 3,
      difficulty: 'simple',
    });
    expect(res.questions).toHaveLength(1);
    expect(res.blueprint.id).toBe('bp');
  });

  it('uses domainId when topicId is absent', async () => {
    const { QuizEngine } = await import('@/modules/quiz-engine/quiz.engine');
    h.composeExam.mockResolvedValue({ questions: [], blueprint: { id: 'bp' } });

    await QuizEngine.startQuiz('u1', { domainId: 'd1', count: 5, difficulty: 'expert' });

    expect(h.composeExam).toHaveBeenCalledWith('u1', 'd1', 'quiz-uuid-1', {
      topicIds: undefined,
      questionCount: 5,
      difficulty: 'expert',
    });
  });

  it('falls back to self-paced and default count when ids are missing', async () => {
    const { QuizEngine } = await import('@/modules/quiz-engine/quiz.engine');
    h.composeExam.mockResolvedValue({ questions: [], blueprint: { id: 'bp' } });

    await QuizEngine.startQuiz('u1', {});

    expect(h.composeExam).toHaveBeenCalledWith('u1', 'self-paced', 'quiz-uuid-1', {
      topicIds: undefined,
      questionCount: 10,
      difficulty: 'simple',
    });
  });

  it('returns quiz state for authorized user', async () => {
    const { QuizEngine } = await import('@/modules/quiz-engine/quiz.engine');
    h.findExam.mockResolvedValue({
      id: 'e1',
      userId: 'u1',
      status: 'active',
      startedAt: new Date('2024-01-01T00:00:00.000Z'),
      examQuestions: [
        {
          question: { id: 'q1', questionText: 'Q', options: ['A'], type: 'mcq' },
          userAnswer: 'A',
          isCorrect: null,
          responseMetadata: { timeSpentSeconds: 12 },
        },
      ],
    });

    const res = await QuizEngine.getQuizState('e1', 'u1');

    expect(res.id).toBe('e1');
    expect(res.questions[0].metadata?.timeSpentSeconds).toBe(12);
    expect(res.questions[0].userAnswer).toBe('A');
  });

  it('maps null user answers to null', async () => {
    const { QuizEngine } = await import('@/modules/quiz-engine/quiz.engine');
    h.findExam.mockResolvedValue({
      id: 'e2',
      userId: 'u2',
      status: 'active',
      startedAt: new Date('2024-01-01T00:00:00.000Z'),
      examQuestions: [
        {
          question: { id: 'q2', questionText: 'Q2', options: ['A'], type: 'mcq' },
          userAnswer: null,
          isCorrect: null,
          responseMetadata: {},
        },
      ],
    });

    const res = await QuizEngine.getQuizState('e2', 'u2');

    expect(res.questions[0].userAnswer).toBeNull();
  });

  it('throws when quiz is missing or user is unauthorized', async () => {
    const { QuizEngine } = await import('@/modules/quiz-engine/quiz.engine');
    h.findExam.mockResolvedValue(null);
    await expect(QuizEngine.getQuizState('e1', 'u1')).rejects.toThrow('Quiz not found');

    h.findExam.mockResolvedValue({ id: 'e1', userId: 'u2', examQuestions: [] });
    await expect(QuizEngine.getQuizState('e1', 'u1')).rejects.toThrow('Unauthorized access');
  });
});
