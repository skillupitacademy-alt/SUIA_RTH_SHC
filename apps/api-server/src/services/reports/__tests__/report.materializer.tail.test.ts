import { describe, it, expect, vi } from 'vitest';

import { ReportMaterializer } from '../ReportMaterializer';

// Mock logger to keep output quiet
vi.mock('@/lib/logger', () => ({
  logger: { child: () => ({ info: vi.fn() }) },
}));

// Mock db with a subtopic present so line 75 (query) executes
vi.mock('@quiz/db', () => {
  const mockSubtopic = { id: 'sub1', name: 'Sub One' };
  return {
    exams: { id: 'ex1' },
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
    },
  };
});

describe('ReportMaterializer subtopic fetch branch (line 75)', () => {
  it('fetches subtopics when subtopicIds exist', async () => {
    const report = await ReportMaterializer.materialize('ex1');
    expect(report.hierarchy.subjects[0].topics[0].name).toBe('Topic 1');
  });
});
