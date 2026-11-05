import { expect, it, vi } from 'vitest';
vi.mock('@/modules/core/container', () => ({ container: { get: vi.fn() } }));
import { container } from '@/modules/core/container';
import { AnswerEvaluationEngine } from '../answer.engine';
import { EvaluatorFactory } from '../evaluators/evaluator.factory';
it('characterizes current multi-select scoring and boolean threshold', () => {
  vi.mocked(container.get).mockReturnValue(new EvaluatorFactory() as never);
  const engine = new AnswerEvaluationEngine();
  expect(engine.evaluateForScore('multi_select', 'A,B,C,D,E', 'A,B,C,D,E')).toBe(1);
  expect(engine.evaluateForScore('multi_select', 'A,B,C,D,E', 'A,B,C,D')).toBe(0.8);
  expect(engine.evaluate('multi_select', 'A,B,C,D,E', 'A,B,C,D')).toBe(true);
  expect(engine.evaluate('multi_select', 'A,B,C,D,E', 'A,B,C')).toBe(false);
  expect(engine.evaluateForScore('multi_select', 'A,B,C,D,E', 'A,B,C,D,E,X')).toBe(0.8);
});
