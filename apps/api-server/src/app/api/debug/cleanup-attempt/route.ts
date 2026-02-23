import { db, reports } from "@quiz/db";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { redis } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const internalKey = req.headers.get("x-internal-key");
    if (internalKey !== process.env.INTERNAL_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as { attemptId?: string };
    const attemptId = body.attemptId ?? "";

    if (attemptId.trim() === "") {
      return NextResponse.json({ error: "Missing attemptId" }, { status: 400 });
    }

    // 1. Flush Redis Cache
    const cacheKey = `attempt:${attemptId}:core:v4`;
    await redis.del(cacheKey);

    // 2. Clear Reports Table Row
    await db.delete(reports).where(eq(reports.attemptId, attemptId));

    return NextResponse.json({
      status: "success",
      message: `Cleaned up attempt ${attemptId}`,
      redis_flushed: cacheKey,
      db_cleared: true
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
