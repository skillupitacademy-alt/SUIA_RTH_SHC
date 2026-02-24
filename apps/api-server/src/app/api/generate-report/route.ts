import { db, exams } from "@quiz/db";
import { ReportJSON } from "@quiz/types/report";
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
import { ReportJobService } from "@/services/reports/ReportJobService";

export const runtime = "nodejs"; // Required for Puppeteer

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const raw = await req.json().catch(() => ({} as unknown));
    const body = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};

    const attemptFromBody = typeof body.attemptId === "string" ? body.attemptId : "";
    const attemptFromParams = searchParams.get("id") ?? searchParams.get("attemptId") ?? "";
    const attemptId = (attemptFromBody || attemptFromParams).trim();

    const isTrue = (val: unknown) => val === true || val === "true";
    const force = isTrue(body.force) || searchParams.get("force") === "true";

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
      columns: { userId: true, status: true, reportMaterialized: true }
    });

    if (!exam || exam.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized or not found" }, { status: 403 });
    }

    if (exam.status !== "completed") {
      return NextResponse.json({ error: "Exam is not completed" }, { status: 400 });
    }

    // 2. Rate Limiting (3 per min)
    const { count, ttlRem } = await cacheService.increment(`ratelimit:pdf:${userId}`, 60000);
    if (count > 3) {
      return NextResponse.json({ 
        error: "Rate limit exceeded", 
        retryAfter: ttlRem,
        message: `Next report available in ${ttlRem} seconds.`
      }, { status: 429 });
    }

    // 3. Idempotency Check
    // force is already extracted from body/params above
    
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

    // 3.5 Hierarchical Depth Check
    const materialized = exam.reportMaterialized as ReportJSON | null;
    const depth = materialized?.meta?.depth ?? 1;

    if (depth > 1) {
      logger.info({ attemptId, depth }, "[GenerateReport] Hierarchical depth detected, queueing job");
      const jobId = await ReportJobService.createJob(attemptId, userId);
      return NextResponse.json({ 
        status: "queued", 
        jobId, 
        message: "Hierarchical report generation initiated. This may take a few minutes." 
      }, { status: 202 });
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
