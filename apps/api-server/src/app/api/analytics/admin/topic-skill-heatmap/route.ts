import { METRICS } from "@quiz/observability";
import { type NextRequest } from "next/server";

import { forbidden, unauthorized } from "@/lib/api-error";
import { ApiResponse } from "@/lib/api-response";
import { sqlReplica } from "@/lib/db";
import { recordCounter, recordTimer } from "@/lib/metrics";
import { redis } from "@/lib/redis";
import { withLogging } from "@/lib/withLogging";
import { CACHE_KEYS, CACHE_TTL } from "@/modules/analytics/analytics.constants";
import { TokenService } from "@/modules/auth/token.service";
import { ResilienceService } from "@/modules/core/resilience.service";

export const dynamic = "force-dynamic";

interface TopicSkillRow {
  topic: string;
  skill: string;
  question_count: number;
}

async function getHandler(req: NextRequest) {
  const start = Date.now();
  try {
    if (!(await ResilienceService.isFeatureEnabled('analytics'))) {
      return ApiResponse.error(new Error("Analytics service is busy"), 503);
    }

    const token = TokenService.getAccessToken(req, { scope: "admin" });
    if (token === null || token === undefined || token === "") {
      throw unauthorized("Authentication required");
    }

    const payload = await TokenService.verifyAccessToken(token, true);
    if (payload === null || payload === undefined) {
      throw unauthorized("Authentication required");
    }
    
    const hasAdminRole = Array.isArray(payload.roles) && payload.roles.some(
      (role: string) => role === "ADMIN" || role === "SUPER_ADMIN" || role === "admin"
    );
    
    if (!hasAdminRole && payload.isAdmin !== true) {
      throw forbidden("Insufficient permissions");
    }

    try {
      const cachedData = await redis.get(CACHE_KEYS.ANALYTICS.ADMIN("topic-skill-heatmap"));
      if (cachedData !== null) {
        return ApiResponse.success(cachedData);
      }
    } catch (__redisError) {
      // Ignored
    }

    const rows = (await sqlReplica`
      SELECT topic, skill, question_count
      FROM mv_topic_skill_matrix
      ORDER BY topic ASC, skill ASC
    `) as TopicSkillRow[];
    
    const topics = Array.from(new Set(rows.map(r => r.topic))).sort();
    const skills = Array.from(new Set(rows.map(r => r.skill))).sort();

    const topicMap = new Map(topics.map((t, i) => [t, i]));
    const skillMap = new Map(skills.map((s, i) => [s, i]));

    const matrix: [number, number, number][] = rows.map(r => [
      topicMap.get(r.topic) ?? 0,
      skillMap.get(r.skill) ?? 0,
      Number(r.question_count)
    ]);

    const result = {
      topics,
      skills,
      matrix
    };

    try {
      if (rows.length > 0) {
        await redis.set(
          CACHE_KEYS.ANALYTICS.ADMIN("topic-skill-heatmap"), 
          result, 
          { ex: CACHE_TTL.ADMIN_GLOBAL }
        );
      }
    } catch (__redisError) {
      // Ignored
    }

    const durationMs = Date.now() - start;
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.topic_skill_heatmap', durationMs, { outcome: 'success' });
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.topic_skill_heatmap.count', 1, { outcome: 'success' });
    return ApiResponse.success(result, 200, {
      'X-Duration-Ms': durationMs.toString()
    });
  } catch (error: unknown) {
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.topic_skill_heatmap.count', 1, { outcome: 'failure' });
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.topic_skill_heatmap.duration', durationMs, { outcome: 'failure' });
    return ApiResponse.error(error);
  }
}

export const GET = withLogging(getHandler, { component: 'analytics', operation: 'get_topic_skill_heatmap' });
