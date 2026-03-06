import type { IAnswerEvaluator } from './evaluator.interface';

export class MCQEvaluator implements IAnswerEvaluator {
  evaluate(correctAnswer: string, userAnswer: string): number {
    return correctAnswer.trim().toLowerCase() === userAnswer.trim().toLowerCase() ? 1 : 0;
  }
}
