import { describe, it, expect, vi } from 'vitest';

import { ReportMaterializer } from '../ReportMaterializer';
import { db } from '@quiz/db';

// Mock logger to keep output quiet
vi.mock('@/lib/logger', () => ({
  logger: { child: () => ({ info: vi.fn() }) },
}));

// Mock db with a subtopic present so line 75 (query) executes
vi.mock('@quiz/db', () => {
  const mockSubtopic = { id: 'sub1', name: 'Sub One' };
  return {
    exams: { id: 'ex1' },
    users: { id: 'u1' },
    examQuestions: { id: 'eq1' },
    questions: { id: 'q1' },
    topics: { id: 't1' },
    subjects: { id: 's1' },
    domains: { id: 'd1' },
    subtopics: { id: 'sub1' },
    db: {
      query: {
        exams: {
          findFirst: vi.fn().mockResolvedValue({
            id: 'ex1',
            user: { id: 'u1' },
            examQuestions: [
              {
                id: 'eq1',
                userAnswer: 'A',
                correctAnswer: 'B',
                explanation: 'x',
                isCorrect: true,
                responseMetadata: { timeSpentSeconds: 10 },
                question: {
                  questionText: 'Q',
                  correctAnswer: 'B',
                  explanation: 'x',
                  difficulty: 'easy',
                  topic: {
                    id: 't1',
                    name: 'Topic 1',
                    subjectId: 's1',
                    subject: { id: 's1', name: 'Subj', domainId: 'd1', domain: { id: 'd1', name: 'Dom' } },
                  },
                  subtopicId: 'sub1',
                },
              },
            ],
          }),
        },
        subtopics: {
          findMany: vi.fn().mockResolvedValue([mockSubtopic]),
        },
      },
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      }),
      select: vi.fn(),
    },
  };
});

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

describe('ReportMaterializer subtopic fetch branch (line 75)', () => {
  it('executes hasValue helper branches', () => {
    const hasValue = (ReportMaterializer as any).hasValue as (value?: string | null) => boolean;
    expect(hasValue('x')).toBe(true);
    expect(hasValue('')).toBe(false);
    expect(hasValue(null)).toBe(false);
  });

  it('fetches subtopics when subtopicIds exist', async () => {
    const examRow: any = {
      id: 'ex1',
      userId: 'u1',
      user: { id: 'u1' },
    };
    const questionRow = {
      examQuestion: { id: 'eq1', isCorrect: true, responseMetadata: { timeSpentSeconds: 10 } },
      question: {
        questionText: 'Q',
        correctAnswer: 'B',
        explanation: 'x',
        difficulty: 'easy',
        topicId: 't1',
        subtopicId: 'sub1',
      },
      topic: { id: 't1', name: 'Topic 1', subjectId: 's1' },
      subject: { id: 's1', name: 'Subj', domainId: 'd1' },
      domain: { id: 'd1', name: 'Dom' },
    };

    vi.mocked(db.select)
      .mockReturnValueOnce(makeSelect([{ exam: examRow, user: examRow.user }]))
      .mockReturnValueOnce(makeSelect([questionRow]))
      .mockReturnValueOnce(makeSelect([{ id: 'sub1', name: 'Sub One' }]));

    const report = await ReportMaterializer.materialize('ex1');
    expect(report.hierarchy.subjects[0].topics[0].name).toBe('Topic 1');
  });
});
