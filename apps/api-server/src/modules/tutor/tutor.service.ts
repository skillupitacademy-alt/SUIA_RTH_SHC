import { backgroundJobs, db, exams, notesDeliveryLocks, notifications, resultsByDimension, topics, userRecommendations } from "@quiz/db";
import { and, eq, gte, sql } from "drizzle-orm";

import { withSpan } from "@/lib/tracer";
import { cacheService } from "@/modules/core/cache.service";
import { ResilienceService } from "@/modules/core/resilience.service";

type RecommendationLevel = "revise" | "practice";

export class TutorService {
  /**
   * Process a completed exam and create recommendations, notifications, and email jobs.
   */
  static async processExamResults(examId: string): Promise<void> {
    return withSpan('TutorService.processExamResults', async (span) => {
      span.setAttribute('examId', examId);
      try {
      // Phase 6 Resilience: Circuit Breaker
      // If the system is under extreme load, shed the load of non-critical AI analysis
      if (!(await ResilienceService.isFeatureEnabled('ai_tutor'))) {
        return;
      }

      const exam = await db.query.exams.findFirst({
        where: eq(exams.id, examId),
        columns: { userId: true },
      });
      if (!exam) return;

      const userId = exam.userId;

      const weakTopics = await db
        .select({
          topicId: resultsByDimension.dimensionId,
          topicName: resultsByDimension.name,
          accuracy: resultsByDimension.accuracy,
        })
        .from(resultsByDimension)
        .where(
          and(
            eq(resultsByDimension.examId, examId),
            eq(resultsByDimension.dimensionType, "topic"),
            sql`${resultsByDimension.accuracy} <= 75`,
          ),
        );

      if (weakTopics.length === 0) return;

      await db.transaction(async (tx) => {
        for (const record of weakTopics) {
          const topicId = record.topicId as string;
          const topicName =
            typeof record.topicName === "string" && record.topicName.length > 0 ? record.topicName : "Topic";
          const accuracy = Number(record.accuracy ?? 0);

          const level: RecommendationLevel = accuracy < 50 ? "revise" : "practice";

          const existing = await tx.query.userRecommendations.findFirst({
            where: and(
              eq(userRecommendations.userId, userId),
              eq(userRecommendations.topicId, topicId),
              gte(userRecommendations.createdAt, sql`NOW() - INTERVAL '24 HOURS'`),
            ),
          });
          if (existing) continue;

          const topicData = await tx.query.topics.findFirst({
            where: eq(topics.id, topicId),
            columns: { learningUrl: true, detailedNotesPath: true, notesAssetId: true },
          });
          const actionUrl =
            typeof topicData?.learningUrl === "string" && topicData.learningUrl.length > 0
              ? topicData.learningUrl
              : null;
          const notesPath =
            typeof topicData?.notesAssetId === "string" && topicData.notesAssetId.length > 0
              ? topicData.notesAssetId
              : typeof topicData?.detailedNotesPath === "string" && topicData.detailedNotesPath.length > 0
                ? topicData.detailedNotesPath
                : null;

          await tx.insert(userRecommendations).values({
            userId,
            topicId,
            recommendationLevel: level,
            sourceExamId: examId,
            metadata: { accuracy },
          });

          await tx.insert(notifications).values({
            userId,
            type: "notes_sent",
            title: "Refresher Sent!",
            message: `We sent you notes for ${topicName} to your registered email.`,
            actionUrl,
            metadata: { topicId, examId, level, accuracy },
          });

          const rateKey = `notes:request:${userId}:${topicId}`;
          const cache = cacheService;
          const cached = await cache.get<string>(rateKey);
          if (cached !== null && cached !== undefined) continue;

          await cache.set(rateKey, "1", 86400 * 1000);

          const today = new Date().toISOString().split("T")[0];
          const lock = await tx.query.notesDeliveryLocks.findFirst({
            where: and(
              eq(notesDeliveryLocks.userId, userId),
              eq(notesDeliveryLocks.topicId, topicId),
              eq(notesDeliveryLocks.deliveryDate, today),
            ),
          });
          if (lock) continue;

          await tx.insert(notesDeliveryLocks).values({
            userId,
            topicId,
            deliveryDate: today,
          });

          if (notesPath !== null) {
            await tx.insert(backgroundJobs).values({
              userId,
              type: "SEND_NOTES_EMAIL",
              status: "pending",
              payload: {
                topicId,
                notesPath,
                learningUrl:
                  typeof topicData?.learningUrl === "string" && topicData.learningUrl.length > 0
                    ? topicData.learningUrl
                    : null,
                recommendationLevel: level,
              },
            });
          }
        }
      });
    } catch (error) {
      // Do not throw to avoid breaking exam completion flow
      const { container } = await import("@/modules/core/container");
      const { LoggerService } = await import("@/modules/core/logger.service");
      container.get(LoggerService).error(error, "[TutorService] processExamResults failed");
    }
    });
  }
}
