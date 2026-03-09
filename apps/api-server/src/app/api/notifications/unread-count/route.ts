import { db, notifications } from "@quiz/db";
import { METRICS } from "@quiz/observability";
import { and, eq, sql } from "drizzle-orm";
import { NextRequest } from "next/server";

import { unauthorized } from "@/lib/api-error";
import { ApiResponse } from "@/lib/api-response";
import { recordCounter, recordTimer } from "@/lib/metrics";
import { withLogging } from "@/lib/withLogging";
import { TokenService } from "@/modules/auth/token.service";
import { container } from '@/modules/core/container';

export const dynamic = "force-dynamic";

async function getHandler(req: NextRequest) {
  const start = Date.now();
  try {
    const token = container.get(TokenService).getAccessToken(req, { scope: "user" });
    if (token === null || token === undefined || token === "") {
        throw unauthorized("Unauthorized", "UNAUTHORIZED");
    }

    const payload = await container.get(TokenService).verifyUserAccessToken(token);
    if (payload === null || payload === undefined || payload.userId === null || payload.userId === undefined) {
      throw unauthorized("Authentication required", "UNAUTHORIZED");
    }

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, payload.userId), eq(notifications.isRead, false)));

    const durationMs = Date.now() - start;
    recordCounter(METRICS.NOTIFICATIONS.UNREAD_COUNT, 1, { outcome: 'success' });
    recordTimer(METRICS.NOTIFICATIONS.UNREAD_COUNT + '.duration', durationMs, { outcome: 'success' });

    return ApiResponse.success({ unread: Number(result[0]?.count ?? 0) });
  } catch (error: unknown) {
    recordCounter(METRICS.NOTIFICATIONS.UNREAD_COUNT, 1, { outcome: 'failure' });
    recordTimer(METRICS.NOTIFICATIONS.UNREAD_COUNT + '.duration', Date.now() - start, { outcome: 'failure' });
    return ApiResponse.error(error);
  }
}

export const GET = withLogging(getHandler, { component: 'notifications', operation: 'get_unread_count' });
