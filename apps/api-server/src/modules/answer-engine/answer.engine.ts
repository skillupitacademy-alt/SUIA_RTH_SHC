export class AnswerEvaluationEngine {
  /**
   * Robust evaluation for various question types.
   */
  static evaluate(type: 'mcq' | 'code_mcq', correctAnswer: string, userAnswer: string): boolean {
    if (!userAnswer) return false;

    switch (type) {
      case 'mcq':
        return correctAnswer.trim().toLowerCase() === userAnswer.trim().toLowerCase();
      
      case 'code_mcq':
        // Code MCQs might need normalized comparison (ignoring whitespace differences if it's snippet-based)
        // For now, strict match or normalized match
        return this.normalizeCode(correctAnswer) === this.normalizeCode(userAnswer);

      default:
        return correctAnswer === userAnswer;
    }
  }

  private static normalizeCode(code: string): string {
    return code.replace(/\s+/g, ' ').trim();
  }

  /**
   * Placeholder for Partial Scoring logic.
   */
  static calculatePartialScore(_type: string, _options: unknown, _selection: unknown): number {
    // Future implementation for Multi-Select MCQs
    return 0;
  }
}
