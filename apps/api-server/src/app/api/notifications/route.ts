import { db, notifications } from "@quiz/db";
import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { TokenService } from "@/modules/auth/token.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/notifications
 * Fetches the internal inbox for the authenticated student.
 */
export async function GET(req: NextRequest) {
  try {
    const token = TokenService.getAccessToken(req, { scope: "user" });
    if (typeof token !== "string" || token.length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const payload = await TokenService.verifyAccessToken(token, false);

    const inbox = await db.query.notifications.findMany({
      where: eq(notifications.userId, payload.userId),
      orderBy: [desc(notifications.createdAt)],
      limit: 50,
    });

    return NextResponse.json(inbox);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch notifications";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/**
 * PATCH /api/notifications/[id]/read
 * Marks a notification as read.
 */
// (Logic for marking as read can be added in a separate [id] route if needed)
