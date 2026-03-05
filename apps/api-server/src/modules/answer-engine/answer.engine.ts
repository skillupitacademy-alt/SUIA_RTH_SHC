import { getEvaluator } from './evaluators/evaluator.registry';

export class AnswerEvaluationEngine {
  private static instance = new AnswerEvaluationEngine();

  /**
   * Strategy-based evaluation for various question types.
   */
  evaluate(type: 'mcq' | 'code_mcq' | string, correctAnswer: string, userAnswer: string): boolean {
    if (!userAnswer) return false;

    const evaluator = getEvaluator(type);
    return evaluator.evaluate(correctAnswer, userAnswer);
  }

  /**
   * Placeholder for Partial Scoring logic. (To be refactored next)
   */
  calculatePartialScore(_type: string, _options: unknown, _selection: unknown): number {
    // Future implementation for Multi-Select MCQs
    return 0;
  }

  // Legacy static facades for tests
  static evaluate(type: 'mcq' | 'code_mcq' | string, correctAnswer: string, userAnswer: string): boolean {
    return this.instance.evaluate(type, correctAnswer, userAnswer);
  }

  static calculatePartialScore(_type: string, _options: unknown, _selection: unknown): number {
    return this.instance.calculatePartialScore(_type, _options, _selection);
  }
}
