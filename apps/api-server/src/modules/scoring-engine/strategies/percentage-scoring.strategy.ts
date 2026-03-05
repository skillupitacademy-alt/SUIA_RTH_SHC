import type { DimensionScore, EvaluatedAnswer, IScoringStrategy } from './scoring-strategy.interface';

export class PercentageScoringStrategy implements IScoringStrategy {
  getName(): string {
    return 'percentage';
  }

  calculateOverallScore(answers: EvaluatedAnswer[]): number {
    const totalQuestions = answers.length;
    if (totalQuestions === 0) return 0;

    const totalCorrect = answers.filter(q => q.examQuestion.isCorrect === true).length;
    return Math.round((totalCorrect / totalQuestions) * 100);
  }

  calculateDimensionScores(answers: EvaluatedAnswer[], dimensions: Record<string, { total: number; correct: number; name?: string }>): DimensionScore[] {
    return Object.entries(dimensions).map(([key, stats]) => {
      const parts = key.split(':');
      const type = parts[0];
      const id = parts.slice(1).join(':');

      const accuracyValue = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
      
      return {
        type,
        id,
        name: stats.name,
        score: accuracyValue,
        accuracy: accuracyValue,
        total: stats.total,
        correct: stats.correct
      };
    });
  }
}
