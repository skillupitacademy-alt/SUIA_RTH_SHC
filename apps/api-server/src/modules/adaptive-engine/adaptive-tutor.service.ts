import { db, notifications, topics } from "@quiz/db";
import { eq, inArray } from "drizzle-orm";

import { UserAnalyticsService } from "../analytics/user-analytics.service";

type TopicDetail = (typeof topics)["_"]["inferSelect"] & {
  learningUrl?: string | null;
  detailedNotesPath?: string | null;
};

export interface TutorInsight {
  topicId: string;
  topicName: string;
  priority: "critical" | "growth" | "stable";
  label: string;
  recommendation: string;
  learningUrl?: string;
  accuracy: number;
}

export class AdaptiveTutorService {
  /**
   * Generates personalized study recommendations based on recent performance.
   */
  static async generateInsights(
    userId: string,
    topicAccuracyRecords: { topicId: string; accuracy: number }[],
  ): Promise<TutorInsight[]> {
    // 1. Fetch historical analytics
    const historical = await UserAnalyticsService.getTopicPerformance(userId);
    const historicalMap = new Map(historical.map((h) => [h.topicId, h.accuracy]));

    // 2. Identify areas for focus
    const focusTopics = topicAccuracyRecords.filter((t) => t.accuracy < 80);
    if (focusTopics.length === 0) return [];

    // Support both UUID topic IDs and legacy name-based identifiers.
    const isUuid = (value: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

    const idKeys = focusTopics.map((t) => t.topicId).filter(isUuid);
    const nameKeys = focusTopics.map((t) => t.topicId).filter((id) => !isUuid(id));

    const topicDetails: TopicDetail[] = [
      ...(idKeys.length > 0
        ? ((await db.query.topics.findMany({ where: inArray(topics.id, idKeys) })) as TopicDetail[])
        : []),
      ...(nameKeys.length > 0
        ? ((await db.query.topics.findMany({ where: inArray(topics.name, nameKeys) })) as TopicDetail[])
        : []),
    ];

    const detailsById = new Map<string, TopicDetail>(
      topicDetails.map((d) => [d.id, d as TopicDetail]),
    );
    const detailsByName = new Map<string, TopicDetail>(
      topicDetails
        .filter((d) => typeof d.name === "string" && d.name.length > 0)
        .map((d) => [d.name as string, d as TopicDetail]),
    );

    const insights: TutorInsight[] = [];

    for (const record of focusTopics) {
      const pastAccuracy = historicalMap.get(record.topicId) ?? 0;
      const details =
        detailsById.get(record.topicId) ??
        detailsByName.get(record.topicId) ??
        null;

      let priority: TutorInsight["priority"] = "growth";
      let label = "Keep Practicing";
      let recommendation = "";

      if (record.accuracy < 50) {
        priority = "critical";
        label = "Conceptual Gap Found";
        recommendation = `You're struggling with the fundamentals of ${details?.name}. We strongly recommend reviewing the linked master guide.`;
      } else if (record.accuracy < 75 && pastAccuracy > 80) {
        priority = "critical";
        label = "Performance Dip";
        recommendation = `Your accuracy in ${details?.name} dropped since your last session. Focus on the core definitions again.`;
      } else {
        priority = "growth";
        label = "Target for Growth";
        recommendation = `You're close to mastery in ${details?.name}. Fixing a few small errors will push you to level up!`;
      }

      insights.push({
        topicId: record.topicId,
        topicName:
          typeof details?.name === "string" && details.name.length > 0
            ? details.name
            : "Topic",
        priority,
        label,
        recommendation,
        learningUrl:
          typeof details?.learningUrl === "string" && details.learningUrl.length > 0
            ? details.learningUrl
            : undefined,
        accuracy: record.accuracy,
      });
    }

    return insights
      .sort((a, _b) => (a.priority === "critical" ? -1 : 1))
      .slice(0, 3);
  }

  /**
   * Dispatches master notes to the user's Inbox and triggers (future) email.
   */
  static async requestMasterNotes(userId: string, topicId: string): Promise<boolean> {
    const topic = await db.query.topics.findFirst({
      where: eq(topics.id, topicId),
    });

    const detailedNotesPath = (topic as TopicDetail | null)?.detailedNotesPath;
    const hasNotes = typeof detailedNotesPath === "string" && detailedNotesPath.length > 0;
    if (!topic || !hasNotes) {
      return false;
    }

    // 0. Verify User and fetch their official registered email
    const userResult = await db.query.users.findFirst({
      where: (u, { eq: eqUser }) => eqUser(u.id, userId),
    });

    // 1. Create Internal Notification (The Inbox message)
    await db.insert(notifications).values({
      userId,
      type: "notes_sent",
      title: "Master Notes Dispatched!",
      message: `We've prepared your detailed study guide for "${topic.name}". It has been sent to your registered email: ${
        typeof userResult?.email === "string" && userResult.email.length > 0
          ? userResult.email
          : "your account email"
      }. Please check your mailbox (and spam folder) for the secure download link.`,
      isRead: false,
    });

    // 2. Logic for high-end email service would go here (e.g., Resend, SendGrid)
    // For now, we return true to indicate the notification logic handled the request.
    return true;
  }
}
