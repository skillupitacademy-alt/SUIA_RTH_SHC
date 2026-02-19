import { db, notifications } from "@quiz/db";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { TokenService } from "@/modules/auth/token.service";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  try {
    const token = TokenService.getAccessToken(req, { scope: "user" });
    if (typeof token !== "string" || token.length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const payload = await TokenService.verifyAccessToken(token, false);

    const body = (await req.json().catch(() => ({}))) as {
      notificationId?: unknown;
      markAll?: unknown;
    };
    const notificationId =
      typeof body.notificationId === "string" && body.notificationId.length > 0 ? body.notificationId : null;
    const markAll = body.markAll === true;

    if (markAll === true) {
      await db
        .update(notifications)
        .set({ isRead: true, readAt: new Date() })
        .where(and(eq(notifications.userId, payload.userId), eq(notifications.isRead, false)));
      return NextResponse.json({ success: true });
    }

    if (notificationId === null) {
      return NextResponse.json({ error: "notificationId required" }, { status: 400 });
    }

    await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, payload.userId)));

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
