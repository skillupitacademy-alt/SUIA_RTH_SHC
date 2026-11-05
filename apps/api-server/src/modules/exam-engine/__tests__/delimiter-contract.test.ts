import { expect, it, vi } from 'vitest';
vi.mock('@quiz/db', () => ({ db: {}, exams: {}, examQuestions: {}, examBlueprints: {}, idempotencyKeys: {}, withTimeout: (p: unknown) => p }));
vi.mock('@/lib/logger', () => ({ logger: { child: () => ({}) } }));
vi.mock('@/modules/core/container', () => ({ container: { get: () => ({ checkIdempotency() {}, composeExam() {}, invalidateCache() {} }) } }));
vi.mock('@/lib/event-bus', () => ({ eventBus: {} }));
vi.mock('@/modules/selection-engine/selection.service', () => ({ SelectionService: class {} }));
vi.mock('../exam.builder', () => ({ ExamBuilder: class {} }));
vi.mock('../repositories/exam.repository', () => ({ ExamRepository: class {} }));
vi.mock('../../report-engine/performance.service', () => ({ PerformanceService: class {} }));
import { ExamEngine } from '../exam.engine';
import { MultiSelectEvaluator } from '../../answer-engine/evaluators/multi-select.evaluator';

it('does not credit an incorrect option that matches part of a comma-containing correct option', () => {
  const engine = new ExamEngine() as unknown as {
    resolveAnswerForScoring(q: unknown, answer: string): string;
    resolveCorrectAnswerForScoring(q: unknown): string;
  };
  const evaluator = new MultiSelectEvaluator();
  const question = { type: 'multi_select', correctAnswer: '', options: [
    { id: '1', text: 'red, blue', isCorrect: true },
    { id: '2', text: 'red', isCorrect: false },
  ] };
  const correct = engine.resolveCorrectAnswerForScoring(question);
  expect(evaluator.evaluate(correct, engine.resolveAnswerForScoring(question, '1'))).toBe(1);
  expect(evaluator.evaluate(correct, engine.resolveAnswerForScoring(question, '2'))).toBe(0);
});

it('preserves ordinary non-comma option scoring', () => {
  const engine = new ExamEngine() as unknown as {
    resolveAnswerForScoring(q: unknown, answer: string): string;
    resolveCorrectAnswerForScoring(q: unknown): string;
  };
  const evaluator = new MultiSelectEvaluator();
  const question = { type: 'multi_select', correctAnswer: '', options: [
    { id: '1', text: 'blue', isCorrect: true },
    { id: '2', text: 'red', isCorrect: false },
  ] };
  const correct = engine.resolveCorrectAnswerForScoring(question);
  expect(evaluator.evaluate(correct, engine.resolveAnswerForScoring(question, '1'))).toBe(1);
  expect(evaluator.evaluate(correct, engine.resolveAnswerForScoring(question, '2'))).toBe(0);
});
