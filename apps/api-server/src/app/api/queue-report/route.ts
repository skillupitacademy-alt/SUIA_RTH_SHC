import { db, exams } from "@quiz/db";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { TokenService } from "@/modules/auth/token.service";
import { ReportRepository } from "@/modules/report-engine/report-repository";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { attemptId?: string };
    const attemptId = body?.attemptId ?? "";

    if (attemptId === "") {
      return NextResponse.json({ error: "Missing attemptId" }, { status: 400 });
    }

    // 1. Ownership Validation
    const token = TokenService.getAccessToken(req, { scope: "user" });
    if (token == null || token === "") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const payload = await TokenService.verifyAccessToken(token, false);
    const userId = payload.userId;

    const exam = await db.query.exams.findFirst({
      where: eq(exams.id, attemptId),
      columns: { userId: true, status: true }
    });

    if (!exam || exam.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized or not found" }, { status: 403 });
    }

    if (exam.status !== "completed") {
      return NextResponse.json({ error: "Exam is not completed" }, { status: 400 });
    }

    // 2. State Machine Init
    await ReportRepository.createReportIfNotExists({ attemptId, userId, status: "pending" });

    // 3. Fire-and-forget Generation Trigger (Internal API call)
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002/api";
    const generateUrl = `${apiBase}/generate-report`;
    
    // We don't await this
    fetch(generateUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-key": process.env.INTERNAL_API_KEY ?? "secret"
      },
      body: JSON.stringify({ attemptId })
    }).catch(err => logger.error({ err, attemptId }, "[QueueReport] Background trigger failed"));

    return NextResponse.json({ status: "queued", attemptId });

  } catch (error: unknown) {
    logger.error({ err: error }, "[QueueReport] API Error");
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
