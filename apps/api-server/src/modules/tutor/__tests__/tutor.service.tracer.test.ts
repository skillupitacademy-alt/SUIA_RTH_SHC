import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock withSpan 
vi.mock('@/lib/tracer', () => ({
  withSpan: vi.fn((name, fn) => fn({ setAttribute: vi.fn(), setStatus: vi.fn() })),
}));

import { withSpan } from '@/lib/tracer';
import { db } from '@quiz/db';
import { TutorService } from '../tutor.service';

vi.mock('@quiz/db', () => ({
  db: {
    query: {
      exams: { findFirst: vi.fn() },
    },
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([]),
      })),
    })),
    transaction: vi.fn(),
  },
  exams: { id: 'id', userId: 'userId' },
  resultsByDimension: { examId: 'examId', dimensionType: 'dimensionType', accuracy: 'accuracy' },
  userRecommendations: { userId: 'userId', topicId: 'topicId' },
  notifications: { userId: 'userId' },
  notesDeliveryLocks: { userId: 'userId' },
  backgroundJobs: { userId: 'userId' }
}));

vi.mock('@/modules/core/resilience.service', () => ({
  ResilienceService: { isFeatureEnabled: vi.fn().mockResolvedValue(true) }
}));

describe('TutorService Tracing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls withSpan in processExamResults', async () => {
    (db.query.exams.findFirst as any).mockResolvedValue({ userId: 'u1' });

    await TutorService.processExamResults('e1');
    expect(withSpan).toHaveBeenCalledWith('TutorService.processExamResults', expect.any(Function));
  });
});
