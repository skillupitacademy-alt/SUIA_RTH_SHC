import { METRICS } from "@quiz/observability";
import { type NextRequest, NextResponse } from "next/server";

import { sqlReplica } from "@/lib/db";
import { recordCounter, recordTimer } from "@/lib/metrics";
import { redis } from "@/lib/redis";
import { withLogging } from "@/lib/withLogging";
import { TokenService } from "@/modules/auth/token.service";
import { ResilienceService } from "@/modules/core/resilience.service";

export const dynamic = "force-dynamic";

interface ItemDifficultyRow {
  topic_name: string;
  question_id: string;
  p_value: number;
}

async function handler(req: NextRequest) {
  const start = Date.now();
  try {
    const analyticsEnabled = await ResilienceService.isFeatureEnabled('analytics');
    if (analyticsEnabled === false) {
      return NextResponse.json(ResilienceService.getBusyPayload('analytics'), { status: 503 });
    }

    const token = TokenService.getAccessToken(req, { scope: "admin" });
    const payload = await TokenService.verifyAccessToken(token as string, true) as {
      isAdmin?: boolean;
      roles?: string[];
    } | null;
    const isAdmin = payload?.isAdmin === true;
    const roles = Array.isArray(payload?.roles) ? payload.roles : [];

    if (!isAdmin && !roles.includes('ADMIN')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const CACHE_KEY = "analytics:admin:item-difficulty";
    try {
      const cached = await redis.get(CACHE_KEY);
      if (cached !== null && cached !== undefined) return NextResponse.json(cached);
    } catch (_e) {
      // cache optional; proceed on miss or failure
    }

    const rows = (await sqlReplica`
      SELECT t.name as topic_name, idm.question_id, idm.p_value
      FROM mv_item_difficulty_metrics idm
      JOIN questions q ON q.id = idm.question_id
      JOIN topics t ON t.id = q.topic_id
      ORDER BY idm.p_value DESC
      LIMIT 100;
    `) as ItemDifficultyRow[];

    const result = {
      topics: Array.from(new Set(rows.map(r => r.topic_name))),
      items: rows.map(r => ({
        id: r.question_id,
        difficulty: Number(r.p_value),
        topic: r.topic_name
      }))
    };

    try {
      await redis.set(CACHE_KEY, result, { ex: 3600 });
    } catch (_e) {
      // cache store is best-effort
    }

    const durationMs = Date.now() - start;
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.item_difficulty', durationMs, { outcome: 'success' });
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.item_difficulty.count', 1, { outcome: 'success' });
    return NextResponse.json(result, {
      headers: { 'X-Duration-Ms': durationMs.toString() }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.item_difficulty.count', 1, { outcome: 'failure' });
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.item_difficulty.duration', durationMs, { outcome: 'failure' });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET = withLogging(handler, { component: 'analytics', operation: 'get_item_difficulty' });
