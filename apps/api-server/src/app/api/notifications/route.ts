import { db, notifications } from "@quiz/db";
import { METRICS } from "@quiz/observability";
import { and, desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { recordCounter, recordTimer } from "@/lib/metrics";
import { withLogging } from "@/lib/withLogging";
import { TokenService } from "@/modules/auth/token.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/notifications
 * Fetches the internal inbox for the authenticated student.
 */
async function handler(req: NextRequest) {
  const start = Date.now();
  try {
    const token = TokenService.getAccessToken(req, { scope: "user" });
    if (typeof token !== "string" || token.length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const payload = await TokenService.verifyAccessToken(token, false);

    const limitParam = Number(req.nextUrl.searchParams.get("limit") ?? 50);
    const offsetParam = Number(req.nextUrl.searchParams.get("offset") ?? 0);
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 200) : 50;
    const offset = Number.isFinite(offsetParam) && offsetParam >= 0 ? offsetParam : 0;
    const typeParam = req.nextUrl.searchParams.get("type");
    const allowedTypes = ["notes_sent", "level_up", "live_session", "system"] as const;
    type NotificationType = (typeof allowedTypes)[number];
    const type: NotificationType | null =
      typeof typeParam === "string" && allowedTypes.includes(typeParam.trim() as NotificationType)
        ? (typeParam.trim() as NotificationType)
        : null;

    const whereClause =
      type !== null
        ? and(eq(notifications.userId, payload.userId), eq(notifications.type, type))
        : eq(notifications.userId, payload.userId);

    const inbox = await db.query.notifications.findMany({
      where: whereClause,
      orderBy: [desc(notifications.createdAt)],
      limit,
      offset,
    });

    const durationMs = Date.now() - start;
    recordCounter(METRICS.NOTIFICATIONS.UNREAD_COUNT + '.fetch', 1, { outcome: 'success' });
    recordTimer(METRICS.NOTIFICATIONS.UNREAD_COUNT + '.duration', durationMs);

    return NextResponse.json(inbox, {
      headers: { 'X-Duration-Ms': durationMs.toString() }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch notifications";
    recordCounter(METRICS.NOTIFICATIONS.UNREAD_COUNT + '.fetch', 1, { outcome: 'failure' });
    recordTimer(METRICS.NOTIFICATIONS.UNREAD_COUNT + '.duration', Date.now() - start, { outcome: 'failure' });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET = withLogging(handler, { component: "notifications", operation: "get_notifications" });
