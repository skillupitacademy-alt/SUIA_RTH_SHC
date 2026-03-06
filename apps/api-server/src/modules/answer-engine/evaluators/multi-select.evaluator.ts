import type { IAnswerEvaluator } from './evaluator.interface';

/**
 * Evaluates Multiple Selection questions with partial credit.
 * Correct answers and user answers should be comma-separated strings of IDs or labels.
 */
export class MultiSelectEvaluator implements IAnswerEvaluator {
  evaluate(correctAnswer: string, userAnswer: string): number {
    if (!correctAnswer || !userAnswer) return 0;

    const correctSet = new Set(correctAnswer.split(',').map(s => s.trim().toLowerCase()));
    const userSet = new Set(userAnswer.split(',').map(s => s.trim().toLowerCase()));

    let matchedCorrect = 0;
    let incorrectSelections = 0;

    for (const item of userSet) {
      if (correctSet.has(item)) {
        matchedCorrect++;
      } else {
        incorrectSelections++;
      }
    }

    // Standard Partial Credit Logic: (Correct - Penalty for Wrong) / Total Correct
    // Penalty is often 1 per wrong answer to prevent "select everything" strategy.
    const score = (matchedCorrect - incorrectSelections) / correctSet.size;
    
    return Math.max(0, score);
  }
}
