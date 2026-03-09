import { db, notifications } from "@quiz/db";
import { METRICS } from "@quiz/observability";
import { and, eq } from "drizzle-orm";
import { NextRequest } from "next/server";

import { badRequest, unauthorized } from "@/lib/api-error";
import { ApiResponse } from "@/lib/api-response";
import { recordCounter, recordTimer } from "@/lib/metrics";
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from "@/lib/sanitize";
import { withLogging } from "@/lib/withLogging";
import { TokenService } from "@/modules/auth/token.service";
import { container } from '@/modules/core/container';

export const dynamic = "force-dynamic";

async function patchHandler(req: NextRequest) {
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

    const rawBody = await req.json().catch(() => ({}));
    
    if (!validateJsonDepth(rawBody) || !validateJsonSize(rawBody)) {
      return ApiResponse.error(badRequest("Payload too deep or large"));
    }

    const body = sanitizeJsonField(rawBody) as {
      notificationId?: string;
      markAll?: boolean;
    };

    const notificationId =
      typeof body.notificationId === "string" && body.notificationId.length > 0 ? body.notificationId : null;
    const markAll = body.markAll === true;

    if (markAll === true) {
      await db
        .update(notifications)
        .set({ isRead: true, readAt: new Date() })
        .where(and(eq(notifications.userId, payload.userId), eq(notifications.isRead, false)));
      
      recordCounter(METRICS.NOTIFICATIONS.MARK_READ, 1, { type: 'bulk', outcome: 'success' });
      recordTimer(METRICS.NOTIFICATIONS.MARK_READ + '.duration', Date.now() - start, { type: 'bulk', outcome: 'success' });
      
      return ApiResponse.success({ success: true });
    }

    if (notificationId === null) {
      return ApiResponse.error(badRequest("notificationId required"));
    }

    await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, payload.userId)));

    recordCounter(METRICS.NOTIFICATIONS.MARK_READ, 1, { type: 'single', outcome: 'success' });
    recordTimer(METRICS.NOTIFICATIONS.MARK_READ + '.duration', Date.now() - start, { type: 'single', outcome: 'success' });

    return ApiResponse.success({ success: true });
  } catch (error: unknown) {
    recordCounter(METRICS.NOTIFICATIONS.MARK_READ, 1, { outcome: 'failure' });
    recordTimer(METRICS.NOTIFICATIONS.MARK_READ + '.duration', Date.now() - start, { outcome: 'failure' });
    return ApiResponse.error(error);
  }
}

export const PATCH = withLogging(patchHandler, { component: 'notifications', operation: 'mark_as_read' });
