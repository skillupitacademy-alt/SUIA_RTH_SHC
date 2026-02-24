import { db, exams } from "@quiz/db";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { redis } from "@/lib/redis";
import { getDownloadUrl } from "@/lib/storage/get-download-url";
import { uploadReport } from "@/lib/storage/upload-report";
import { TokenService } from "@/modules/auth/token.service";
import { cacheService } from "@/modules/core/cache.service";
import { PerformanceService } from "@/modules/report-engine/performance.service";
import { ReportPdfService } from "@/modules/report-engine/report-pdf.service";
import { ReportRepository } from "@/modules/report-engine/report-repository";

export const runtime = "nodejs"; // Required for Puppeteer

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { attemptId?: string };
    const attemptId = body?.attemptId ?? "";

    if (attemptId === "") {
      return NextResponse.json({ error: "Missing attemptId" }, { status: 400 });
    }

    // 1. Ownership/System Validation
    const internalKey = req.headers.get("x-internal-key") ?? "";
    const isInternal =
      process.env.INTERNAL_API_KEY != null
        ? internalKey === process.env.INTERNAL_API_KEY
        : internalKey === "secret";
    
    let userId: string;

    if (isInternal) {
      const examData = await db.query.exams.findFirst({
        where: eq(exams.id, attemptId),
        columns: { userId: true }
      });
      if (!examData) return NextResponse.json({ error: "Exam not found" }, { status: 404 });
      userId = examData.userId;
    } else {
      const token = TokenService.getAccessToken(req, { scope: "user" });
      if (token == null || token === "") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const payload = await TokenService.verifyAccessToken(token, false);
      userId = payload.userId;
    }
    
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

    // 2. Rate Limiting (3 per min)
    const { count = 0 } = await cacheService.increment(`ratelimit:pdf:${userId}`, 60000);
    if (count !== null && count > 3) {
      return NextResponse.json({ error: "Rate limit exceeded. Please wait a minute." }, { status: 429 });
    }

    // 3. Idempotency Check
    const force = (body as { force?: boolean })?.force === true;
    
    if (force) {
      logger.info({ attemptId }, "[GenerateReport] Forced regeneration: Invalidating analytics cache");
      await PerformanceService.invalidateCache(attemptId);
      await PerformanceService.refreshAnalytics(); // Refresh MVs to ensure fresh data for PDF
    }

    const report = await ReportRepository.getReportByAttempt(attemptId);
    if (!force && report?.status === "ready" && report.fileRef != null && report.fileRef !== "") {
      const url = await getDownloadUrl(report.fileRef);
      return NextResponse.json({ url, cached: true });
    }

    // 4. Redis Locking (Prevent duplicate runs)
    const lockKey = `lock:pdf:${attemptId}`;
    const acquired = await redis.set(lockKey, "1", { nx: true, ex: 120 });
    
    if (acquired == null) {
      return NextResponse.json({ status: "generating", message: "Generation already in progress" });
    }

    try {
      // 5. State Machine: pending -> generating
      await ReportRepository.createReportIfNotExists({ attemptId, userId: userId, status: "generating" });
      await ReportRepository.updateReportStatus(attemptId, "generating");

      // 6. PDF Generation
      const { buffer, generationTimeMs, fileSizeKb, pageCount } = await ReportPdfService.generate(attemptId);

      if (fileSizeKb > 2048) { // 2MB guard per SLO
        throw new Error("Generated PDF exceeds size constraints (2MB)");
      }

      // 7. Storage Upload
      const fileRef = await uploadReport(buffer, userId, attemptId);

      // 8. Success Update
      await ReportRepository.updateReportSuccess(attemptId, {
        fileRef,
        generationTimeMs,
        fileSizeKb,
        pageCount
      });

      const url = await getDownloadUrl(fileRef);
      return NextResponse.json({ url, cached: false });

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error({ err: error, attemptId }, "[GenerateReport] Generation failed");
      await ReportRepository.updateReportStatus(attemptId, "failed", message);
      return NextResponse.json({ error: "Failed to generate report", message }, { status: 500 });
    } finally {
      // 9. Release Lock
      await redis.del(lockKey);
    }

  } catch (error: unknown) {
    logger.error({ err: error }, "[GenerateReport] API Error");
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
