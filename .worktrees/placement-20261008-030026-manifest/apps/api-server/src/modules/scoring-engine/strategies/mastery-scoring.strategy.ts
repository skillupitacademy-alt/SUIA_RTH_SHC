import type { DimensionScore, EvaluatedAnswer, IScoringStrategy } from './scoring-strategy.interface';

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
    
    // 1. Calculate base accuracy
    const correctCount = answers.filter(a => a.examQuestion.isCorrect === true).length;
    const baseAccuracy = (correctCount / answers.length) * 100;
    
    // 2. Mastery Logic: Check for Dimension Gaps
    // We group by topicId to see if they failed any specific area completely
    const dimensionGaps: Record<string, { total: number; correct: number }> = {};
    for (const ans of answers) {
      const tid = ans.question.topicId;
      if (dimensionGaps[tid] === undefined) dimensionGaps[tid] = { total: 0, correct: 0 };
      dimensionGaps[tid].total++;
      if (ans.examQuestion.isCorrect === true) dimensionGaps[tid].correct++;
    }

    let gapPenalty = 0;
    for (const data of Object.values(dimensionGaps)) {
        const dimAcc = (data.correct / data.total) * 100;
        if (dimAcc < 40 && data.total >= 3) {
            // Significant gap in a topic with at least 3 questions
            gapPenalty += 10; 
        }
    }

    const finalMasteryScore = Math.round(baseAccuracy - gapPenalty);
    return Math.min(100, Math.max(0, finalMasteryScore));
  }

  calculateDimensionScores(answers: EvaluatedAnswer[], dimensions: Record<string, { total: number; correct: number; name?: string }>): DimensionScore[] {
    return Object.entries(dimensions).map(([key, data]) => {
      const [type, id] = key.split(':');
      const accuracy = data.total > 0 ? (data.correct / data.total) * 100 : 0;
      
      return {
        type,
        id,
        name: data.name ?? id,
        accuracy: Math.round(accuracy),
        score: Math.round(accuracy),
        total: data.total,
        correct: data.correct,
      };
    });
  }
}
