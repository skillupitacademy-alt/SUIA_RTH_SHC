import { describe, it, expect } from 'vitest';
import { AnswerEvaluationEngine } from '../answer.engine';

describe('AnswerEvaluationEngine edge branches', () => {
  it('returns false when userAnswer is empty (line 18)', () => {
    expect(AnswerEvaluationEngine.evaluate('mcq', 'A', '')).toBe(false);
  });

  it('falls through default when type is unknown (line 31)', () => {
    // @ts-expect-error intentional unknown type to hit default branch
    expect(AnswerEvaluationEngine.evaluate('essay', 'foo', 'foo')).toBe(true);
  });
});
