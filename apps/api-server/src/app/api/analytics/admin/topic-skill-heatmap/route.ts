import { METRICS } from "@quiz/observability";
import { type NextRequest, NextResponse } from "next/server";

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

async function handler(req: NextRequest) {
  const start = Date.now();
  try {
    if (!(await ResilienceService.isFeatureEnabled('analytics'))) {
      return NextResponse.json(ResilienceService.getBusyPayload('analytics'), { status: 503 });
    }

    const token = TokenService.getAccessToken(req, { scope: "admin" });
    if (token === undefined || token === null || token === "") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const payload = await TokenService.verifyAccessToken(token, true);
    
    const hasAdminRole = Array.isArray(payload.roles) && payload.roles.some(
      (role: string) => role === "ADMIN" || role === "SUPER_ADMIN" || role === "admin"
    );
    
    if (!hasAdminRole && payload.isAdmin !== true) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    try {
      const cachedData = await redis.get(CACHE_KEYS.ANALYTICS.ADMIN("topic-skill-heatmap"));
      if (cachedData !== null) {
        return NextResponse.json(cachedData);
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
    return NextResponse.json(result, {
      headers: { 'X-Duration-Ms': durationMs.toString() }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.topic_skill_heatmap.count', 1, { outcome: 'failure' });
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.topic_skill_heatmap.duration', durationMs, { outcome: 'failure' });
    return NextResponse.json(
      { error: "Failed to fetch topic-skill heatmap", message },
      { status: 500 }
    );
  }
}

export const GET = withLogging(handler, { component: 'analytics', operation: 'get_topic_skill_heatmap' });
