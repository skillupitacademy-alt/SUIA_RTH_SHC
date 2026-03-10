import { db, exams } from "@quiz/db";
import { METRICS } from "@quiz/observability";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

import { badRequest, forbidden, notFound, unauthorized } from "@/lib/api-error";
import { ApiResponse } from "@/lib/api-response";
import { recordCounter, recordTimer } from "@/lib/metrics";
import { getDownloadUrl } from "@/lib/storage/get-download-url";
import { withLogging } from "@/lib/withLogging";
import { TokenService } from "@/modules/auth/token.service";
import { container } from '@/modules/core/container';
import { ReportRepository } from "@/modules/report-engine/report-repository";

export const runtime = "nodejs";

async function getHandler(req: NextRequest) {
  const startTime = Date.now();
  try {
    const { searchParams } = new URL(req.url);
    const attemptId = searchParams.get("attemptId");

    if (attemptId === null || attemptId === undefined || attemptId.trim() === "") {
      throw badRequest("Missing attemptId");
    }

    // 1. Authenticate user
    const token = container.get(TokenService).getAccessToken(req, { scope: "user" }) ?? null;
    let userId: string;

    if (token === null) {
      // Check for internal key as fallback for server-side checks
      const internalKey = req.headers.get("x-internal-key");
      const expectedKey = process.env.INTERNAL_API_KEY;
      if (expectedKey === undefined || expectedKey === null || expectedKey === "" || internalKey !== expectedKey) {
        throw unauthorized("Unauthorized");
      }

      // Internal bypass - get userId from exam
      const exam = await db.query.exams.findFirst({
        where: eq(exams.id, attemptId),
        columns: { userId: true },
      });
      if (!exam) throw notFound("Exam", attemptId);
      userId = exam.userId;
    } else {
      const payload = await container.get(TokenService).verifyUserAccessToken(token);
      if (payload === null || payload === undefined || payload.userId === null || payload.userId === undefined) {
        throw unauthorized("Unauthorized");
      }
      userId = payload.userId;
    }

    // 2. Verify ownership
    const exam = await db.query.exams.findFirst({
      where: eq(exams.id, attemptId),
      columns: { userId: true },
    });

    if (exam === null || exam === undefined) {
      throw notFound("Exam", attemptId);
    }
    if (exam.userId !== userId) {
      throw forbidden("Forbidden");
    }

    // 3. Get file reference
    const report = await ReportRepository.getReportByAttempt(attemptId);
    if (report === null || report === undefined || report.fileRef === null || report.fileRef === undefined || report.status !== "ready") {
      throw notFound("Report ready file", attemptId);
    }

    // 4. Generate a temporary read-only URL for the private blob
    const downloadUrl = await getDownloadUrl(report.fileRef);
    if (downloadUrl === null || downloadUrl === undefined || downloadUrl === "") {
      recordCounter(METRICS.REPORTS.DOWNLOAD, 1, { outcome: "failure", reason: "download_url_failed" });
      return ApiResponse.error(new Error("Download unavailable"), 502);
    }

    const durationMs = Date.now() - startTime;
    recordCounter(METRICS.REPORTS.DOWNLOAD, 1, { outcome: "success" });
    recordTimer(METRICS.REPORTS.DOWNLOAD + '.duration', durationMs, { outcome: "success" });

    return NextResponse.redirect(downloadUrl, {
      headers: { 'X-Duration-Ms': durationMs.toString() }
    });
  } catch (error: unknown) {
    recordCounter(METRICS.REPORTS.DOWNLOAD, 1, { outcome: "failure" });
    recordTimer(METRICS.REPORTS.DOWNLOAD + '.duration', Date.now() - startTime, { outcome: "failure" });
    return ApiResponse.error(error);
  }
}

export const GET = withLogging(getHandler, { component: "reports", operation: "download_report" });
