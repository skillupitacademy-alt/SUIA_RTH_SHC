import type { DimensionScore, EvaluatedAnswer, IScoringStrategy } from './scoring-strategy.interface';

export class IRTScoringStrategy implements IScoringStrategy {
  getName(): string {
    return 'irt';
  }

  calculateOverallScore(answers: EvaluatedAnswer[]): number {
    if (answers.length === 0) return 0;

    let abilityEstimator = 0;
    let totalPotential = 0;

    for (const ans of answers) {
      const difficulty = ans.question.difficulty || 'simple';
      
      /**
       * Refined IRT (1PL Weighting):
       * We assign 'difficulty weights' (betas): 
       * Simple: 0.5, Intermediate: 1.0, Expert: 2.0
       */
      const beta = difficulty === 'expert' ? 2.0 : (difficulty === 'intermediate' ? 1.0 : 0.5);
      
      if (ans.examQuestion.isCorrect === true) {
        // Correct answer on hard question gives much higher ability signal
        abilityEstimator += beta;
      } else {
        // Missing a simple question is a significant negative signal
        // We subtract a small portion of the weight as a penalty
        abilityEstimator -= (2.5 - beta) * 0.1;
      }
      totalPotential += beta;
    }

    // Normalize to 0-100 scale but clamp to logical bounds
    const rawScore = totalPotential > 0 ? (abilityEstimator / totalPotential) * 100 : 0;
    return Math.min(100, Math.max(0, Math.round(rawScore)));
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
