import { type NextRequest, NextResponse } from "next/server";

import { sql } from "@/lib/db";
import { redis } from "@/lib/redis";
import { CACHE_KEYS, CACHE_TTL } from "@/modules/analytics/analytics.constants";
import { TokenService } from "@/modules/auth/token.service";

export const dynamic = "force-dynamic";

// Standard TTL used via ANALYTICS_CACHE.ADMIN_GLOBAL (3600s)

interface TopicSkillRow {
  topic: string;
  skill: string;
  question_count: number;
}

export async function GET(req: NextRequest) {
  try {
    // 1. Identity & Role Verification (RBAC)
    const token = TokenService.getAccessToken(req, { scope: "admin" });
    if (token === undefined || token === null || token === "") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const payload = await TokenService.verifyAccessToken(token, true);
    
    // Explicitly check role (TokenPayload has roles string array)
    const hasAdminRole = Array.isArray(payload.roles) && payload.roles.some(
      (role: string) => role === "ADMIN" || role === "SUPER_ADMIN" || role === "admin"
    );
    
    if (!hasAdminRole && payload.isAdmin !== true) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // 2. Try Redis Cache
    try {
      const cachedData = await redis.get(CACHE_KEYS.ANALYTICS.ADMIN("topic-skill-heatmap"));
      if (cachedData !== null) {
        return NextResponse.json(cachedData);
      }
    } catch (redisError) {
      console.error("[Redis Error]:", redisError);
    }

    // 3. Query Materialized View
    // Ensure we only get rows with data to keep the matrix sparse if possible, 
    // or dense if we want full coverage. For heatmap, sparse is usually fine.
    const rows = (await sql`
      SELECT topic, skill, question_count
      FROM mv_topic_skill_matrix
      ORDER BY topic ASC, skill ASC
    `) as TopicSkillRow[];

    // 4. Transform for ECharts Heatmap
    // ECharts expects: { x: categories, y: categories, data: [[xIndex, yIndex, value], ...] }
    
    // Extract unique sorted topics (X-axis) and skills (Y-axis)
    const topics = Array.from(new Set(rows.map(r => r.topic))).sort();
    const skills = Array.from(new Set(rows.map(r => r.skill))).sort();

    const topicMap = new Map(topics.map((t, i) => [t, i]));
    const skillMap = new Map(skills.map((s, i) => [s, i]));

    const matrix: [number, number, number][] = rows.map(r => [
      topicMap.get(r.topic) ?? 0, // X-axis index
      skillMap.get(r.skill) ?? 0, // Y-axis index
      Number(r.question_count)    // Value
    ]);

    const result = {
      topics,
      skills,
      matrix
    };

    // 5. Cache (Fire-and-forget)
    try {
      if (rows.length > 0) {
        await redis.set(
          CACHE_KEYS.ANALYTICS.ADMIN("topic-skill-heatmap"), 
          result, 
          { ex: CACHE_TTL.ADMIN_GLOBAL }
        );
      }
    } catch (redisError) {
      console.error("[Redis Cache Error]:", redisError);
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("[Admin Heatmap Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch topic-skill heatmap", message },
      { status: 500 }
    );
  }
}
