import { describe, it, expect, vi, beforeEach } from 'vitest';

const findFirstExam = vi.fn();
const findManySubtopics = vi.fn();

vi.mock('@quiz/db', () => ({
  db: {
    query: {
      exams: { findFirst: findFirstExam },
      subtopics: { findMany: findManySubtopics },
    },
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  },
  exams: {},
}));

describe('ReportMaterializer subtopic branch', () => {
  beforeEach(() => {
    vi.resetModules();
    findFirstExam.mockReset();
    findManySubtopics.mockReset();
  });

  it('fetches subtopics when subtopicIds are present (covers line 75)', async () => {
    findFirstExam.mockResolvedValue({
      id: 'exam1',
      user: { id: 'u1' },
      examQuestions: [
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
      ],
    });

    findManySubtopics.mockResolvedValue([{ id: 'sub-1', name: 'Subtopic 1' }]);

    const { ReportMaterializer } = await import('../ReportMaterializer');
    const result = await ReportMaterializer.materialize('exam1');

    expect(findManySubtopics).toHaveBeenCalled();
    expect(result.datasets.topics['t1'].accuracy).toBe(100);
  });
});
