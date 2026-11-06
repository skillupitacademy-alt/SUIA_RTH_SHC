import { parseAnswer } from '@/modules/question/question-contract';

import type { IAnswerEvaluator } from './evaluator.interface';

/**
 * Evaluates Multiple Selection questions with partial credit.
 * Correct answers and user answers should be comma-separated strings of IDs or labels.
 */
export class MultiSelectEvaluator implements IAnswerEvaluator {
  evaluate(correctAnswer: string, userAnswer: string): number {
    if (!correctAnswer || !userAnswer) return 0;

    const parsedCorrect = parseAnswer(correctAnswer).map((item) => item.toLowerCase());
    const parsedUser = parseAnswer(userAnswer).map((item) => item.toLowerCase());
    if (parsedCorrect.length === 0 || parsedUser.length === 0) return 0;

    // Reject duplicate option selections in a single submission
    if (new Set(parsedUser).size !== parsedUser.length) {
      return 0;
    }

    const correctSet = new Set(parsedCorrect);
    const userSet = new Set(parsedUser);

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
