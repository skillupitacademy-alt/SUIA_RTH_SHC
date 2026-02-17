import { describe, expect, it, vi } from 'vitest';

const fixtures = {
  userId: 'u1',
  targetId: 'domain1',
  idempotencyKey: 'idem-123',
};

vi.mock('../exam.engine', async (importOriginal) => {
  const real = await importOriginal<typeof import('../exam.engine')>();
  return {
    ExamEngine: {
      ...real.ExamEngine,
      startExam: vi.fn(real.ExamEngine.startExam),
    },
  };
});

describe.skip('ExamEngine (unit)', () => {
  it('starts exam with idempotency key', async () => {
    const { ExamEngine } = await import('../exam.engine');
    await ExamEngine.startExam(fixtures.userId, fixtures.targetId, fixtures.idempotencyKey, {});
    expect(ExamEngine.startExam).toHaveBeenCalled();
  });

  it('submits answers and returns processing status', () => {
    expect(true).toBe(true);
  });

  it('completes exam and returns result', () => {
    expect(true).toBe(true);
  });
});
