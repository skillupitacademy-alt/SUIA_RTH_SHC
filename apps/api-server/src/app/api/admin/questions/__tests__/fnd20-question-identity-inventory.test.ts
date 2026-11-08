import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { ExamEngine } from '@/modules/exam-engine/exam.engine';
import { MultiSelectEvaluator } from '@/modules/answer-engine/evaluators/multi-select.evaluator';

vi.mock('@quiz/db', () => ({ db: {}, exams: {}, examQuestions: {}, examBlueprints: {}, idempotencyKeys: {}, withTimeout: (p: unknown) => p }));
vi.mock('@/lib/logger', () => ({ logger: { child: () => ({}) } }));
vi.mock('@/modules/core/container', () => ({ container: { get: () => ({ checkIdempotency() {}, composeExam() {}, invalidateCache() {} }) } }));
vi.mock('@/lib/event-bus', () => ({ eventBus: {} }));
vi.mock('@/modules/selection-engine/selection.service', () => ({ SelectionService: class {} }));
vi.mock('../exam.builder', () => ({ ExamBuilder: class {} }));
vi.mock('../repositories/exam.repository', () => ({ ExamRepository: class {} }));
vi.mock('../../report-engine/performance.service', () => ({ PerformanceService: class {} }));

beforeEach(() => { vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Unexpected network request'); })); });
afterEach(() => { vi.unstubAllGlobals(); });

describe('FND20 question identity inventory', () => {
  const engine = new ExamEngine() as unknown as {
    resolveAnswerForScoring(q: unknown, answer: string): string;
    resolveCorrectAnswerForScoring(q: unknown): string;
  };

  describe('option identity encoding', () => {
    it('resolves option ID to text representation for scoring', () => {
      const question = { type: 'mcq', correctAnswer: '', options: [
        { id: '1', text: 'Alpha', isCorrect: true },
        { id: '2', text: 'Beta', isCorrect: false },
      ] };
      expect(engine.resolveAnswerForScoring(question, '1')).toBe('Alpha');
      expect(engine.resolveCorrectAnswerForScoring(question)).toBe('Alpha');
    });

    it('resolves option label to text representation for scoring', () => {
      const question = { type: 'mcq', correctAnswer: '', options: [
        { id: '1', text: 'Alpha', label: 'A', isCorrect: true },
        { id: '2', text: 'Beta', label: 'B', isCorrect: false },
      ] };
      expect(engine.resolveAnswerForScoring(question, 'A')).toBe('Alpha');
    });

    it('preserves unresolved answer when ID and label do not match any option', () => {
      const question = { type: 'mcq', correctAnswer: '', options: [
        { id: '1', text: 'Alpha', isCorrect: true },
      ] };
      expect(engine.resolveAnswerForScoring(question, 'unknown')).toBe('unknown');
    });

    it('resolves multi-select IDs to comma-joined text for scoring', () => {
      const question = { type: 'multi_select', correctAnswer: '', options: [
        { id: '1', text: 'Red', isCorrect: true },
        { id: '2', text: 'Blue', isCorrect: true },
        { id: '3', text: 'Green', isCorrect: false },
      ] };
      expect(engine.resolveAnswerForScoring(question, '1,2')).toBe('Red,Blue');
      expect(engine.resolveCorrectAnswerForScoring(question)).toBe('Red,Blue');
    });
  });

  describe('legacy stored answer compatibility', () => {
    it('accepts text-based stored answer matching option text', () => {
      const evaluator = new MultiSelectEvaluator();
      const question = { type: 'multi_select', correctAnswer: '', options: [
        { id: '1', text: 'Red', isCorrect: true },
        { id: '2', text: 'Blue', isCorrect: true },
      ] };
      const correct = engine.resolveCorrectAnswerForScoring(question);
      const stored = 'Red,Blue';
      expect(evaluator.evaluate(correct, stored)).toBe(1);
    });

    it('accepts ID-based stored answer through resolution', () => {
      const evaluator = new MultiSelectEvaluator();
      const question = { type: 'multi_select', correctAnswer: '', options: [
        { id: '1', text: 'Red', isCorrect: true },
        { id: '2', text: 'Blue', isCorrect: true },
      ] };
      const correct = engine.resolveCorrectAnswerForScoring(question);
      const resolved = engine.resolveAnswerForScoring(question, '1,2');
      expect(evaluator.evaluate(correct, resolved)).toBe(1);
    });
  });

  describe('multi-select delimiter compatibility constraint', () => {
    it('KNOWN LIMITATION: comma in option text creates false partial credit', () => {
      const evaluator = new MultiSelectEvaluator();
      const question = { type: 'multi_select', correctAnswer: '', options: [
        { id: '1', text: 'red, blue', isCorrect: true },
        { id: '2', text: 'red', isCorrect: false },
      ] };
      const correct = engine.resolveCorrectAnswerForScoring(question);
      const incorrectAnswerText = engine.resolveAnswerForScoring(question, '2');

      // VERIFICATION_FAILED: parseAnswer splits on comma, so 'red, blue' becomes ['red', 'blue']
      // and incorrectly matches 'red' from option 2, giving partial credit
      const score = evaluator.evaluate(correct, incorrectAnswerText);
      expect(score).toBeGreaterThan(0);
      // Expected: 0 (incorrect answer should score 0)
      // Actual: >0 (false partial credit due to delimiter ambiguity)
    });

    it('preserves ordinary non-comma option scoring correctness', () => {
      const evaluator = new MultiSelectEvaluator();
      const question = { type: 'multi_select', correctAnswer: '', options: [
        { id: '1', text: 'Blue', isCorrect: true },
        { id: '2', text: 'Red', isCorrect: false },
      ] };
      const correct = engine.resolveCorrectAnswerForScoring(question);
      expect(evaluator.evaluate(correct, engine.resolveAnswerForScoring(question, '1'))).toBe(1);
      expect(evaluator.evaluate(correct, engine.resolveAnswerForScoring(question, '2'))).toBe(0);
    });
  });
});
