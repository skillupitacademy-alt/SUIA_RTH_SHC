import { container } from '../core/container';
import { EvaluatorFactory } from './evaluators/evaluator.factory';

export class AnswerEvaluationEngine {
  private static instance = new AnswerEvaluationEngine();

  /**
   * Strategy-based evaluation. Returns boolean for strict correctness (threshold > 0.8).
   */
  evaluate(type: string, correctAnswer: string, userAnswer: string): boolean {
    const score = this.evaluateForScore(type, correctAnswer, userAnswer);
    return score >= 0.8; // High threshold for "Strict Correctness"
  }

  /**
   * New: Returns the actual numeric score (0.0 to 1.0).
   */
  evaluateForScore(type: string, correctAnswer: string, userAnswer: string): number {
    if (typeof correctAnswer !== 'string' || typeof userAnswer !== 'string' || !userAnswer) return 0;
    const evaluator = container.get(EvaluatorFactory).getEvaluator(type);
    return evaluator.evaluate(correctAnswer, userAnswer);
  }

  /**
   * Placeholder for Partial Scoring logic.
   */
  calculatePartialScore(type: string, correctAnswer: string, userAnswer: string): number {
    return this.evaluateForScore(type, correctAnswer, userAnswer);
  }

  // Legacy static facades
  static evaluate(type: string, correctAnswer: string, userAnswer: string): boolean {
    return this.instance.evaluate(type, correctAnswer, userAnswer);
  }

  static evaluateForScore(type: string, correctAnswer: string, userAnswer: string): number {
    return this.instance.evaluateForScore(type, correctAnswer, userAnswer);
  }

  static calculatePartialScore(type: string, correctAnswer: string, userAnswer: string): number {
    return this.instance.calculatePartialScore(type, correctAnswer, userAnswer);
  }
}
