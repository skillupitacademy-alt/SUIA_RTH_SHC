import { describe, it, expect } from 'vitest';
import { AnswerEvaluationEngine } from '../answer.engine';

describe('AnswerEvaluationEngine guards', () => {
  it('returns false when userAnswer is empty', () => {
    const res = AnswerEvaluationEngine.evaluate('mcq', 'A', '');
    expect(res).toBe(false);
  });

  it('falls back to default comparison for unknown type', () => {
    // @ts-expect-error intentionally passing unexpected type to hit default branch
    const res = AnswerEvaluationEngine.evaluate('essay', 'Hello', 'Hello');
    expect(res).toBe(true);
  });
});

