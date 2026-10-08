import { describe, it, expect } from 'vitest';

vi.mock('@quiz/db', () => ({ exams: {}, STANDARD_QUERY_TIMEOUT: 15000, QUICK_QUERY_TIMEOUT: 5000, withTimeout: undefined }));

describe('ExamEngine withTimeout fallback import', () => {
  it('imports without db.withTimeout export', async () => {
    const mod = await import('../exam.engine');
    expect(mod).toBeDefined();
  }, 15000);
});
