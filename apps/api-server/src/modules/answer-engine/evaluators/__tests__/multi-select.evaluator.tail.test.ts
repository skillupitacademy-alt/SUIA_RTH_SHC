import { describe, expect, it } from 'vitest';

import { MultiSelectEvaluator } from '../multi-select.evaluator';

describe('MultiSelectEvaluator guards', () => {
  it('returns zero when either answer is missing', () => {
    const evaluator = new MultiSelectEvaluator();
    expect(evaluator.evaluate('', 'a,b')).toBe(0);
    expect(evaluator.evaluate('a,b', '')).toBe(0);
  });

  it('handles normalization and wrong-option penalty', () => {
    const evaluator = new MultiSelectEvaluator();
    expect(evaluator.evaluate('A, B ,C', 'a, c')).toBeCloseTo(2 / 3, 5);
    expect(evaluator.evaluate('A,B,C', 'A,B,C,D')).toBeCloseTo(2 / 3, 5);
  });
});
