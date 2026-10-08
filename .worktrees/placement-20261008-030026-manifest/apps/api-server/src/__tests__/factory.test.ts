import { describe, it, expect } from 'vitest';
import { EvaluatorFactory } from '../../src/modules/answer-engine/evaluators/evaluator.factory';
import { MCQEvaluator } from '../../src/modules/answer-engine/evaluators/mcq.evaluator';
import { CodeMCQEvaluator } from '../../src/modules/answer-engine/evaluators/code-mcq.evaluator';
import { MultiSelectEvaluator } from '../../src/modules/answer-engine/evaluators/multi-select.evaluator';

describe('Layer 67: Factory Pattern (Evaluators) Verification', () => {
    
  it('EvaluatorFactory should initialize with built-in evaluators', () => {
    const factory = new EvaluatorFactory();
    
    // Test base types
    expect(factory.getEvaluator('mcq')).toBeInstanceOf(MCQEvaluator);
    expect(factory.getEvaluator('code_mcq')).toBeInstanceOf(CodeMCQEvaluator);
    expect(factory.getEvaluator('multi_select')).toBeInstanceOf(MultiSelectEvaluator);
  });

  it('EvaluatorFactory should gracefully fallback to DefaultEvaluator for unknown types', () => {
    const factory = new EvaluatorFactory();
    
    // 'unknown_type' does not exist
    const evaluator = factory.getEvaluator('unknown_type');
    
    // The DefaultEvaluator just does strict string matching
    expect(evaluator.evaluate('correct', 'correct')).toBe(1);
    expect(evaluator.evaluate('correct', 'wrong')).toBe(0);
    
    // It should NOT be an MCQ evaluator
    expect(evaluator).not.toBeInstanceOf(MCQEvaluator);
  });

  it('EvaluatorFactory should allow runtime registration of new evaluators', () => {
    const factory = new EvaluatorFactory();
    
    // Create a mock evaluator for a new custom question type
    class DragAndDropEvaluator {
        evaluate(correct: string, user: string) { return 0.5; }
    }
    
    factory.registerEvaluator('drag_and_drop', new DragAndDropEvaluator());
    
    const newEvaluator = factory.getEvaluator('drag_and_drop');
    expect(newEvaluator).toBeInstanceOf(DragAndDropEvaluator);
    expect(newEvaluator.evaluate('any', 'any')).toBe(0.5);
  });
});
