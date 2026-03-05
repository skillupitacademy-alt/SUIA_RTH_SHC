import type { DimensionScore, EvaluatedAnswer, IScoringStrategy } from './scoring-strategy.interface';

export class IRTScoringStrategy implements IScoringStrategy {
  getName(): string {
    return 'irt';
  }

  calculateOverallScore(answers: EvaluatedAnswer[]): number {
    if (answers.length === 0) return 0;

    let earnedValue = 0;
    let totalValue = 0;

    for (const ans of answers) {
      const difficulty = ans.question.difficulty || 'simple';
      
      // Simplified IRT logic:
      // Correct on hard = +++ (high gain)
      // Wrong on easy = --- (high penalty)
      // Values: expert=3, intermediate=2, simple=1
      const complexity = difficulty === 'expert' ? 1.5 : (difficulty === 'intermediate' ? 1.2 : 1.0);
      
      if (ans.examQuestion.isCorrect === true) {
        earnedValue += 1 * complexity;
      } else {
        // Penalty for missing easy questions is higher in some IRT models, 
        // but here we just use complexity-adjusted gain.
      }
      totalValue += 1 * complexity;
    }

    return totalValue > 0 ? Math.round((earnedValue / totalValue) * 100) : 0;
  }

  calculateDimensionScores(answers: EvaluatedAnswer[], dimensions: Record<string, { total: number; correct: number; name?: string }>): DimensionScore[] {
    return Object.entries(dimensions).map(([key, stats]) => {
      return {
        type: key.split(':')[0],
        id: key.split(':').slice(1).join(':'),
        name: stats.name,
        score: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
        accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
        total: stats.total,
        correct: stats.correct
      };
    });
  }
}
