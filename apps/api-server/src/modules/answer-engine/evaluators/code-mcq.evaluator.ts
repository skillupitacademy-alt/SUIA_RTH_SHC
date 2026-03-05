import type { IAnswerEvaluator } from './evaluator.interface';

export class CodeMCQEvaluator implements IAnswerEvaluator {
  evaluate(correctAnswer: string, userAnswer: string): boolean {
    return this.normalizeCode(correctAnswer) === this.normalizeCode(userAnswer);
  }

  private normalizeCode(code: string): string {
    return code.replace(/\s+/g, ' ').trim();
  }
}
