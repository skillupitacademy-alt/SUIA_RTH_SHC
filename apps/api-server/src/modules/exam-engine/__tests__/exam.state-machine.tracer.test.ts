import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExamStateMachine } from '../exam.state-machine';
import { db, exams } from '@quiz/db';

// Mock withSpan before importing files that use it
vi.mock('@/lib/tracer', () => ({
  withSpan: vi.fn((name, fn) => fn({ setAttribute: vi.fn(), setStatus: vi.fn() })),
}));

import { withSpan } from '@/lib/tracer';

vi.mock('@quiz/db', () => ({
  db: {
    query: {
      exams: {
        findFirst: vi.fn(),
      },
    },
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn().mockResolvedValue({}),
      })),
    })),
  },
  exams: {
    id: 'exam_id_field',
    status: 'exam_status_field',
    userId: 'exam_user_id_field',
  },
}));

describe('ExamStateMachine Tracing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call withSpan when transitioning state', async () => {
    // Setup: mocking findFirst to return a valid exam
    (db.query.exams.findFirst as any).mockResolvedValue({
      id: 'exam-123',
      status: 'started',
      userId: 'user-456'
    });

    await ExamStateMachine.transition('exam-123', 'completed', 'user-456');

    expect(withSpan).toHaveBeenCalledWith('ExamStateMachine.transition', expect.any(Function));
  });
});
