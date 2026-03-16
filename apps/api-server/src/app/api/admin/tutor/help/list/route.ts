import { db, notifications, topics, tutorHelpRequests } from "@quiz/db";
import { METRICS } from "@quiz/observability";
import { eq, sql } from "drizzle-orm";
import { type NextRequest } from "next/server";

import { badRequest, unauthorized } from "@/lib/api-error";
import { ApiResponse } from "@/lib/api-response";
import { recordCounter, recordTimer } from "@/lib/metrics";
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from "@/lib/sanitize";
import { withLogging } from "@/lib/withLogging";
import { TokenService } from "@/modules/auth/token.service";
import { container } from '@/modules/core/container';

export const dynamic = "force-dynamic";

async function getHandler(req: NextRequest) {
  const start = Date.now();
  try {
    const token = container.get(TokenService).getAccessToken(req, { scope: "admin" });
    if (token === null || token === undefined || token === "") {
      throw unauthorized("Unauthorized");
    }
    const payload = await container.get(TokenService).verifyAdminAccessToken(token);
    if (payload === null || payload === undefined) {
      throw unauthorized("Authentication required");
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");
    const status = typeof statusParam === "string" && statusParam.trim().length > 0 ? statusParam.trim() : "pending";
    const limitRaw = Number(searchParams.get("limit") ?? 20);
    const offsetRaw = Number(searchParams.get("offset") ?? 0);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 200) : 20;
    const offset = Number.isFinite(offsetRaw) && offsetRaw >= 0 ? offsetRaw : 0;

    const list = await db.execute(sql`
      SELECT 
        thr.id, 
        thr.status, 
        thr.priority, 
        thr.created_at as "createdAt",
        u.email,
        p.name as "userName",
        t.name as "topicName",
        thr.metadata
      FROM tutor_help_requests thr
      JOIN users u ON u.id = thr.user_id
      LEFT JOIN user_profiles p ON p.user_id = u.id
      JOIN topics t ON t.id = thr.topic_id
      WHERE thr.status = ${status}
      ORDER BY 
        CASE WHEN thr.priority = 'high' THEN 1 ELSE 2 END,
        thr.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `);

    const countResult = await db.execute(sql`
      SELECT COUNT(*)::int as count FROM tutor_help_requests WHERE status = ${status}
    `);

    const total =
      countResult.rows.length > 0 && typeof countResult.rows[0].count === "number" ? countResult.rows[0].count : 0;

    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.tutor.help.list.success', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.tutor.help.list.duration', durationMs, { outcome: 'success' });

    return ApiResponse.success({
      requests: list.rows,
      total,
    }, 200, { 
      'X-Duration-Ms': durationMs.toString() 
    });
  } catch (error: unknown) {
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.tutor.help.list.failure', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.tutor.help.list.duration', durationMs, { outcome: 'failure' });
    return ApiResponse.error(error);
  }
}

async function patchHandler(req: NextRequest) {
  const start = Date.now();
  try {
    const token = container.get(TokenService).getAccessToken(req, { scope: "admin" });
    if (token === null || token === undefined || token === "") {
      throw unauthorized("Unauthorized");
    }
    const payload = await container.get(TokenService).verifyAdminAccessToken(token);
    if (payload === null || payload === undefined) {
      throw unauthorized("Authentication required");
    }

    // Ingest and sanitize JSON body
    let raw;
    try {
      raw = await req.json();
      validateJsonSize(raw);
      validateJsonDepth(raw);
    } catch {
      throw badRequest("Invalid payload");
    }
    const body = sanitizeJsonField(raw) as Record<string, unknown>;

    const requestId: string | undefined =
      typeof body?.requestId === "string" && body.requestId.trim().length > 0 ? body.requestId.trim() : undefined;
    const statusRaw: string | undefined =
      typeof body?.status === "string" && body.status.trim().length > 0 ? body.status.trim() : undefined;
    const note: string | undefined =
      typeof body?.note === "string" && body.note.trim().length > 0 ? body.note.trim() : undefined;

    if (requestId === undefined || requestId.length === 0 || statusRaw === undefined || statusRaw.length === 0) {
      throw badRequest("requestId and status are required");
    }

    const allowedStatuses = ["pending", "scheduled", "resolved", "cancelled"];
    if (!allowedStatuses.includes(statusRaw)) {
      throw badRequest("Invalid status");
    }

    const updateShape: Record<string, unknown> = { status: statusRaw };
    if (note !== undefined) {
      // Cast is required here; `to_jsonb($1)` can fail with "unknown" param types in prepared statements.
      updateShape.metadata = sql`jsonb_set(COALESCE(metadata, '{}'::jsonb), '{adminNote}', to_jsonb(${note}::text))`;
    }

    const existing = await db.query.tutorHelpRequests.findFirst({
      where: eq(tutorHelpRequests.id, requestId),
      columns: { userId: true, topicId: true, status: true }
    });

    await db.update(tutorHelpRequests).set(updateShape).where(eq(tutorHelpRequests.id, requestId));

    // Send a secure inbox message back to the student so the "admin reply" is visible user-side.
    if (existing) {
      const topic = await db.query.topics.findFirst({
        where: eq(topics.id, existing.topicId),
        columns: { name: true }
      });
      const topicName = typeof topic?.name === "string" && topic.name.trim().length > 0 ? topic.name.trim() : "your topic";

      const title =
        statusRaw === "scheduled" ? "Tutor Scheduled" :
          statusRaw === "resolved" ? "Tutor Resolved" :
            statusRaw === "cancelled" ? "Tutor Update" :
              "Tutor Update";

      const message =
        typeof note === "string" && note.trim().length > 0
          ? note.trim()
          : statusRaw === "scheduled"
            ? `Your live help request for ${topicName} is scheduled. Please check your inbox for details.`
            : statusRaw === "resolved"
              ? `Your live help request for ${topicName} has been resolved. Please check your inbox for details.`
              : `Your live help request for ${topicName} has been updated.`;

      await db.insert(notifications).values({
        userId: existing.userId,
        type: "live_session_alert",
        title,
        message,
        metadata: { requestId, topicId: existing.topicId, status: statusRaw },
        actionUrl: null,
      });
    }

    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.tutor.help.update.success', 1, { status: statusRaw });
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.tutor.help.update.duration', durationMs, { outcome: 'success', status: statusRaw });

    return ApiResponse.success({ success: true }, 200, {
        'X-Duration-Ms': durationMs.toString()
    });
  } catch (error: unknown) {
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ADMIN.DASHBOARD_LOAD + '.tutor.help.update.failure', 1);
    recordTimer(METRICS.ADMIN.DASHBOARD_LOAD + '.tutor.help.update.duration', durationMs, { outcome: 'failure' });
    return ApiResponse.error(error);
  }
}

export const GET = withLogging(getHandler, { component: 'admin', operation: 'list_help_requests' });
export const PATCH = withLogging(patchHandler, { component: 'admin', operation: 'update_help_status' });
