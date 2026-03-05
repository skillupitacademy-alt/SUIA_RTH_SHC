import type { IDimensionCalculator, QuestionDimension, ScoringDimension } from './calculator.interface';

export class DifficultyCalculator implements IDimensionCalculator {
  calculate(context: { question: QuestionDimension }): ScoringDimension[] {
    const { question: q } = context;
    const difficulty = q?.difficulty;
    if (difficulty === undefined || difficulty === null || difficulty.trim() === '') return [];

    return [{
      type: 'difficulty',
      id: difficulty,
      name: difficulty.charAt(0).toUpperCase() + difficulty.slice(1),
      weight: 1
    }];
  }
}
