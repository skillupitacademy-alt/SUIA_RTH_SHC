import { expect, it, vi } from 'vitest';
vi.mock('@quiz/db', () => ({ db: {}, exams: {}, examQuestions: {}, examBlueprints: {}, idempotencyKeys: {}, withTimeout: (p: unknown) => p }));
vi.mock('@/lib/logger', () => ({ logger: { child: () => ({}) } }));
vi.mock('@/modules/core/container', () => ({ container: { get: () => ({ checkIdempotency() {}, composeExam() {}, invalidateCache() {} }) } }));
vi.mock('@/lib/event-bus', () => ({ eventBus: {} }));
vi.mock('@/modules/selection-engine/selection.service', () => ({ SelectionService: class {} }));
vi.mock('@/modules/exam-engine/exam.builder', () => ({ ExamBuilder: class {} }));
vi.mock('@/modules/exam-engine/repositories/exam.repository', () => ({ ExamRepository: class {} }));
vi.mock('@/modules/report-engine/performance.service', () => ({ PerformanceService: class {} }));
import { ExamEngine } from '../apps/api-server/src/modules/exam-engine/exam.engine';
import { MultiSelectEvaluator } from '../apps/api-server/src/modules/answer-engine/evaluators/multi-select.evaluator';

const engine = new ExamEngine() as unknown as {
  resolveAnswerForScoring(q: unknown, answer: string): string;
  resolveCorrectAnswerForScoring(q: unknown): string;
};
const question = { type: 'multi_select', correctAnswer: '', options: [
  { id: 'correct-id', text: 'not-an-option-id', isCorrect: true },
  { id: 'wrong-id', text: 'different option', isCorrect: false },
] };
it('retains valid versioned option-ID credit through the real immediate resolver', () => {
  expect(new MultiSelectEvaluator().evaluate(engine.resolveCorrectAnswerForScoring(question),
    engine.resolveAnswerForScoring(question, 'v1:ids:correct-id'))).toBe(1);
});
it('does not credit an unknown versioned option ID that equals the correct display text', () => {
  let score = 0;
  try {
    score = new MultiSelectEvaluator().evaluate(engine.resolveCorrectAnswerForScoring(question),
      engine.resolveAnswerForScoring(question, 'v1:ids:not-an-option-id'));
  } catch { /* Explicit validation denial is acceptable. */ }
  expect(score).toBe(0);
});
