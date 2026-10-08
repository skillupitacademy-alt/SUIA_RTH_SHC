import { describe, it, expect } from 'vitest';

vi.mock('@quiz/db', () => ({ exams: {}, resultsByDimension: {}, REPORT_QUERY_TIMEOUT: 30000, withTimeout: undefined }));

describe('ScoringEngine withTimeout fallback import', () => {
  it('imports without db.withTimeout export', async () => {
    const mod = await import('../scoring.engine');
    expect(mod).toBeDefined();
  }, 15000);
});
