import { getEvaluator } from './evaluators/evaluator.registry';

export class AnswerEvaluationEngine {
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
}
