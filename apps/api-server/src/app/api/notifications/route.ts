import { db, notifications } from "@quiz/db";
import { METRICS } from "@quiz/observability";
import { and, desc, eq } from "drizzle-orm";
import { NextRequest } from "next/server";

import { unauthorized } from "@/lib/api-error";
import { ApiResponse } from "@/lib/api-response";
import { recordCounter, recordTimer } from "@/lib/metrics";
import { withLogging } from "@/lib/withLogging";
import { TokenService } from "@/modules/auth/token.service";
import { container } from '@/modules/core/container';

export const dynamic = "force-dynamic";

/**
 * GET /api/notifications
 * Fetches the internal inbox for the authenticated student.
 */
async function getHandler(req: NextRequest) {
  const start = Date.now();
  try {
    const token = container.get(TokenService).getAccessToken(req, { scope: "user" });
    if (token === null || token === undefined || token === "") {
      throw unauthorized("Unauthorized", "UNAUTHORIZED");
    }
    const payload = await container.get(TokenService).verifyAccessToken(token, false);
    if (payload === null || payload === undefined || payload.userId === null || payload.userId === undefined) {
      throw unauthorized("Authentication required", "UNAUTHORIZED");
    }

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

    return ApiResponse.success(inbox, 200, { 'X-Duration-Ms': durationMs.toString() });
  } catch (err: unknown) {
    recordCounter(METRICS.NOTIFICATIONS.UNREAD_COUNT + '.fetch', 1, { outcome: 'failure' });
    recordTimer(METRICS.NOTIFICATIONS.UNREAD_COUNT + '.duration', Date.now() - start, { outcome: 'failure' });
    return ApiResponse.error(err);
  }
}

export const GET = withLogging(getHandler, { component: "notifications", operation: "get_notifications" });
