import { db, exams } from "@quiz/db";
import { METRICS } from "@quiz/observability";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { recordCounter, recordTimer } from "@/lib/metrics";
import { getDownloadUrl } from "@/lib/storage/get-download-url";
import { withLogging } from "@/lib/withLogging";
import { TokenService } from "@/modules/auth/token.service";
import { ReportRepository } from "@/modules/report-engine/report-repository";

export const runtime = "nodejs";

async function handler(req: NextRequest) {
  const startTime = Date.now();
  try {
    const { searchParams } = new URL(req.url);
    const attemptId = searchParams.get("attemptId");

    if (attemptId === null || attemptId.trim() === "") {
      return NextResponse.json({ error: "Missing attemptId" }, { status: 400 });
    }

    // 1. Authenticate user
    const token = TokenService.getAccessToken(req, { scope: "user" }) ?? null;
    if (token === null) {
      // Check for internal key as fallback for server-side checks
      const internalKey = req.headers.get("x-internal-key");
      const expectedKey = process.env.INTERNAL_API_KEY;
      if (expectedKey === undefined || expectedKey === null || expectedKey === "") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (internalKey !== expectedKey) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    let userId: string;
    if (token !== null) {
      const payload = await TokenService.verifyAccessToken(token, false);
      userId = payload.userId;
    } else {
      // Internal bypass - get userId from exam
      const exam = await db.query.exams.findFirst({
        where: eq(exams.id, attemptId),
        columns: { userId: true },
      });
      if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });
      userId = exam.userId;
    }

    // 2. Verify ownership
    const exam = await db.query.exams.findFirst({
      where: eq(exams.id, attemptId),
      columns: { userId: true },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }
    if (exam.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3. Get file reference
    const report = await ReportRepository.getReportByAttempt(attemptId);
    if (!report || report.fileRef === null || report.fileRef === undefined || report.fileRef === "" || report.status !== "ready") {
      return NextResponse.json({ error: "Report not ready or not found" }, { status: 404 });
    }

    // 4. Generate a temporary read-only URL for the private blob
    const downloadUrl = await getDownloadUrl(report.fileRef);
    if (!downloadUrl) {
      return NextResponse.json({ error: "Download unavailable" }, { status: 502 });
    }

    const durationMs = Date.now() - startTime;
    recordCounter(METRICS.REPORTS.DOWNLOAD, 1, { outcome: "success" });
    recordTimer(METRICS.REPORTS.DOWNLOAD + '.duration', durationMs, { outcome: "success" });

    return NextResponse.redirect(downloadUrl, {
      headers: { 'X-Duration-Ms': durationMs.toString() }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    recordCounter(METRICS.REPORTS.DOWNLOAD, 1, { outcome: "failure" });
    recordTimer(METRICS.REPORTS.DOWNLOAD + '.duration', Date.now() - startTime, { outcome: "failure" });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET = withLogging(handler, { component: "reports", operation: "download_report" });
