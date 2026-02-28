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
import { resilienceManager } from "@/modules/core/resilience.manager";
import { PerformanceService } from "@/modules/report-engine/performance.service";
import { ReportPdfService } from "@/modules/report-engine/report-pdf.service";
import { ReportRepository } from "@/modules/report-engine/report-repository";
import { ReportJobService } from "@/services/reports/ReportJobService";

export const runtime = "nodejs"; // Required for Puppeteer

import { METRICS } from "@quiz/observability";

import { recordCounter, recordTimer } from "@/lib/metrics";
import { withLogging } from "@/lib/withLogging";

async function handler(req: NextRequest) {
  const start = Date.now();
  if (resilienceManager.isHighLoad()) {
    recordCounter(METRICS.REPORTS.FAILURES, 1, { reason: 'high_load' });
    return NextResponse.json({ 
        error: "Service unavailable", 
        message: "PDF generation is temporarily disabled due to extreme system load. Please try again in a few minutes." 
    }, { status: 503 });
  }
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

    const { count, ttlRem } = await cacheService.increment(`ratelimit:pdf:${userId}`, 60000);
    if (count > 3) {
      recordCounter(METRICS.REPORTS.FAILURES, 1, { reason: 'rate_limit' });
      return NextResponse.json({ 
        error: "Rate limit exceeded", 
        retryAfter: ttlRem,
        message: `Next report available in ${ttlRem} seconds.`
      }, { status: 429 });
    }

    if (force) {
      logger.info({ attemptId }, "[GenerateReport] Forced regeneration: Invalidating analytics cache");
      await PerformanceService.invalidateCache(attemptId);
      await PerformanceService.refreshAnalytics(); 
    }

    const report = await ReportRepository.getReportByAttempt(attemptId);
    if (!force && report?.status === "ready" && report.fileRef != null && report.fileRef !== "") {
      const url = await getDownloadUrl(report.fileRef);
      recordCounter(METRICS.REPORTS.PDF_GEN, 1, { outcome: 'success', cached: 'true' });
      return NextResponse.json({ url, cached: true });
    }

    const materialized = exam.reportMaterialized as ReportJSON | null;
    const depth = materialized?.meta?.depth ?? 1;

    if (depth > 1) {
      logger.info({ attemptId, depth }, "[GenerateReport] Hierarchical depth detected, queueing job");
      const jobId = await ReportJobService.createJob(attemptId, userId);
      recordCounter(METRICS.REPORTS.PDF_GEN, 1, { outcome: 'queued' });
      return NextResponse.json({ 
        status: "queued", 
        jobId, 
        message: "Hierarchical report generation initiated. This may take a few minutes." 
      }, { status: 202 });
    }

    const lockKey = `lock:pdf:${attemptId}`;
    const acquired = await redis.set(lockKey, "1", { nx: true, ex: 120 });
    
    if (acquired == null) {
      return NextResponse.json({ status: "generating", message: "Generation already in progress" });
    }

    try {
      await ReportRepository.createReportIfNotExists({ attemptId, userId: userId, status: "generating" });
      await ReportRepository.updateReportStatus(attemptId, "generating");

      const { buffer, generationTimeMs, fileSizeKb, pageCount } = await ReportPdfService.generate(attemptId);

      if (fileSizeKb > 10240) { 
        throw new Error("Generated PDF exceeds size constraints (10MB)");
      }

      const fileRef = await uploadReport(buffer, userId, attemptId);

      await ReportRepository.updateReportSuccess(attemptId, {
        fileRef,
        generationTimeMs,
        fileSizeKb,
        pageCount
      });

      const url = await getDownloadUrl(fileRef);
      recordCounter(METRICS.REPORTS.PDF_GEN, 1, { outcome: 'success', cached: 'false' });
      recordTimer(METRICS.REPORTS.PDF_GEN + '.duration', Date.now() - start, { outcome: 'success' });
      return NextResponse.json({ url, cached: false });

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error({ err: error, attemptId }, "[GenerateReport] Generation failed");
      await ReportRepository.updateReportStatus(attemptId, "failed", message);
      recordCounter(METRICS.REPORTS.FAILURES, 1, { reason: 'generation_failed' });
      return NextResponse.json({ error: "Failed to generate report", message }, { status: 500 });
    } finally {
      await redis.del(lockKey);
    }

  } catch (error: unknown) {
    logger.error({ err: error }, "[GenerateReport] API Error");
    const message = error instanceof Error ? error.message : "Internal Server Error";
    recordCounter(METRICS.REPORTS.FAILURES, 1, { reason: 'internal_error' });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = withLogging(handler, { component: 'reports', operation: 'generate_pdf' });
