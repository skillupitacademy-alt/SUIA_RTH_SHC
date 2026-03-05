import type { IScoringStrategy, EvaluatedAnswer, DimensionScore } from './scoring-strategy.interface';

/**
 * MasteryScoringStrategy
 * Buckets scores into levels: Novice (<50%), Apprentice (50-69%), Professional (70-89%), Master (90%+)
 */
export class MasteryScoringStrategy implements IScoringStrategy {
  getName(): string {
    return 'mastery';
  }

  calculateOverallScore(answers: EvaluatedAnswer[]): number {
    if (answers.length === 0) return 0;
    const correct = answers.filter(a => a.examQuestion.isCorrect).length;
    const percentage = (correct / answers.length) * 100;
    
    // We still return a raw percentage as the "score" but we could also 
    // encode mastery levels if the schema supported it. For now, we align with the 0-100 range.
    return Math.round(percentage);
  }

  calculateDimensionScores(answers: EvaluatedAnswer[], dimensions: Record<string, { total: number; correct: number; name?: string }>): DimensionScore[] {
    return Object.entries(dimensions).map(([key, data]) => {
      const [type, id] = key.split(':');
      const accuracy = data.total > 0 ? (data.correct / data.total) * 100 : 0;
      
      // Traditional scoring for the accuracy field
      return {
        type,
        id,
        name: data.name || id,
        accuracy: Math.round(accuracy),
        score: Math.round(accuracy), // In Mastery, we might eventually use a different scale (1-4)
        total: data.total,
        correct: data.correct,
      };
    });
  }
}
