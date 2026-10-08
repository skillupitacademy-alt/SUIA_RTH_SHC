import { describe, it, expect, vi, beforeEach } from 'vitest';

const { findFirstExam, findManySubtopics } = vi.hoisted(() => ({
  findFirstExam: vi.fn(),
  findManySubtopics: vi.fn(),
}));

const makeSelect = (rows: any[] = []) => ({
  from: vi.fn().mockReturnThis(),
  leftJoin: vi.fn().mockReturnThis(),
  innerJoin: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  groupBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  then: (resolve: (value: unknown) => void) => resolve(rows),
});

vi.mock('@quiz/db', () => ({
  db: {
    query: {
      exams: { findFirst: findFirstExam },
      subtopics: { findMany: findManySubtopics },
    },
    select: vi.fn().mockReturnValue(makeSelect([])),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  },
  exams: {},
  users: {},
  examQuestions: {},
  questions: {},
  topics: {},
  subjects: {},
  domains: {},
  subtopics: {},
}));

describe('ReportMaterializer subtopic branch', () => {
  beforeEach(() => {
    vi.resetModules();
    findFirstExam.mockReset();
    findManySubtopics.mockReset();
  });

  it('fetches subtopics when subtopicIds are present (covers line 75)', async () => {
    const examRow = {
      id: 'exam1',
      userId: 'u1',
      user: { id: 'u1' },
    } as any;
    const examQuestions = [
      {
        id: 'eq1',
        question: {
          questionText: 'Q1',
          correctAnswer: 'A',
          explanation: 'exp',
          difficulty: 'simple',
          topicId: 't1',
          topic: {
            id: 't1',
            name: 'Topic 1',
            subjectId: 's1',
            subject: {
              id: 's1',
              name: 'Subject 1',
              domainId: 'd1',
              domain: { id: 'd1', name: 'Domain 1' },
            },
          },
          subtopicId: 'sub-1',
        },
        isCorrect: true,
        responseMetadata: { timeSpentSeconds: 5 },
        userAnswer: 'A',
        questionId: 'q1',
        subtopicId: 'sub-1',
      },
    ];
    findFirstExam.mockResolvedValue({
      ...examRow,
      examQuestions,
    });

    findManySubtopics.mockResolvedValue([{ id: 'sub-1', name: 'Subtopic 1' }]);

    const { db } = await import('@quiz/db');
    vi.mocked(db.select)
      .mockReturnValueOnce(
        makeSelect([{ exam: examRow, user: examRow.user }]),
      )
      .mockReturnValueOnce(
        makeSelect([
          {
            examQuestion: examQuestions[0],
            question: examQuestions[0].question,
            topic: { id: 't1', name: 'Topic 1', subjectId: 's1' },
            subject: { id: 's1', name: 'Subject 1', domainId: 'd1' },
            domain: { id: 'd1', name: 'Domain 1' },
          },
        ]),
      )
      .mockReturnValueOnce(
        makeSelect([{ id: 'sub-1', name: 'Subtopic 1' }]),
      );

    const { ReportMaterializer } = await import('../ReportMaterializer');
    const result = await ReportMaterializer.materialize('exam1');

    expect(result.datasets.topics['t1'].accuracy).toBe(100);
    expect(result.datasets.topics['t1'].subtopics[0]?.name).toBe('Subtopic 1');
  });
});
