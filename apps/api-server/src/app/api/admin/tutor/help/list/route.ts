import { db, tutorHelpRequests } from "@quiz/db";
import { eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { TokenService } from "@/modules/auth/token.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/tutor/help/list
 * List help requests for admin review.
 */
export async function GET(req: NextRequest) {
  try {
    const token = TokenService.getAccessToken(req, { scope: "admin" });
    if (typeof token !== "string" || token.length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await TokenService.verifyAccessToken(token, true);

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");
    const status = typeof statusParam === "string" && statusParam.trim().length > 0 ? statusParam.trim() : "pending";
    const limit = Number(searchParams.get("limit") ?? 20);
    const offset = Number(searchParams.get("offset") ?? 0);

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

    // Get total count for pagination
    const countResult = await db.execute(sql`
      SELECT COUNT(*)::int as count FROM tutor_help_requests WHERE status = ${status}
    `);

    const total =
      countResult.rows.length > 0 && typeof countResult.rows[0].count === "number" ? countResult.rows[0].count : 0;

    return NextResponse.json({
      requests: list.rows,
      total,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/tutor/help/status
 * Update the status of a help request.
 */
export async function PATCH(req: NextRequest) {
  try {
    const token = TokenService.getAccessToken(req, { scope: "admin" });
    if (typeof token !== "string" || token.length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await TokenService.verifyAccessToken(token, true);

    const body = await req.json();
    const requestId: string | undefined =
      typeof body?.requestId === "string" && body.requestId.trim().length > 0 ? body.requestId.trim() : undefined;
    const statusRaw: string | undefined =
      typeof body?.status === "string" && body.status.trim().length > 0 ? body.status.trim() : undefined;
    const note: string | undefined =
      typeof body?.note === "string" && body.note.trim().length > 0 ? body.note.trim() : undefined;

    if (requestId === undefined || requestId.length === 0 || statusRaw === undefined || statusRaw.length === 0) {
      return NextResponse.json({ error: "requestId and status are required" }, { status: 400 });
    }

    const allowedStatuses = ["pending", "scheduled", "resolved", "cancelled"];
    if (!allowedStatuses.includes(statusRaw)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updateShape: Record<string, unknown> = { status: statusRaw };
    if (note !== undefined) {
      updateShape.metadata = sql`jsonb_set(COALESCE(metadata, '{}'::jsonb), '{adminNote}', to_jsonb(${note}))`;
    }

    await db.update(tutorHelpRequests).set(updateShape).where(eq(tutorHelpRequests.id, requestId));

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
