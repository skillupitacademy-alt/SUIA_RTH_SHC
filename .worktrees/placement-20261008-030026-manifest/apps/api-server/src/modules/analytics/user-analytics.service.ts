import { sql } from "@/lib/db";
import { redis } from "@/lib/redis";

export interface TopicPerformance {
  topicId: string;
  topicName: string;
  accuracy: number;
}

export interface DifficultyAccuracy {
  simple: number;
  intermediate: number;
  expert: number;
}

export interface UserAnalyticsSnapshot {
  topics: TopicPerformance[];
  difficulty: DifficultyAccuracy;
  pacing: {
    min: number;
    q1: number;
    median: number;
    q3: number;
    max: number;
  } | null;
}

export class UserAnalyticsService {
  /**
   * Fetches a complete personalized analytics snapshot for the adaptive engine.
   * Uses Redis caching (120s) to avoid heavy SQL on every exam start.
   */
  static async getAdaptiveSnapshot(userId: string): Promise<UserAnalyticsSnapshot> {
    const CACHE_KEY = `adaptive:user:${userId}:analytics`;

    try {
      const cached = await redis.get<UserAnalyticsSnapshot>(CACHE_KEY);
      if (cached) return cached;
    } catch (_err) {
      // Ignore cache failures
    }

    const [topics, difficulty, pacing] = await Promise.all([
      this.getTopicPerformance(userId),
      this.getDifficultyAccuracy(userId),
      this.getPacingStats(userId),
    ]);

    const snapshot: UserAnalyticsSnapshot = { topics, difficulty, pacing };

    try {
      await redis.set(CACHE_KEY, snapshot, { ex: 120 });
    } catch (_err) {
      // Ignore cache set failures
    }

    return snapshot;
  }

  static async getTopicPerformance(userId: string): Promise<TopicPerformance[]> {
    const rows = await sql`
      SELECT DISTINCT ON (r.dimension_id)
        r.dimension_id AS "topicId",
        r.name AS "topicName",
        r.accuracy
      FROM results_by_dimension r
      JOIN exams e ON e.id = r.exam_id
      WHERE e.user_id = ${userId}
        AND r.dimension_type = 'topic'
      ORDER BY r.dimension_id, r.created_at DESC
    `;

    return (rows as { topicId: string; topicName: string; accuracy: number | null }[]).map(r => ({
      topicId: r.topicId,
      topicName: r.topicName,
      accuracy: Number(r.accuracy ?? 0),
    }));
  }

  static async getDifficultyAccuracy(userId: string): Promise<DifficultyAccuracy> {
    const rows = await sql`
      SELECT DISTINCT ON (r.name)
        r.name AS difficulty,
        r.accuracy
      FROM results_by_dimension r
      JOIN exams e ON e.id = r.exam_id
      WHERE e.user_id = ${userId}
        AND r.dimension_type = 'difficulty'
      ORDER BY r.name, r.created_at DESC
    `;

    const labels = ["simple", "intermediate", "expert"] as const;
    const result: DifficultyAccuracy = { simple: 0, intermediate: 0, expert: 0 };

    (rows as { difficulty: string; accuracy: number | null }[]).forEach(r => {
      const d = r.difficulty.toLowerCase();
      if (labels.includes(d as (typeof labels)[number])) {
        result[d as keyof DifficultyAccuracy] = Number(r.accuracy ?? 0);
      }
    });

    return result;
  }

  static async getPacingStats(userId: string): Promise<UserAnalyticsSnapshot["pacing"]> {
    const [stats] = (await sql`
      WITH user_times AS (
        SELECT
          COALESCE(
            (eq.response_metadata->>'timeTakenSeconds')::int,
            (eq.response_metadata->>'timeSpentSeconds')::int
          ) AS time_sec
        FROM exam_questions eq
        JOIN exams e ON e.id = eq.exam_id
        WHERE e.user_id = ${userId}
          AND (eq.response_metadata ? 'timeTakenSeconds' OR eq.response_metadata ? 'timeSpentSeconds')
      )
      SELECT
        percentile_cont(0.0) WITHIN GROUP (ORDER BY time_sec) AS min,
        percentile_cont(0.25) WITHIN GROUP (ORDER BY time_sec) AS q1,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY time_sec) AS median,
        percentile_cont(0.75) WITHIN GROUP (ORDER BY time_sec) AS q3,
        percentile_cont(1.0) WITHIN GROUP (ORDER BY time_sec) AS max
      FROM user_times
      WHERE time_sec IS NOT NULL;
    `) as { min: number | null; q1: number | null; median: number | null; q3: number | null; max: number | null; }[];

    if (stats === undefined || stats.min === null) return null;

    return {
      min: Number(stats.min),
      q1: Number(stats.q1),
      median: Number(stats.median),
      q3: Number(stats.q3),
      max: Number(stats.max),
    };
  }
}
