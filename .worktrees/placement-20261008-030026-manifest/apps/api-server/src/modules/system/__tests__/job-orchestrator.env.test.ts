import { describe, it, expect } from 'vitest';
import { JobOrchestrator } from '../job-orchestrator';

describe('JobOrchestrator processOnce env guard', () => {
  it('returns early when NODE_ENV is not test (line 16)', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const res = await JobOrchestrator.processOnce('j-env', 'u-env');
    expect(res).toBeUndefined();
    process.env.NODE_ENV = originalEnv;
  });
});
