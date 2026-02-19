import { db, notifications } from "@quiz/db";
import { and, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { TokenService } from "@/modules/auth/token.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
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

    return NextResponse.json({ unread: Number(result[0]?.count ?? 0) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
