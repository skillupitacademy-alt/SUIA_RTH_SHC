import { db, examQuestions, exams, questions } from "@quiz/db";
import { and, eq, notInArray, sql } from "drizzle-orm";

import { AdaptiveBlueprint } from "./adaptive-blueprint.service";

export interface SelectedQuestion {
  id: string;
  topicId: string;
  difficulty: "simple" | "intermediate" | "expert";
}

export class AdaptiveQuestionSelectorService {
  /**
   * Selects questions based on an adaptive blueprint, avoiding repeats.
   */
  static async selectQuestions(
    userId: string,
    blueprint: AdaptiveBlueprint
  ): Promise<string[]> {
    // 1. Get previously attempted question IDs
    const attemptedIds = (await db
      .select({ id: examQuestions.questionId })
      .from(examQuestions)
      .innerJoin(exams, eq(exams.id, examQuestions.examId))
      .where(eq(exams.userId, userId))
    ).map(r => r.id);

    const finalSelectedIds: string[] = [];
    const usedIds = new Set<string>(attemptedIds);

    // 2. Iterate through topic splits
    for (const topicSplit of blueprint.topics) {
      let remainingForTopic = topicSplit.count;

      // Inner loop: Difficulty buckets for this topic
      // We prioritize the difficulty distribution from the blueprint
      const difficulties: ("simple" | "intermediate" | "expert")[] = ["simple", "intermediate", "expert"];
      
      for (const diff of difficulties) {
        // Calculate target count for this specific topic+difficulty bucket
        // (totalQuestions * diffPercent * topicWeight)
        // In the blueprint, we already have topic count and difficulty percent.
        // We'll approximate: topicCount * (blueprintDiffPercent / 100)
        const diffPercent = blueprint.difficulty[diff];
        const targetCount = Math.round(topicSplit.count * (diffPercent / 100));
        
        if (targetCount === 0 || remainingForTopic === 0) continue;

        const countToFetch = Math.min(targetCount, remainingForTopic);

        const selected = await this.fetchBucket(
          topicSplit.topicId,
          diff,
          countToFetch,
          usedIds,
          blueprint.pacingPreference
        );

        selected.forEach(id => {
          finalSelectedIds.push(id);
          usedIds.add(id);
        });
        remainingForTopic -= selected.length;
      }

      // Fallback 1: Topic match, any difficulty (if still remaining for this topic)
      if (remainingForTopic > 0) {
        const selected = await this.fetchBucket(
            topicSplit.topicId,
            null, // Any difficulty
            remainingForTopic,
            usedIds,
            blueprint.pacingPreference
        );
        selected.forEach(id => {
            finalSelectedIds.push(id);
            usedIds.add(id);
        });
        remainingForTopic -= selected.length;
      }
    }

    // Fallback 2: Any topic, any difficulty (if total count still not met)
    const currentTotal = finalSelectedIds.length;
    if (currentTotal < blueprint.totalQuestions) {
        const remainingGlobal = blueprint.totalQuestions - currentTotal;
        const selected = await this.fetchBucket(
            null, // Any topic
            null, // Any difficulty
            remainingGlobal,
            usedIds,
            blueprint.pacingPreference
        );
        selected.forEach(id => {
            finalSelectedIds.push(id);
            usedIds.add(id);
        });
    }

    return finalSelectedIds;
  }

  private static async fetchBucket(
    topicId: string | null,
    difficulty: "simple" | "intermediate" | "expert" | null,
    count: number,
    excludeIds: Set<string>,
    _pacingPref: AdaptiveBlueprint["pacingPreference"]
  ): Promise<string[]> {
    if (count <= 0) return [];

    const filters = [];
    if (topicId !== null) filters.push(eq(questions.topicId, topicId));
    if (difficulty !== null) filters.push(eq(questions.difficulty, difficulty));
    filters.push(eq(questions.status, 'active'));

    // Pacing rules (Pseudo-logic based on metadata)
    // assuming responseMetadata or similar field exists in questions for length/flag
    // We'll use a loose meta check if columns exist, otherwise skip.
    
    // Convert excludeIds to Array for drizzle
    const excludeList = Array.from(excludeIds);
    if (excludeList.length > 0) {
        filters.push(notInArray(questions.id, excludeList));
    }

    const query = db.select({ id: questions.id })
      .from(questions)
      .where(and(...filters))
      .orderBy(sql`RANDOM()`)
      .limit(count);

    const rows = await query;
    return rows.map(r => r.id);
  }
}
