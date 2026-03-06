import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock withSpan 
vi.mock('@/lib/tracer', () => ({
  withSpan: vi.fn((name, fn) => fn({ setAttribute: vi.fn(), setStatus: vi.fn() })),
}));

import { withSpan } from '@/lib/tracer';
import { db } from '@quiz/db';
import { ExamBlueprintService } from '../ExamBlueprintService';

vi.mock('@quiz/db', () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([{ id: 'b1' }]),
      })),
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([]),
      })),
    })),
  },
  examBlueprints: { id: 'id' },
  questions: { id: 'id', status: 'status', difficulty: 'difficulty' },
  subtopics: { id: 'id', topicId: 'topicId' },
  topics: { id: 'id', subjectId: 'subjectId' },
  subjects: { id: 'id', domainId: 'domainId' }
}));

describe('ExamBlueprintService Tracing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls withSpan in generateBlueprint', async () => {
    const service = new ExamBlueprintService();
    // Partially mock internal methods to avoid deep failures
    (service as any).fetchQuestions = vi.fn().mockResolvedValue([{ id: 'q1' }]);
    
    await service.generateBlueprint({
      domainId: 'd1',
      questionCount: 1,
      difficultyPreference: 'simple'
    });
    
    expect(withSpan).toHaveBeenCalledWith('ExamBlueprintService.generateBlueprint', expect.any(Function));
  });
});
