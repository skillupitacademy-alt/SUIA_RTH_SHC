import type { IAnswerEvaluator } from './evaluator.interface';

export class CodeMCQEvaluator implements IAnswerEvaluator {
  evaluate(correctAnswer: string, userAnswer: string): number {
    return this.normalizeCode(correctAnswer) === this.normalizeCode(userAnswer) ? 1 : 0;
  }

  private normalizeCode(code: string): string {
    return code.replace(/\s+/g, ' ').trim();
  }
}
