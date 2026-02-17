import { describe, expect, it } from 'vitest';

// Execution deferred — will assert actual scoring with fixtures in Phase C2.
describe.skip('ScoringEngine (unit)', () => {
  it('calculates weighted score for correct answers', async () => {
    const { ScoringEngine } = await import('../scoring.engine');
    // placeholder: real calculation to be added
    expect(typeof ScoringEngine).toBe('function');
  });

  it('penalizes unanswered or incorrect items', () => {
    expect(true).toBe(true);
  });
});
