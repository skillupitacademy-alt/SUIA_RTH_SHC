import { db, notifications } from "@quiz/db";
import { METRICS } from "@quiz/observability";
import { and, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { recordCounter, recordTimer } from "@/lib/metrics";
import { withLogging } from "@/lib/withLogging";
import { TokenService } from "@/modules/auth/token.service";

export const dynamic = "force-dynamic";

async function handler(req: NextRequest) {
  const start = Date.now();
  try {
    const token = TokenService.getAccessToken(req, { scope: "user" });
    if (typeof token !== "string" || token.length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await TokenService.verifyAccessToken(token, false);

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, payload.userId), eq(notifications.isRead, false)));

    const durationMs = Date.now() - start;
    recordCounter(METRICS.NOTIFICATIONS.UNREAD_COUNT, 1, { outcome: 'success' });
    recordTimer(METRICS.NOTIFICATIONS.UNREAD_COUNT + '.duration', durationMs, { outcome: 'success' });

    return NextResponse.json({ unread: Number(result[0]?.count ?? 0) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    recordCounter(METRICS.NOTIFICATIONS.UNREAD_COUNT, 1, { outcome: 'failure' });
    recordTimer(METRICS.NOTIFICATIONS.UNREAD_COUNT + '.duration', Date.now() - start, { outcome: 'failure' });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET = withLogging(handler, { component: 'notifications', operation: 'get_unread_count' });
