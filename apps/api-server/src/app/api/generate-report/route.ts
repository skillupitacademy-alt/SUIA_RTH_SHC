import { db, exams } from "@quiz/db";
import { METRICS } from "@quiz/observability";
import { type ReportJSON } from "@quiz/types/report";
import { eq } from "drizzle-orm";
import { type NextRequest } from "next/server";

import { badRequest, forbidden, notFound, unauthorized } from "@/lib/api-error";
import { ApiResponse } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { recordCounter, recordTimer } from "@/lib/metrics";
import { redis } from "@/lib/redis";
import { getDownloadUrl } from "@/lib/storage/get-download-url";
import { uploadReport } from "@/lib/storage/upload-report";
import { withLogging } from "@/lib/withLogging";
import { TokenService } from "@/modules/auth/token.service";
import { cacheService } from "@/modules/core/cache.service";
import { container } from '@/modules/core/container';
import { resilienceManager } from "@/modules/core/resilience.manager";
import { PerformanceService } from "@/modules/report-engine/performance.service";
import { ReportPdfService } from "@/modules/report-engine/report-pdf.service";
import { ReportRepository } from "@/modules/report-engine/report-repository";
import { ReportJobService } from "@/services/reports/ReportJobService";

export const runtime = "nodejs"; // Required for Puppeteer

/**
 * POST /api/generate-report
 */
async function postHandler(req: NextRequest) {
  const start = Date.now();
  
  if (resilienceManager.isHighLoad()) {
    recordCounter(METRICS.REPORTS.FAILURES, 1, { reason: 'high_load' });
    return ApiResponse.error(
      new Error("Service unavailable"), 
      503, 
      undefined,
      { "X-Error-Message": "PDF generation is temporarily disabled due to extreme system load. Please try again in a few minutes." }
    );
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
      throw badRequest("Missing attemptId");
    }

    const internalKey = req.headers.get("x-internal-key") ?? "";
    const internalSecret = process.env.INTERNAL_API_KEY ?? "secret";
    const isInternal = internalKey !== "" && internalKey === internalSecret;
    
    let userId: string;

    if (isInternal) {
      const examData = await db.query.exams.findFirst({
        where: eq(exams.id, attemptId),
        columns: { userId: true }
      });
      if (!examData) throw notFound("Exam", attemptId);
      userId = examData.userId;
    } else {
      const token = container.get(TokenService).getAccessToken(req, { scope: "user" });
      if (token === null || token === undefined || token === "") throw unauthorized("Unauthorized");
      const payload = await container.get(TokenService).verifyUserAccessToken(token);
      if (payload === null || payload === undefined || payload.userId === null || payload.userId === undefined) {
        throw unauthorized("Unauthorized");
      }
      userId = payload.userId;
    }
    
    const exam = await db.query.exams.findFirst({
      where: eq(exams.id, attemptId),
      columns: { userId: true, status: true, reportMaterialized: true }
    });

    if (exam === null || exam === undefined) {
      throw notFound("Exam", attemptId);
    }

    if (exam.userId !== userId) {
      throw forbidden("Unauthorized or not found");
    }

    if (exam.status !== "completed") {
      throw badRequest("Exam is not completed");
    }

    const { count, ttlRem } = await cacheService.increment(`ratelimit:pdf:${userId}`, 60000);
    if (count > 3) {
      recordCounter(METRICS.REPORTS.FAILURES, 1, { reason: 'rate_limit' });
      return ApiResponse.error(
        new Error("Rate limit exceeded"), 
        429, 
        undefined,
        { 
          'Retry-After': ttlRem.toString(),
          'X-Error-Message': `Next report available in ${ttlRem} seconds.`
        }
      );
    }

    if (force) {
      logger.info({ attemptId }, "[GenerateReport] Forced regeneration: Invalidating analytics cache");
      await container.get(PerformanceService).invalidateCache(attemptId);
      await container.get(PerformanceService).refreshAnalytics(); 
    }

    const report = await ReportRepository.getReportByAttempt(attemptId);
    const hasFileRef = report !== null && report !== undefined && report.fileRef !== null && report.fileRef !== undefined && report.fileRef !== "";
    if (!force && report?.status === "ready" && hasFileRef) {
      const url = await getDownloadUrl(report.fileRef as string);
      recordCounter(METRICS.REPORTS.PDF_GEN, 1, { outcome: 'success', cached: 'true' });
      return ApiResponse.success({ url, cached: true });
    }

    const materialized = exam.reportMaterialized as ReportJSON | null;
    const depth = materialized?.meta?.depth ?? 1;

    if (depth > 1) {
      logger.info({ attemptId, depth }, "[GenerateReport] Hierarchical depth detected, queueing job");
      const jobId = await ReportJobService.createJob(attemptId, userId);
      recordCounter(METRICS.REPORTS.PDF_GEN, 1, { outcome: 'queued' });
      return ApiResponse.success({ 
        status: "queued", 
        jobId, 
        message: "Hierarchical report generation initiated. This may take a few minutes." 
      }, 202);
    }

    const lockKey = `lock:pdf:${attemptId}`;
    const acquired = await redis.set(lockKey, "1", { nx: true, ex: 120 });
    
    if (acquired == null) {
      return ApiResponse.success({ status: "generating", message: "Generation already in progress" });
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
      return ApiResponse.success({ url, cached: false });

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error({ err: error, attemptId }, "[GenerateReport] Generation failed");
      await ReportRepository.updateReportStatus(attemptId, "failed", message).catch(() => {});
      recordCounter(METRICS.REPORTS.FAILURES, 1, { reason: 'generation_failed' });
      return ApiResponse.error(error);
    } finally {
      await redis.del(lockKey).catch(() => {});
    }

  } catch (error: unknown) {
    logger.error({ err: error }, "[GenerateReport] API Error");
    recordCounter(METRICS.REPORTS.FAILURES, 1, { reason: 'internal_error' });
    return ApiResponse.error(error);
  }
}

export const POST = withLogging(postHandler, { component: 'reports', operation: 'generate_pdf' });
