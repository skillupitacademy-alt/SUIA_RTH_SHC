import type { DimensionScore, EvaluatedAnswer, IScoringStrategy } from './scoring-strategy.interface';

export class WeightedScoringStrategy implements IScoringStrategy {
  getName(): string {
    return 'weighted';
  }

  private getWeight(difficulty: string | null): number {
    switch (difficulty) {
      case 'expert': return 3;
      case 'intermediate': return 2;
      case 'simple': return 1;
      default: return 1;
    }
  }

  calculateOverallScore(answers: EvaluatedAnswer[]): number {
    if (answers.length === 0) return 0;

    let totalWeight = 0;
    let earnedWeight = 0;

    for (const ans of answers) {
      const weight = this.getWeight(ans.question.difficulty);
      totalWeight += weight;
      if (ans.examQuestion.isCorrect === true) {
        earnedWeight += weight;
      }
    }

    return totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;
  }

  calculateDimensionScores(answers: EvaluatedAnswer[], dimensions: Record<string, { total: number; correct: number; name?: string }>): DimensionScore[] {
    // For dimensions, we use the weighted stats computed in the caller
    return Object.entries(dimensions).map(([key, stats]) => {
      const parts = key.split(':');
      return {
        type: parts[0],
        id: parts.slice(1).join(':'),
        name: stats.name,
        score: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
        accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
        total: stats.total,
        correct: stats.correct
      };
    });
  }
}
