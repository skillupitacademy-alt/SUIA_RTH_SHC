import { db, userProfiles } from "@quiz/db";
import { eq } from "drizzle-orm";

import { DifficultyAccuracy } from "../analytics/user-analytics.service";

export type AdaptiveLevel = "beginner" | "intermediate" | "advanced";

type DbExecutor = Pick<typeof db, 'query' | 'update'>;

export class AdaptivePromotionService {
  /**
   * Evaluates user performance and potentially promotes their adaptive level.
   */
  static async evaluatePromotion(
    userId: string,
    accuracy: DifficultyAccuracy,
    dbInstance: DbExecutor = db
  ): Promise<AdaptiveLevel> {
    const currentProfile = await dbInstance.query.userProfiles.findFirst({
        where: eq(userProfiles.userId, userId)
    });

    const currentLevel = (currentProfile?.adaptiveLevel as AdaptiveLevel) || "beginner";
    let nextLevel: AdaptiveLevel = currentLevel;

    // Promotion Logic
    if (accuracy.simple >= 85 && accuracy.intermediate >= 70) {
        if (currentLevel === "beginner") {
            nextLevel = "intermediate";
        }
        
        if (accuracy.expert >= 60) {
            nextLevel = "advanced";
        }
    }

    // Demotion Safety (Optional: could add logic to demote if performance drops severely)
    
    if (nextLevel !== currentLevel) {
        await dbInstance.update(userProfiles)
            .set({ 
                adaptiveLevel: nextLevel,
                updatedAt: new Date()
            })
            .where(eq(userProfiles.userId, userId));
    }

    return nextLevel;
  }
}
