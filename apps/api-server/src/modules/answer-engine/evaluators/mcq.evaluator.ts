import type { IAnswerEvaluator } from './evaluator.interface';

export class MCQEvaluator implements IAnswerEvaluator {
  evaluate(correctAnswer: string, userAnswer: string): boolean {
    return correctAnswer.trim().toLowerCase() === userAnswer.trim().toLowerCase();
  }
}
