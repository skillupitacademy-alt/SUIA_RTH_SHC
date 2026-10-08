import { TopicPerformance, UserAnalyticsSnapshot } from "../analytics/user-analytics.service";

export interface AdaptiveBlueprint {
  topics: { topicId: string; count: number }[];
  difficulty: { simple: number; intermediate: number; expert: number };
  totalQuestions: number;
  mode: "adaptive";
  pacingPreference: "scenario" | "short" | "standard";
}

export class AdaptiveBlueprintService {
  /**
   * Generates a dynamic blueprint based on user analytics.
   */
  static generate(snapshot: UserAnalyticsSnapshot, totalQuestions: number = 10): AdaptiveBlueprint {
    const topicWeights = this.calculateTopicWeights(snapshot.topics);
    const difficultyDist = this.calculateDifficultyDistribution(snapshot.difficulty);
    const pacingPreference = this.calculatePacingPreference(snapshot.pacing);

    // Question Count Split across Topics
    const topicsWithCounts = this.splitQuestionCounts(topicWeights, totalQuestions);

    return {
      topics: topicsWithCounts,
      difficulty: difficultyDist,
      totalQuestions,
      mode: "adaptive",
      pacingPreference
    };
  }

  private static calculateTopicWeights(topics: TopicPerformance[]): { topicId: string; weight: number }[] {
    if (topics.length === 0) return [];

    // 1. Calculate Weakness (100 - accuracy)
    const topicWeaknesses = topics.map(t => ({
      topicId: t.topicId,
      weakness: Math.max(1, 100 - t.accuracy) // Floor at 1 to avoid zero weights
    }));

    const totalWeakness = topicWeaknesses.reduce((sum, t) => sum + t.weakness, 0);

    // 2. Initial Weight Calculation & Rules
    const weights = topicWeaknesses.map(t => ({
      topicId: t.topicId,
      weight: (t.weakness / totalWeakness) * 100
    }));

    // Rule: Minimum 10%, Maximum 40%
    // This is tricky with multiple topics. We'll clamp and redistribute.
    let distributed = false;
    let iterations = 0;
    while (!distributed && iterations < 5) {
      let overflow = 0;
      let underflow = 0;
      let normalizers = 0;

      weights.forEach(w => {
        if (w.weight > 40) {
          overflow += w.weight - 40;
          w.weight = 40;
        } else if (w.weight < 10) {
          underflow += 10 - w.weight;
          w.weight = 10;
        } else {
          normalizers++;
        }
      });

      const netRedistribute = overflow - underflow;
      if (Math.abs(netRedistribute) < 0.1 || normalizers === 0) {
        distributed = true;
      } else {
        const adjustment = netRedistribute / normalizers;
        weights.forEach(w => {
          if (w.weight > 10 && w.weight < 40) {
            w.weight += adjustment;
          }
        });
      }
      iterations++;
    }

    return weights;
  }

  private static calculateDifficultyDistribution(accuracy: { simple: number; intermediate: number; expert: number }) {
    let simple = 30;
    let intermediate = 40;
    let expert = 30;

    // Rule: Promotion
    if (accuracy.simple >= 80 && accuracy.intermediate >= 65) {
      expert += 10;
      simple -= 10;
    }

    // Rule: Expert Floor
    if (expert < 40) {
      const diff = 40 - expert;
      expert = 40;
      // Remainder adjusted from intermediate
      intermediate = Math.max(10, intermediate - diff);
    }

    // Rule: Beginner Safety
    if (accuracy.simple < 60) {
      simple = 50;
      intermediate = 40;
      expert = 10;
    }

    // Ensure sum is 100 (Final Normalized Check)
    const total = simple + intermediate + expert;
    if (total !== 100) {
        const factor = 100 / total;
        simple = Math.round(simple * factor);
        intermediate = Math.round(intermediate * factor);
        expert = 100 - simple - intermediate;
    }

    return { simple, intermediate, expert };
  }

  private static calculatePacingPreference(pacing: UserAnalyticsSnapshot["pacing"]): AdaptiveBlueprint["pacingPreference"] {
    if (!pacing) return "standard";

    // Rule: If median_time < 10 seconds -> Prefer scenario questions
    if (pacing.median < 10) return "scenario";

    // Rule: If median_time > 60 seconds -> Prefer shorter MCQs
    if (pacing.median > 60) return "short";

    return "standard";
  }

  private static splitQuestionCounts(weights: { topicId: string; weight: number }[], totalQuestions: number) {
    if (weights.length === 0) return [];

    const result = weights.map(w => ({
      topicId: w.topicId,
      count: Math.floor((w.weight / 100) * totalQuestions)
    }));

    // Correct rounding errors to match totalQuestions exactly
    const currentTotal = result.reduce((sum, r) => sum + r.count, 0);
    const remainder = totalQuestions - currentTotal;

    if (remainder > 0) {
      // Add to highest weight topic
      const sorted = [...weights].sort((a, b) => b.weight - a.weight);
      const topTopic = sorted[0].topicId;
      const index = result.findIndex(r => r.topicId === topTopic);
      result[index].count += remainder;
    }

    return result.filter(r => r.count > 0);
  }
}
