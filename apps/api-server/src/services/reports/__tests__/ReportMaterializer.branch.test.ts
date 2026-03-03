import { describe, it, expect, vi, beforeEach } from 'vitest';

const makeDb = (exam: any, subtopics: any[] = []) => ({
  query: {
    exams: { findFirst: vi.fn().mockResolvedValue(exam) },
    subtopics: { findMany: vi.fn().mockResolvedValue(subtopics) },
  },
  update: vi.fn().mockReturnValue({
    set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
  }),
});

describe('ReportMaterializer branches', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('handles no subtopics and uses Core Focus fallback (branch ~75)', async () => {
    const exam = {
      id: 'ex1',
      userId: 'u1',
      user: { email: 'user@example.com' },
      examQuestions: [
        {
          id: 'eq1',
          question: {
            questionText: 'Q?',
            correctAnswer: 'A',
            explanation: 'why',
            difficulty: 'simple',
            topicId: 't1',
            topic: {
              id: 't1',
              name: 'Topic 1',
              subjectId: 's1',
              subject: { id: 's1', name: 'Subject 1', domainId: 'd1', domain: { id: 'd1', name: 'Domain 1' } },
            },
            subtopicId: null,
          },
          userAnswer: 'A',
          isCorrect: true,
          responseMetadata: null,
        },
      ],
    };

    const dbMock = makeDb(exam, []);

    vi.doMock('@quiz/db', () => ({
      db: dbMock,
      exams: {},
    }));

    const { ReportMaterializer } = await import('../ReportMaterializer');
    const report = await ReportMaterializer.materialize('ex1');

    expect(report.datasets.topics['t1'].subtopics[0].name).toBe('Core Focus');
  });

  it('looks up subtopic names when present (branch ~165)', async () => {
    const exam = {
      id: 'ex2',
      userId: 'u2',
      user: { email: 'u2@example.com' },
      examQuestions: [
        {
          id: 'eq2',
          question: {
            questionText: 'Q2',
            correctAnswer: 'A2',
            explanation: 'exp',
            difficulty: 'expert',
            topicId: 't1',
            topic: {
              id: 't1',
              name: 'Topic 1',
              subjectId: 's1',
              subject: { id: 's1', name: 'Subject 1', domainId: 'd1', domain: { id: 'd1', name: 'Domain 1' } },
            },
            subtopicId: 'st1',
          },
          userAnswer: 'B',
          isCorrect: false,
          responseMetadata: { timeSpentSeconds: 12 },
        },
      ],
    };

    const dbMock = makeDb(exam, [{ id: 'st1', name: 'Arrays' }]);

    vi.doMock('@quiz/db', () => ({
      db: dbMock,
      exams: {},
    }));

    const { ReportMaterializer } = await import('../ReportMaterializer');
    const report = await ReportMaterializer.materialize('ex2');

    expect(report.datasets.topics['t1'].subtopics[0].name).toBe('Arrays');
    expect(dbMock.update).toHaveBeenCalled();
  });
});
