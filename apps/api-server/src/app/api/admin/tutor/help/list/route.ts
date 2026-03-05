import { db, tutorHelpRequests } from "@quiz/db";
import { METRICS } from "@quiz/observability";
import { eq, sql } from "drizzle-orm";
import { type NextRequest } from "next/server";

import { badRequest, unauthorized } from "@/lib/api-error";
import { ApiResponse } from "@/lib/api-response";
import { recordCounter, recordTimer } from "@/lib/metrics";
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from "@/lib/sanitize";
import { withLogging } from "@/lib/withLogging";
import { TokenService } from "@/modules/auth/token.service";

export const dynamic = "force-dynamic";

async function getHandler(req: NextRequest) {
  const start = Date.now();
  try {
    const token = TokenService.getAccessToken(req, { scope: "admin" });
    if (token === null || token === undefined || token === "") {
      throw unauthorized("Unauthorized");
    }
    const payload = await TokenService.verifyAccessToken(token, true);
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
      LEFT JOIN profiles p ON p.user_id = u.id
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
    const token = TokenService.getAccessToken(req, { scope: "admin" });
    if (token === null || token === undefined || token === "") {
      throw unauthorized("Unauthorized");
    }
    const payload = await TokenService.verifyAccessToken(token, true);
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
      updateShape.metadata = sql`jsonb_set(COALESCE(metadata, '{}'::jsonb), '{adminNote}', to_jsonb(${note}))`;
    }

    await db.update(tutorHelpRequests).set(updateShape).where(eq(tutorHelpRequests.id, requestId));

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
