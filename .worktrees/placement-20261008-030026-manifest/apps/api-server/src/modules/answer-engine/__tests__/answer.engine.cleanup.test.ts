import { describe, it, expect } from 'vitest';
import { AnswerEvaluationEngine } from '../answer.engine';

describe('AnswerEvaluationEngine early guard', () => {
  it('returns false when userAnswer is empty (line ~31)', () => {
    expect(AnswerEvaluationEngine.evaluate('mcq', 'A', '')).toBe(false);
  });
});
